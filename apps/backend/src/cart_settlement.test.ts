import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import { Elysia } from 'elysia';
import { PrismaClient } from '@prisma/client';
import { orderRoutes } from './routes/orders';
import { cartRoutes } from './routes/cart';
import { generateToken } from './utils/auth';

const prisma = new PrismaClient();

describe('Cart Settlement Logic', () => {
  let app: any;
  let userId: string;
  let token: string;
  let productId: string;

  beforeAll(async () => {
    app = new Elysia().decorate({ prisma }).use(cartRoutes).use(orderRoutes);

    const user = await prisma.user.create({
      data: {
        email: `settle-${Date.now()}@test.com`,
        name: 'Settle User',
        password: 'password'
      }
    });
    userId = user.id;
    token = generateToken(user.id, user.email, user.role);

    const product = await prisma.product.create({
      data: {
        name: 'Settle Item',
        description: 'Test item',
        price: '10.00',
        stock: 10,
        sku: `SKU-${Date.now()}`
      }
    });
    productId = product.id;
  });

  afterAll(async () => {
    await prisma.order.deleteMany({ where: { userId } });
    await prisma.cart.deleteMany({ where: { userId } });
    await prisma.product.delete({ where: { id: productId } });
    await prisma.user.delete({ where: { id: userId } });
    await prisma.$disconnect();
  });

  it('should NOT clear cart immediately after order creation', async () => {
    // Add item to cart
    await app.handle(new Request('http://localhost/cart/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ productId, quantity: 2 })
    }));

    // Create order
    const orderRes = await app.handle(new Request('http://localhost/orders/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ shippingAddr: '123 Test St' })
    }));
    const order = await orderRes.json();
    expect(order.id).toBeDefined();

    // Verify cart is still there
    const cartRes = await app.handle(new Request('http://localhost/cart/', {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` }
    }));
    const cart = await cartRes.json();
    expect(cart.items.length).toBe(1);
    expect(cart.items[0].quantity).toBe(2);
  });

  it('should clear cart only after order status becomes SETTLED', async () => {
    // Get the order ID from the previous test (manually fetch latest)
    const ordersRes = await app.handle(new Request('http://localhost/orders/', {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` }
    }));
    const orders = await ordersRes.json();
    const orderId = orders[0].id;

    // Update status to SHIPPED (should NOT clear cart)
    await app.handle(new Request(`http://localhost/orders/${orderId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status: 'SHIPPED' })
    }));

    const cartMidRes = await app.handle(new Request('http://localhost/cart/', {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` }
    }));
    expect((await cartMidRes.json()).items.length).toBe(1);

    // Update status to SETTLED (should clear cart)
    await app.handle(new Request(`http://localhost/orders/${orderId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status: 'SETTLED' })
    }));

    const cartFinalRes = await app.handle(new Request('http://localhost/cart/', {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` }
    }));
    const cartFinal = await cartFinalRes.json();
    expect(cartFinal.items.length).toBe(0);
  });
});
