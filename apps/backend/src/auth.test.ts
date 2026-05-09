import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import { PrismaClient } from '@prisma/client';
import { generateToken, verifyToken } from './utils/auth';

describe('Auth Utilities and Flows', () => {
  let prisma: PrismaClient;

  beforeAll(() => {
    prisma = new PrismaClient();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should generate and verify a JWT token', () => {
    const token = generateToken('test-id', 'test@example.com', 'CUSTOMER');
    expect(typeof token).toBe('string');

    const payload = verifyToken(token);
    expect(payload).not.toBeNull();
    if (payload) {
      expect(payload.userId).toBe('test-id');
      expect(payload.email).toBe('test@example.com');
      expect(payload.role).toBe('CUSTOMER');
    }
  });

  it('should reject invalid JWT tokens', () => {
    const payload = verifyToken('invalid-token-string');
    expect(payload).toBeNull();
  });
});
