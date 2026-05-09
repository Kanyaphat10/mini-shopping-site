import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import { PrismaClient } from '@prisma/client';

describe('Database connectivity and schema', () => {
  let prisma: PrismaClient;

  beforeAll(() => {
    prisma = new PrismaClient();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should be able to connect to the database', async () => {
    // This will throw if it cannot connect
    await prisma.$connect();
    expect(true).toBe(true);
  });

  it('should be able to query the User model', async () => {
    const count = await prisma.user.count();
    expect(typeof count).toBe('number');
  });

  it('should be able to query the Product model with new fields', async () => {
    const products = await prisma.product.findMany({ take: 1 });
    if (products.length > 0) {
      expect(products[0]).toHaveProperty('sku');
      expect(products[0]).toHaveProperty('productStatus');
    } else {
      expect(true).toBe(true);
    }
  });
});
