import { Elysia, t } from 'elysia'
import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../utils/auth';

export const adminRoutes = new Elysia({ prefix: '/admin' })
  .get('/users', async ({ headers, prisma }: any) => {
    try {
      const token = headers['authorization']?.replace('Bearer ', '')
      if (!token) return { error: 'Unauthorized' }

      const users = await prisma.user.findMany({
        select: { id: true, email: true, name: true, role: true, createdAt: true },
      })

      return users
    } catch (error: any) {
      return { error: error.message }
    }
  })
  .get('/orders', async ({ headers, prisma }: any) => {
    try {
      const token = headers['authorization']?.replace('Bearer ', '')
      if (!token) return { error: 'Unauthorized' }

      const orders = await prisma.order.findMany({
        include: {
          user: { select: { id: true, email: true, name: true } },
          items: true,
          payment: true,
        },
      })

      return orders
    } catch (error: any) {
      return { error: error.message }
    }
  })
  .get('/stats', async ({ headers, prisma }: any) => {
    try {
      const token = headers['authorization']?.replace('Bearer ', '')
      if (!token) return { error: 'Unauthorized' }

      const totalUsers = await prisma.user.count()
      const totalOrders = await prisma.order.count()
      const totalProducts = await prisma.product.count()
      
      const totalRevenue = await prisma.order.aggregate({
        _sum: { totalPrice: true },
      })

      return {
        totalUsers,
        totalOrders,
        totalProducts,
        totalRevenue: totalRevenue._sum.totalPrice || 0,
      }
    } catch (error: any) {
      return { error: error.message }
    }
  })
  .post(
    '/seed',
    async ({ prisma }: any) => {
      try {
        await prisma.cartItem.deleteMany()
        await prisma.cart.deleteMany()
        await prisma.orderItem.deleteMany()
        await prisma.shipment.deleteMany()
        await prisma.payment.deleteMany()
        await prisma.order.deleteMany()
        await prisma.product.deleteMany()
        await prisma.user.deleteMany()

        const admin = await prisma.user.create({
          data: {
            email: 'admin@example.com',
            password: await hashPassword('admin123'),
            name: 'Admin User',
            role: 'ADMIN',
          },
        })

        const customer1 = await prisma.user.create({
          data: {
            email: 'customer@example.com',
            password: await hashPassword('password123'),
            name: 'John Doe',
            role: 'CUSTOMER',
          },
        })

        const customer2 = await prisma.user.create({
          data: {
            email: 'jane@example.com',
            password: await hashPassword('admin123'),
            name: 'Jane Smith',
            role: 'CUSTOMER',
          },
        })

        const courier = await prisma.user.create({
          data: {
            email: 'courier@example.com',
            password: await hashPassword('password123'),
            name: 'Bob Delivery',
            role: 'COURIER',
          },
        })

        const products = await Promise.all([
          prisma.product.create({
            data: {
              name: 'Laptop',
              sku: 'LAPTOP-001',
              description: 'High-performance laptop for professionals',
              price: '999.99',
              stock: 10,
              image: 'https://placehold.co/300x300?text=Laptop',
            },
          }),
          prisma.product.create({
            data: {
              name: 'Wireless Mouse',
              sku: 'MOUSE-001',
              description: 'Ergonomic wireless mouse',
              price: '29.99',
              stock: 50,
              image: 'https://placehold.co/300x300?text=Mouse',
            },
          }),
          prisma.product.create({
            data: {
              name: 'USB-C Hub',
              sku: 'HUB-001',
              description: 'Multi-port USB-C hub for connectivity',
              price: '49.99',
              stock: 30,
              image: 'https://placehold.co/300x300?text=Hub',
            },
          }),
        ])

        return {
          success: true,
          message: 'Database seeded successfully',
          data: { admin, customers: [customer1, customer2], courier, products },
        }
      } catch (error: any) {
        return { error: error.message }
      }
    }
  )
