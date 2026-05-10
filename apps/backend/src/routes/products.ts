import { Elysia, t } from 'elysia'
import { PrismaClient } from '@prisma/client'
import { getCurrentUser } from '../utils/auth'

export const productRoutes = new Elysia({ prefix: '/products' })
  .get('/', async ({ headers, prisma }: any) => {
    try {
      const authHeader = headers['authorization']
      const token = authHeader?.replace('Bearer ', '')
      const user = await getCurrentUser(token)
      
      const isAdmin = user?.role === 'ADMIN'

      const products = await prisma.product.findMany({
        where: isAdmin ? {} : { productStatus: { not: 'HIDDEN' } },
        select: {
          id: true,
          sku: true,
          name: true,
          description: true,
          price: true,
          image: true,
          stock: true,
          productStatus: true,
        },
      })
      return products
    } catch (error: any) {
      return { error: error.message }
    }
  })
  .get('/:id', async ({ params: { id }, headers, prisma, set }: any) => {
    try {
      const authHeader = headers['authorization']
      const token = authHeader?.replace('Bearer ', '')
      const user = await getCurrentUser(token)
      
      const isAdmin = user?.role === 'ADMIN'

      const product = await prisma.product.findUnique({
        where: { id },
      })

      if (!product || (!isAdmin && product.productStatus === 'HIDDEN')) {
        set.status = 404
        return { error: 'Product not found' }
      }

      return product
    } catch (error: any) {
      return { error: error.message }
    }
  })
  .post(
    '/',
    async ({ headers, body, prisma, set }: any) => {
      try {
        const authHeader = headers['authorization']
        const token = authHeader?.replace('Bearer ', '')
        const user = await getCurrentUser(token)

        if (user?.role !== 'ADMIN') {
          set.status = 403
          return { error: 'Forbidden' }
        }

        const product = await prisma.product.create({
          data: {
            ...body,
            productStatus: body.productStatus || 'ACTIVE'
          },
        })
        return product
      } catch (error: any) {
        set.status = 400
        return { error: error.message }
      }
    },
    {
      body: t.Object({
        sku: t.String(),
        name: t.String(),
        description: t.String(),
        price: t.Number(),
        stock: t.Number(),
        image: t.Optional(t.String()),
        productStatus: t.Optional(t.String()),
      }),
    }
  )
  .put(
    '/:id',
    async ({ params: { id }, headers, body, prisma, set }: any) => {
      try {
        const authHeader = headers['authorization']
        const token = authHeader?.replace('Bearer ', '')
        const user = await getCurrentUser(token)

        if (user?.role !== 'ADMIN') {
          set.status = 403
          return { error: 'Forbidden' }
        }

        const product = await prisma.product.update({
          where: { id },
          data: body,
        })
        return product
      } catch (error: any) {
        set.status = 400
        return { error: error.message }
      }
    },
    {
      body: t.Partial(t.Object({
        sku: t.String(),
        name: t.String(),
        description: t.String(),
        price: t.Number(),
        stock: t.Number(),
        image: t.String(),
        productStatus: t.String(),
      })),
    }
  )
  .delete('/:id', async ({ params: { id }, headers, prisma, set }: any) => {
    try {
      const authHeader = headers['authorization']
      const token = authHeader?.replace('Bearer ', '')
      const user = await getCurrentUser(token)

      if (user?.role !== 'ADMIN') {
        set.status = 403
        return { error: 'Forbidden' }
      }

      await prisma.product.delete({
        where: { id },
      })
      return { success: true }
    } catch (error: any) {
      set.status = 400
      return { error: error.message }
    }
  })
