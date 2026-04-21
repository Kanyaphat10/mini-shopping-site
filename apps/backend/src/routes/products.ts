import { Elysia, t } from 'elysia'
import { PrismaClient } from '@prisma/client'
import { CreateProductSchema } from '../utils/schemas'

export const productRoutes = new Elysia({ prefix: '/products' })
  .get('/', async ({ prisma }: { prisma: PrismaClient }) => {
    try {
      const products = await prisma.product.findMany({
        select: {
          id: true,
          name: true,
          description: true,
          price: true,
          image: true,
          stock: true,
        },
      })
      return products
    } catch (error: any) {
      return { error: error.message }
    }
  })
  .get('/:id', async ({ params: { id }, prisma }: { params: any; prisma: PrismaClient }) => {
    try {
      const product = await prisma.product.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          description: true,
          price: true,
          image: true,
          stock: true,
        },
      })
      return product
    } catch (error: any) {
      return { error: error.message }
    }
  })
  .post(
    '/',
    async ({ body, prisma }: { body: any; prisma: PrismaClient }) => {
      try {
        const validated = CreateProductSchema.parse(body)
        const product = await prisma.product.create({
          data: validated,
        })
        return product
      } catch (error: any) {
        return { error: error.message }
      }
    },
    {
      body: t.Object({
        name: t.String(),
        description: t.String(),
        price: t.Number(),
        stock: t.Number(),
        image: t.Optional(t.String()),
      }),
    }
  )
  .put(
    '/:id',
    async ({ params: { id }, body, prisma }: { params: any; body: any; prisma: PrismaClient }) => {
      try {
        const product = await prisma.product.update({
          where: { id },
          data: body,
        })
        return product
      } catch (error: any) {
        return { error: error.message }
      }
    },
    {
      body: t.Partial(t.Object({
        name: t.String(),
        description: t.String(),
        price: t.Number(),
        stock: t.Number(),
        image: t.String(),
      })),
    }
  )
  .delete('/:id', async ({ params: { id }, prisma }: { params: any; prisma: PrismaClient }) => {
    try {
      await prisma.product.delete({
        where: { id },
      })
      return { success: true }
    } catch (error: any) {
      return { error: error.message }
    }
  })
