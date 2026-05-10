import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import { Elysia } from 'elysia';
import { PrismaClient } from '@prisma/client';
import { orderRoutes } from './routes/orders';
import { cartRoutes } from './routes/cart';
import { generateToken } from './utils/auth';

const prisma = new PrismaClient();

describe('Concurrency and Stock Protection', () => {
  let app: any;
  let user1: any, user2: any;
  let token1: string, token2: string;
  let productId: string;

  beforeAll(async () => {
    app = new Elysia().decorate({ prisma }).use(cartRoutes).use(orderRoutes);

    // Create 2 test users
    user1 = await prisma.user.create({
      data: { email: `u1-${Date.now()}@test.com`, name: 'User 1', password: 'password' }
    });
    user2 = await prisma.user.create({
      data: { email: `u2-${Date.now()}@test.com`, name: 'User 2', password: 'password' }
    });

    token1 = generateToken(user1.id, user1.email, user1.role);
    token2 = generateToken(user2.id, user2.email, user2.role);

    // Create product with stock of 1
    const product = await prisma.product.create({
      data: {
        name: 'Rare Item',
        description: 'Only one left',
        price: '100.00',
        stock: 1,
        sku: `RARE-${Date.now()}`
      }
    });
    productId = product.id;
  });

  afterAll(async () => {
    await prisma.order.deleteMany({ where: { userId: { in: [user1.id, user2.id] } } });
    await prisma.cart.deleteMany({ where: { userId: { in: [user1.id, user2.id] } } });
    await prisma.product.delete({ where: { id: productId } });
    await prisma.user.deleteMany({ where: { id: { in: [user1.id, user2.id] } } });
    await prisma.$disconnect();
  });

  it('should prevent overselling when two users checkout simultaneously', async () => {
    // Both users add the item to cart
    await app.handle(new Request('http://localhost/cart/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token1}` },
      body: JSON.stringify({ productId, quantity: 1 })
    }));
    await app.handle(new Request('http://localhost/cart/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token2}` },
      body: JSON.stringify({ productId, quantity: 1 })
    }));

    // Start checkout for both at the same time
    const checkoutReq1 = new Request('http://localhost/orders/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token1}` },
      body: JSON.stringify({ shippingAddr: 'User 1 Address' })
    });
    const checkoutReq2 = new Request('http://localhost/orders/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token2}` },
      body: JSON.stringify({ shippingAddr: 'User 2 Address' })
    });

    const [res1, res2] = await Promise.all([
      app.handle(checkoutReq1),
      app.handle(checkoutReq2)
    ]);

    const data1 = await res1.json();
    const data2 = await res2.json();

    // One should succeed, one should fail with INSUFFICIENT_STOCK
    const success = data1.id ? data1 : data2;
    const failure = data1.error ? data1 : data2;

    expect(success.id).toBeDefined();
    expect(failure.error).toBe('INSUFFICIENT_STOCK');
    expect(failure.details[0].name).toBe('Rare Item');
    expect(failure.details[0].available).toBe(0);

    // Verify stock is exactly 0, not negative
    const finalProduct = await prisma.product.findUnique({ where: { id: productId } });
    expect(finalProduct?.stock).toBe(0);
  });
});
