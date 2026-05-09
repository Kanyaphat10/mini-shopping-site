import { Elysia, t } from 'elysia'
import { PrismaClient } from '@prisma/client'
import { CreateOrderSchema } from '../utils/schemas'
import { verifyToken } from '../utils/auth'

export const orderRoutes = new Elysia({ prefix: '/orders' })
  .get('/', async ({ headers, prisma }: { headers: any; prisma: PrismaClient }) => {
    try {
      const token = headers['authorization']?.replace('Bearer ', '')
      if (!token) return { error: 'Unauthorized' }

      const payload = verifyToken(token)
      if (!payload) return { error: 'Invalid token' }
      const userId = payload.userId

      const orders = await prisma.order.findMany({
        where: { userId },
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
  .get('/:id', async ({ params: { id }, headers, prisma }: { params: any; headers: any; prisma: PrismaClient }) => {
    try {
      const token = headers['authorization']?.replace('Bearer ', '')
      if (!token) return { error: 'Unauthorized' }

      const order = await prisma.order.findUnique({
        where: { id },
        include: {
          items: { include: { product: true } },
          payment: true,
          shipment: true,
        },
      })

      return order
    } catch (error: any) {
      return { error: error.message }
    }
  })
  .post(
    '/create',
    async ({ body, headers, prisma }: { body: any; headers: any; prisma: PrismaClient }) => {
      try {
        const token = headers['authorization']?.replace('Bearer ', '')
        if (!token) return { error: 'Unauthorized' }

        const validated = CreateOrderSchema.parse(body)
        const payload = verifyToken(token)
        if (!payload) return { error: 'Invalid token' }
        const userId = payload.userId

        const cart = await prisma.cart.findUnique({
          where: { userId },
          include: { items: { include: { product: true } } },
        })

        if (!cart || cart.items.length === 0) {
          return { error: 'Cart is empty' }
        }

        const totalPrice = cart.items.reduce((sum: number, item: any) => 
          sum + (Number(item.product.price) * item.quantity), 0
        )

        const order = await prisma.order.create({
          data: {
            userId,
            shippingAddr: validated.shippingAddr,
            totalPrice: totalPrice.toString(),
            items: {
              create: cart.items.map((item: any) => ({
                productId: item.productId,
                quantity: item.quantity,
                price: item.product.price,
              })),
            },
            payment: {
              create: {
                amount: totalPrice.toString(),
              },
            },
          },
          include: { items: true, payment: true },
        })

        await prisma.cartItem.deleteMany({
          where: { cartId: cart.id },
        })

        return order
      } catch (error: any) {
        return { error: error.message }
      }
    },
    {
      body: t.Object({
        shippingAddr: t.String(),
      }),
    }
  )
  .put(
    '/:id/status',
    async ({ params: { id }, body, prisma }: { params: any; body: any; prisma: PrismaClient }) => {
      try {
        const order = await prisma.order.update({
          where: { id },
          data: { status: body.status },
        })
        return order
      } catch (error: any) {
        return { error: error.message }
      }
    },
    {
      body: t.Object({
        status: t.Enum(['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED']),
      }),
    }
  )
