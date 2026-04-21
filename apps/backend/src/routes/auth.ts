import { Elysia, t } from 'elysia'
import { PrismaClient } from '@prisma/client'
import {
  generateToken,
  comparePassword,
  hashPassword,
  createSession,
  validateSession,
  revokeSession,
  verifyToken,
} from '../utils/auth'
import { RegisterSchema, LoginSchema } from '../utils/schemas'

export const authRoutes = new Elysia({ prefix: '/auth' })
  // Email/Password Registration
  .post(
    '/register',
    async ({ body, prisma }: { body: any; prisma: PrismaClient }) => {
      try {
        const validated = RegisterSchema.parse(body)

        const existingUser = await prisma.user.findUnique({
          where: { email: validated.email },
        })

        if (existingUser) {
          return { error: 'User already exists' }
        }

        const hashedPassword = await hashPassword(validated.password)

        const user = await prisma.user.create({
          data: {
            email: validated.email,
            password: hashedPassword,
            name: validated.name,
          },
        })

        const token = generateToken(user.id, user.email, user.role)
        const session = await createSession(user.id)

        return {
          user: { id: user.id, email: user.email, name: user.name, role: user.role },
          token,
          sessionToken: session.token,
        }
      } catch (error: any) {
        return { error: error.message }
      }
    },
    {
      body: t.Object({
        email: t.String(),
        password: t.String(),
        name: t.String(),
      }),
    }
  )

  // Email/Password Login
  .post(
    '/login',
    async ({ body, prisma }: { body: any; prisma: PrismaClient }) => {
      try {
        const validated = LoginSchema.parse(body)

        const user = await prisma.user.findUnique({
          where: { email: validated.email },
        })

        if (!user) {
          return { error: 'Invalid credentials' }
        }

        if (!user.password) {
          return { error: 'Please use OAuth to sign in' }
        }

        const passwordMatch = await comparePassword(validated.password, user.password)

        if (!passwordMatch) {
          return { error: 'Invalid credentials' }
        }

        const token = generateToken(user.id, user.email, user.role)
        const session = await createSession(user.id)

        return {
          user: { id: user.id, email: user.email, name: user.name, role: user.role },
          token,
          sessionToken: session.token,
        }
      } catch (error: any) {
        return { error: error.message }
      }
    },
    {
      body: t.Object({
        email: t.String(),
        password: t.String(),
      }),
    }
  )

  // Get Current User from JWT
  .get('/me', async ({ headers, prisma }: { headers: any; prisma: PrismaClient }) => {
    try {
      const authHeader = headers['authorization']
      const token = authHeader?.replace('Bearer ', '')

      if (!token) {
        return { error: 'Unauthorized' }
      }

      const payload = verifyToken(token)

      if (!payload) {
        return { error: 'Invalid token' }
      }

      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
      })

      if (!user) {
        return { error: 'User not found' }
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      }
    } catch (error: any) {
      return { error: error.message }
    }
  })

  // Logout (revoke session)
  .post(
    '/logout',
    async ({ headers, prisma }: { headers: any; prisma: PrismaClient }) => {
      try {
        const sessionToken = headers['x-session-token']

        if (sessionToken) {
          await revokeSession(sessionToken)
        }

        return { success: true }
      } catch (error: any) {
        return { error: error.message }
      }
    }
  )

  // Google OAuth Callback
  .post(
    '/google/callback',
    async ({ body, prisma }: { body: any; prisma: PrismaClient }) => {
      try {
        const { email, name, id: googleId } = body

        if (!email || !googleId) {
          return { error: 'Invalid OAuth data' }
        }

        // Find or create OAuth account
        let user = await prisma.user.findUnique({
          where: { email },
        })

        if (!user) {
          // Create new user with OAuth
          user = await prisma.user.create({
            data: {
              email,
              name: name || email.split('@')[0],
              password: null,
            },
          })
        }

        // Create or update OAuth account
        await prisma.oAuthAccount.upsert({
          where: {
            provider_providerAccountId: {
              provider: 'google',
              providerAccountId: googleId,
            },
          },
          create: {
            userId: user.id,
            provider: 'google',
            providerAccountId: googleId,
            email,
            name,
          },
          update: {
            email,
            name,
          },
        })

        const token = generateToken(user.id, user.email, user.role)
        const session = await createSession(user.id)

        return {
          user: { id: user.id, email: user.email, name: user.name, role: user.role },
          token,
          sessionToken: session.token,
        }
      } catch (error: any) {
        return { error: error.message }
      }
    },
    {
      body: t.Object({
        email: t.String(),
        name: t.String(),
        id: t.String(),
      }),
    }
  )

  // Validate Session
  .get(
    '/session/validate',
    async ({ headers, prisma }: { headers: any; prisma: PrismaClient }) => {
      try {
        const sessionToken = headers['x-session-token']

        if (!sessionToken) {
          return { valid: false, error: 'No session token' }
        }

        const session = await validateSession(sessionToken)

        if (!session) {
          return { valid: false, error: 'Session expired or invalid' }
        }

        return {
          valid: true,
          user: {
            id: session.user.id,
            email: session.user.email,
            name: session.user.name,
            role: session.user.role,
          },
        }
      } catch (error: any) {
        return { valid: false, error: error.message }
      }
    }
  )
