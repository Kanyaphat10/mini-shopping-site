import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import { Elysia } from 'elysia';
import { PrismaClient } from '@prisma/client';
import { authRoutes } from './routes/auth';
import { hashPassword } from './utils/auth';

const prisma = new PrismaClient();

describe('Account Lockout Policy', () => {
  let app: any;
  const testEmail = `lockout-${Date.now()}@example.com`;
  const password = 'correct-password';

  beforeAll(async () => {
    app = new Elysia().decorate({ prisma }).use(authRoutes);
    
    const hashedPassword = await hashPassword(password);
    await prisma.user.create({
      data: {
        email: testEmail,
        name: 'Lockout User',
        password: hashedPassword
      }
    });
  });

  afterAll(async () => {
    await prisma.user.delete({ where: { email: testEmail } });
    await prisma.$disconnect();
  });

  it('should lock account after 5 failed attempts', async () => {
    // 5 failed attempts
    for (let i = 0; i < 5; i++) {
      const response = await app.handle(
        new Request('http://localhost/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: testEmail, password: 'wrong-password' })
        })
      );
      
      const data = await response.json();
      if (i < 4) {
        expect(response.status).toBe(200);
        expect(data.error).toBe('Invalid credentials');
      } else {
        expect(response.status).toBe(423);
        expect(data.error).toBe('ACCOUNT_LOCKED');
        expect(data.message).toContain('Account locked');
      }
    }

    // Try correct password while locked
    const lockedResponse = await app.handle(
      new Request('http://localhost/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testEmail, password })
      })
    );
    expect(lockedResponse.status).toBe(423);
    const lockedData = await lockedResponse.json();
    expect(lockedData.error).toBe('ACCOUNT_LOCKED');
    expect(lockedData.message).toContain('try again in');
  });

  it('should reset failed attempts on successful login', async () => {
     // Manually reset lockout for this part of the test
     await prisma.user.update({
       where: { email: testEmail },
       data: { failedLoginAttempts: 0, lockoutUntil: null }
     });

     // Fail 2 times
     for (let i = 0; i < 2; i++) {
       await app.handle(
         new Request('http://localhost/auth/login', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ email: testEmail, password: 'wrong' })
         })
       );
     }

     const userBefore = await prisma.user.findUnique({ where: { email: testEmail } });
     expect(userBefore?.failedLoginAttempts).toBe(2);

     // Success login
     const response = await app.handle(
       new Request('http://localhost/auth/login', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ email: testEmail, password })
       })
     );
     expect(response.status).toBe(200);

     const userAfter = await prisma.user.findUnique({ where: { email: testEmail } });
     expect(userAfter?.failedLoginAttempts).toBe(0);
     expect(userAfter?.lockoutUntil).toBeNull();
  });
});
