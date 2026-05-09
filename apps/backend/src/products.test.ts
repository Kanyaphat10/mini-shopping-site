import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import { Elysia } from 'elysia';
import { PrismaClient } from '@prisma/client';
import { productRoutes } from './routes/products';
import { generateToken } from './utils/auth';

const prisma = new PrismaClient();

const app = new Elysia()
  .decorate({ prisma })
  .use(productRoutes);

describe('Product Routes', () => {
  let adminToken: string;
  let customerToken: string;
  let testProductId: string;

  beforeAll(async () => {
    // We assume the DB is seeded from Feature 1.
    // Let's get the admin and customer users from the DB.
    const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    const customer = await prisma.user.findFirst({ where: { role: 'CUSTOMER' } });

    if (admin) adminToken = generateToken(admin.id, admin.email, admin.role);
    if (customer) customerToken = generateToken(customer.id, customer.email, customer.role);
  });

  afterAll(async () => {
    if (testProductId) {
      await prisma.product.delete({ where: { id: testProductId } }).catch(() => {});
    }
    await prisma.$disconnect();
  });

  it('Admin should be able to create a product', async () => {
    if (!adminToken) return;

    const req = new Request('http://localhost/products/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        sku: 'TEST-SKU-1',
        name: 'Test Product',
        description: 'Testing product creation',
        price: 50.0,
        stock: 10,
        productStatus: 'ACTIVE',
      }),
    });

    const res = await app.handle(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.id).toBeDefined();
    expect(data.name).toBe('Test Product');
    testProductId = data.id;
  });

  it('Customer should not be able to create a product', async () => {
    if (!customerToken) return;

    const req = new Request('http://localhost/products/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${customerToken}`,
      },
      body: JSON.stringify({
        sku: 'TEST-SKU-2',
        name: 'Test Product 2',
        description: 'Testing',
        price: 50.0,
        stock: 10,
      }),
    });

    const res = await app.handle(req);
    expect(res.status).toBe(403);
  });

  it('Should list products, hiding HIDDEN products for non-admins', async () => {
    const req = new Request('http://localhost/products/', {
      method: 'GET',
    });

    const res = await app.handle(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
    
    // Ensure no HIDDEN products are in the list
    const hiddenProducts = data.filter((p: any) => p.productStatus === 'HIDDEN');
    expect(hiddenProducts.length).toBe(0);
  });
});
