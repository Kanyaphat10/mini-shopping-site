import { Elysia, t } from 'elysia'
import { PrismaClient } from '@prisma/client'
import { CreateOrderSchema } from '../utils/schemas'
import { verifyToken } from '../utils/auth'

export const orderRoutes = new Elysia({ prefix: '/orders' })
  .get('/', async ({ headers, prisma }: any) => {
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
  .get('/:id', async ({ params: { id }, headers, prisma }: any) => {
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
    async ({ body, headers, prisma }: any) => {
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

        // Use transaction to ensure consistency and prevent race conditions
        const result = await prisma.$transaction(async (tx: any) => {
          // Re-fetch cart and items inside the transaction to get fresh product data
          const cart = await tx.cart.findUnique({
            where: { userId },
            include: { items: { include: { product: true } } },
          })

          if (!cart || cart.items.length === 0) {
            return { error: 'Cart is empty' }
          }

          const insufficientStock: any[] = []
          
          // Re-validate stock for each item inside the transaction with FOR UPDATE locking
          for (const item of cart.items) {
            // Locking the row to prevent other transactions from reading it until we are done
            const freshProducts: any[] = await tx.$queryRaw`SELECT stock FROM "Product" WHERE id = ${item.productId} FOR UPDATE`
            const freshProduct = freshProducts[0]

            if (!freshProduct || freshProduct.stock < item.quantity) {
              insufficientStock.push({
                id: item.productId,
                name: item.product.name,
                requested: item.quantity,
                available: freshProduct?.stock ?? 0,
              })
            }
          }

          if (insufficientStock.length > 0) {
            // Throwing error inside transaction to force rollback
            const error: any = new Error('INSUFFICIENT_STOCK')
            error.details = insufficientStock
            throw error
          }

          const totalPrice = cart.items.reduce((sum: number, item: any) => 
            sum + (Number(item.product.price) * item.quantity), 0
          )

          // Decrement stock
          for (const item of cart.items) {
            await tx.product.update({
              where: { id: item.productId },
              data: { stock: { decrement: item.quantity } },
            })
          }

          const createdOrder = await tx.order.create({
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

          // Note: Cart clearing is now handled during order settlement (status = SETTLED)
          // in the status update route.
          
          return createdOrder
        })

        return result
      } catch (error: any) {
        if (error.message === 'INSUFFICIENT_STOCK') {
          return { 
            error: 'INSUFFICIENT_STOCK', 
            details: error.details 
          }
        }
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
    async ({ params: { id }, body, prisma }: any) => {
      try {
        const result = await prisma.$transaction(async (tx: any) => {
          const order = await tx.order.update({
            where: { id },
            data: { status: body.status },
          })

          // Clear cart only if order is SETTLED
          if (body.status === 'SETTLED') {
            const cart = await tx.cart.findUnique({
              where: { userId: order.userId }
            })
            if (cart) {
              await tx.cartItem.deleteMany({
                where: { cartId: cart.id }
              })
            }
          }
          return order
        })
        return result
      } catch (error: any) {
        return { error: error.message }
      }
    },
    {
      body: t.Object({
        status: t.Union([
          t.Literal('PENDING'), 
          t.Literal('CONFIRMED'), 
          t.Literal('PROCESSING'),
          t.Literal('SHIPPED'), 
          t.Literal('IN_TRANSIT'),
          t.Literal('OUT_FOR_DELIVERY'),
          t.Literal('DELIVERED'), 
          t.Literal('FAILED'),
          t.Literal('CANCELLED'),
          t.Literal('SETTLED')
        ]),
      }),
    }
  )
