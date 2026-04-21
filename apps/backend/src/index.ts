import Elysia from 'elysia'
import { PrismaClient } from '@prisma/client'
import { authRoutes } from './routes/auth'
import { productRoutes } from './routes/products'
import { cartRoutes } from './routes/cart'
import { orderRoutes } from './routes/orders'
import { shipmentRoutes } from './routes/shipments'
import { adminRoutes } from './routes/admin'

const prisma = new PrismaClient()

const app = new Elysia({ prefix: '/api' })
  .decorate({ prisma })
  .use(authRoutes)
  .use(productRoutes)
  .use(cartRoutes)
  .use(orderRoutes)
  .use(shipmentRoutes)
  .use(adminRoutes)
  .get('/', () => ({ message: 'Mini Shopping Site API' }))
  .options('*', () => new Response(null, { status: 200 }))
  .listen(process.env.PORT || 3001)

console.log(`Server running at http://localhost:${process.env.PORT || 3001}`)
