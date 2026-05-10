import { Elysia, t } from 'elysia'
import { PrismaClient } from '@prisma/client'
import { AddToCartSchema } from '../utils/schemas'
import { verifyToken } from '../utils/auth'

export const cartRoutes = new Elysia({ prefix: '/cart' })
  .get('/', async ({ headers, prisma }: any) => {
    try {
      const token = headers['authorization']?.replace('Bearer ', '')
      if (!token) return { error: 'Unauthorized' }

      const payload = verifyToken(token)
      if (!payload) return { error: 'Invalid token' }
      const userId = payload.userId

      const cart = await prisma.cart.findUnique({
        where: { userId },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      })

      return cart
    } catch (error: any) {
      return { error: error.message }
    }
  })
  .post(
    '/add',
    async ({ body, headers, prisma }: any) => {
      try {
        const token = headers['authorization']?.replace('Bearer ', '')
        if (!token) return { error: 'Unauthorized' }

        const validated = AddToCartSchema.parse(body)
        const payload = verifyToken(token)
        if (!payload) return { error: 'Invalid token' }
        const userId = payload.userId

        let cart = await prisma.cart.findUnique({
          where: { userId },
        })

        if (!cart) {
          cart = await prisma.cart.create({
            data: { userId },
          })
        }

        const cartItem = await prisma.cartItem.upsert({
          where: { cartId_productId: { cartId: cart.id, productId: validated.productId } },
          create: {
            cartId: cart.id,
            productId: validated.productId,
            quantity: validated.quantity,
          },
          update: {
            quantity: { increment: validated.quantity },
          },
        })

        return cartItem
      } catch (error: any) {
        return { error: error.message }
      }
    },
    {
      body: t.Object({
        productId: t.String(),
        quantity: t.Number(),
      }),
    }
  )
  .delete(
    '/item/:itemId',
    async ({ params: { itemId }, prisma }: any) => {
      try {
        await prisma.cartItem.delete({
          where: { id: itemId },
        })
        return { success: true }
      } catch (error: any) {
        return { error: error.message }
      }
    }
  )
  .put(
    '/item/:itemId',
    async ({ params: { itemId }, body, prisma }: any) => {
      try {
        const item = await prisma.cartItem.update({
          where: { id: itemId },
          data: { quantity: body.quantity },
        })
        return item
      } catch (error: any) {
        return { error: error.message }
      }
    },
    {
      body: t.Object({
        quantity: t.Number(),
      }),
    }
  )
  .post(
    '/clear',
    async ({ headers, prisma }: any) => {
      try {
        const token = headers['authorization']?.replace('Bearer ', '')
        if (!token) return { error: 'Unauthorized' }

        const payload = verifyToken(token)
        if (!payload) return { error: 'Invalid token' }
        const userId = payload.userId

        const cart = await prisma.cart.findUnique({
          where: { userId },
        })

        if (cart) {
          await prisma.cartItem.deleteMany({
            where: { cartId: cart.id },
          })
        }

        return { success: true }
      } catch (error: any) {
        return { error: error.message }
      }
    }
  )
