import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import { Elysia } from 'elysia';
import { PrismaClient } from '@prisma/client';
import { orderRoutes } from './routes/orders';
import { cartRoutes } from './routes/cart';
import { generateToken } from './utils/auth';

const prisma = new PrismaClient();

describe('Checkout and Cart Flow', () => {
  let app: Elysia;
  let testUserId: string;
  let token: string;
  let testProductId: string;

  beforeAll(async () => {
    app = new Elysia().decorate({ prisma }).use(cartRoutes).use(orderRoutes);

    // Create a test user
    const user = await prisma.user.create({
      data: {
        email: `test-checkout-${Date.now()}@example.com`,
        name: 'Test Checkout User',
        password: 'password123',
      },
    });
    testUserId = user.id;
    token = generateToken(user.id, user.role);

    // Create a test product with limited stock
    const product = await prisma.product.create({
      data: {
        name: 'Test Product for Checkout',
        description: 'Testing checkout stock validation',
        price: '50.00',
        stock: 2,
        sku: `TEST-SKU-${Date.now()}`,
      },
    });
    testProductId = product.id;
  });

  afterAll(async () => {
    await prisma.order.deleteMany({ where: { userId: testUserId } });
    await prisma.cart.deleteMany({ where: { userId: testUserId } });
    await prisma.product.delete({ where: { id: testProductId } });
    await prisma.user.delete({ where: { id: testUserId } });
    await prisma.$disconnect();
  });

  it('should add item to cart', async () => {
    const response = await app.handle(
      new Request('http://localhost/cart/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ productId: testProductId, quantity: 1 }),
      })
    );
    expect(response.status).toBe(200);
    const data: any = await response.json();
    expect(data.productId).toBe(testProductId);
    expect(data.quantity).toBe(1);
  });

  it('should update cart item quantity', async () => {
    // First, get the cart to find the item ID
    const cartRes = await app.handle(
      new Request('http://localhost/cart/', {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      })
    );
    const cart: any = await cartRes.json();
    const itemId = cart.items[0].id;

    const response = await app.handle(
      new Request(`http://localhost/cart/item/${itemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ quantity: 3 }), // More than stock!
      })
    );
    expect(response.status).toBe(200);
    const data: any = await response.json();
    expect(data.quantity).toBe(3);
  });

  it('should fail checkout if stock is insufficient', async () => {
    const response = await app.handle(
      new Request('http://localhost/orders/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ shippingAddr: '123 Test Ave' }),
      })
    );
    expect(response.status).toBe(200); // Elysia handles this cleanly
    const data: any = await response.json();
    expect(data.error).toContain('does not have enough quantity');
  });

  it('should succeed checkout with valid stock and clear cart', async () => {
    // Reduce quantity back to 2 (which is the stock)
    const cartRes = await app.handle(
      new Request('http://localhost/cart/', {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      })
    );
    const cart: any = await cartRes.json();
    const itemId = cart.items[0].id;

    await app.handle(
      new Request(`http://localhost/cart/item/${itemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ quantity: 2 }),
      })
    );

    const response = await app.handle(
      new Request('http://localhost/orders/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ shippingAddr: '123 Test Ave' }),
      })
    );
    expect(response.status).toBe(200);
    const data: any = await response.json();
    expect(data.id).toBeDefined();
    expect(data.shippingAddr).toBe('123 Test Ave');
    expect(data.items.length).toBe(1);

    // Verify stock is decremented
    const product = await prisma.product.findUnique({ where: { id: testProductId } });
    expect(product?.stock).toBe(0);

    // Verify cart is cleared
    const cartVerify = await app.handle(
      new Request('http://localhost/cart/', {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      })
    );
    const cartData: any = await cartVerify.json();
    expect(cartData.items.length).toBe(0);
  });
});
