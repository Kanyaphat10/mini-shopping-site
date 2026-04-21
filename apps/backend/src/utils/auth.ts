import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export interface JWTPayload {
  userId: string
  email: string
  role: string
}

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'
const SESSION_EXPIRY_DAYS = 7

// JWT Token Management
export const generateToken = (userId: string, email: string, role: string): string => {
  return jwt.sign(
    { userId, email, role },
    JWT_SECRET,
    { expiresIn: '24h' }
  )
}

export const verifyToken = (token: string): JWTPayload | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload
  } catch {
    return null
  }
}

// Password Management
export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10)
  return bcrypt.hash(password, salt)
}

export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash)
}

// Session Management
export const generateSessionToken = (): string => {
  return crypto.randomBytes(32).toString('hex')
}

export const getSessionExpiry = (): Date => {
  const expiry = new Date()
  expiry.setDate(expiry.getDate() + SESSION_EXPIRY_DAYS)
  return expiry
}

export const createSession = async (userId: string) => {
  const token = generateSessionToken()
  const expiresAt = getSessionExpiry()

  const session = await prisma.session.create({
    data: {
      userId,
      token,
      expiresAt,
    },
  })

  return session
}

export const validateSession = async (token: string) => {
  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  })

  if (!session) return null
  if (new Date() > session.expiresAt) {
    await prisma.session.delete({ where: { id: session.id } })
    return null
  }

  return session
}

export const revokeSession = async (token: string) => {
  return prisma.session.delete({ where: { token } }).catch(() => null)
}

export const getCurrentUser = async (token?: string) => {
  if (!token) return null
  
  const payload = verifyToken(token)
  if (!payload) return null

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
  })
  return user
}
