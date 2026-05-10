import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import { Elysia } from 'elysia';
import { PrismaClient } from '@prisma/client';
import { authRoutes } from './routes/auth';

const prisma = new PrismaClient();

describe('Duplicate Email Handling', () => {
  let app: any;
  const testEmail = `test-duplicate-${Date.now()}@example.com`;

  beforeAll(async () => {
    app = new Elysia().decorate({ prisma }).use(authRoutes);
    
    // Create initial user
    await prisma.user.create({
      data: {
        email: testEmail,
        name: 'Initial User',
        password: 'password123'
      }
    });
  });

  afterAll(async () => {
    await prisma.user.delete({ where: { email: testEmail } });
    await prisma.$disconnect();
  });

  it('should return 409 Conflict and EMAIL_EXISTS error for duplicate registration', async () => {
    const response = await app.handle(
      new Request('http://localhost/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testEmail,
          password: 'newpassword123',
          name: 'Duplicate User'
        })
      })
    );

    expect(response.status).toBe(409);
    const data: any = await response.json();
    expect(data.error).toBe('EMAIL_EXISTS');
  });
});
