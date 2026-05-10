import { Elysia, t } from 'elysia'
import { PrismaClient } from '@prisma/client'
import { verifyToken, hashPassword } from '../utils/auth'

export const usersRoutes = new Elysia({ prefix: '/users' })
  // GET /users - Service Agent / Admin can fetch all users
  .get('/', async ({ headers, prisma }: any) => {
    try {
      const token = headers['authorization']?.replace('Bearer ', '')
      if (!token) return { error: 'Unauthorized' }

      const payload = verifyToken(token)
      if (!payload || !['ADMIN', 'SERVICE_AGENT'].includes(payload.role)) {
        return { error: 'Forbidden' }
      }

      const users = await prisma.user.findMany({
        select: { id: true, email: true, name: true, role: true, vehicleType: true, image: true, createdAt: true },
      })

      return users
    } catch (error: any) {
      return { error: error.message }
    }
  })

  // GET /users/:id - Service Agent / Admin can fetch specific user
  .get('/:id', async ({ params: { id }, headers, prisma }: any) => {
    try {
      const token = headers['authorization']?.replace('Bearer ', '')
      if (!token) return { error: 'Unauthorized' }

      const payload = verifyToken(token)
      if (!payload || !['ADMIN', 'SERVICE_AGENT'].includes(payload.role)) {
        return { error: 'Forbidden' }
      }

      const user = await prisma.user.findUnique({
        where: { id },
        select: { id: true, email: true, name: true, role: true, vehicleType: true, image: true, createdAt: true },
      })

      return user
    } catch (error: any) {
      return { error: error.message }
    }
  })

  // GET /users/:id/orders - Service Agent / Admin can fetch specific user orders
  .get('/:id/orders', async ({ params: { id }, headers, prisma }: any) => {
    try {
      const token = headers['authorization']?.replace('Bearer ', '')
      if (!token) return { error: 'Unauthorized' }

      const payload = verifyToken(token)
      if (!payload || !['ADMIN', 'SERVICE_AGENT'].includes(payload.role)) {
        return { error: 'Forbidden' }
      }

      const orders = await prisma.order.findMany({
        where: { userId: id },
        include: {
          items: { include: { product: true } },
          payment: true,
          shipment: true,
        },
      })

      return orders
    } catch (error: any) {
      return { error: error.message }
    }
  })

  // PUT /users/me - User updates own profile
  .put('/me', async ({ body, headers, prisma }: any) => {
    try {
      const token = headers['authorization']?.replace('Bearer ', '')
      if (!token) return { error: 'Unauthorized' }

      const payload = verifyToken(token)
      if (!payload) return { error: 'Invalid token' }

      const dataToUpdate: any = {}
      if (body.name) dataToUpdate.name = body.name
      if (body.password) dataToUpdate.password = await hashPassword(body.password)
      if (body.vehicleType && payload.role === 'COURIER') dataToUpdate.vehicleType = body.vehicleType
      if (body.image) dataToUpdate.image = body.image

      const updatedUser = await prisma.user.update({
        where: { id: payload.userId },
        data: dataToUpdate,
        select: { id: true, email: true, name: true, role: true, vehicleType: true, image: true },
      })

      return updatedUser
    } catch (error: any) {
      return { error: error.message }
    }
  }, {
    body: t.Object({
      name: t.Optional(t.String()),
      password: t.Optional(t.String()),
      vehicleType: t.Optional(t.String()),
      image: t.Optional(t.String()),
    })
  })

  // PUT /users/:id - Service Agent / Admin updates user profile
  .put('/:id', async ({ params: { id }, body, headers, prisma }: any) => {
    try {
      const token = headers['authorization']?.replace('Bearer ', '')
      if (!token) return { error: 'Unauthorized' }

      const payload = verifyToken(token)
      if (!payload || !['ADMIN', 'SERVICE_AGENT'].includes(payload.role)) {
        return { error: 'Forbidden' }
      }

      const updatedUser = await prisma.user.update({
        where: { id },
        data: {
          name: body.name,
          email: body.email,
          role: body.role,
          image: body.image,
        },
        select: { id: true, email: true, name: true, role: true, vehicleType: true, image: true },
      })

      return updatedUser
    } catch (error: any) {
      return { error: error.message }
    }
  }, {
    body: t.Object({
      name: t.Optional(t.String()),
      email: t.Optional(t.String()),
      role: t.Optional(t.Union([t.Literal('ADMIN'), t.Literal('CUSTOMER'), t.Literal('COURIER'), t.Literal('SERVICE_AGENT')])),
      image: t.Optional(t.String()),
    })
  })
