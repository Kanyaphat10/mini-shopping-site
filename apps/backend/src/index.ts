import Elysia from 'elysia'
import { cors } from '@elysiajs/cors'
import { PrismaClient } from '@prisma/client'
import { authRoutes } from './routes/auth'
import { productRoutes } from './routes/products'
import { cartRoutes } from './routes/cart'
import { orderRoutes } from './routes/orders'
import { shipmentRoutes } from './routes/shipments'
import { adminRoutes } from './routes/admin'
import { usersRoutes } from './routes/users'

const prisma = new PrismaClient()

const app = new Elysia({ prefix: '/api' })
// Localhost:5173 and localhost:5174 are allowed to call the API.
  .use(cors({
    origin: ['http://localhost:5173', 'http://localhost:5174'],
    credentials: true,
  })) 
  .decorate({ prisma })
  .use(authRoutes)
  .use(productRoutes)
  .use(cartRoutes)
  .use(orderRoutes)
  .use(shipmentRoutes)
  .use(adminRoutes)
  .use(usersRoutes)
  .get('/', () => ({ message: 'Mini Shopping Site API' }))
  .listen(process.env.PORT || 3001)

console.log(`Server running at http://localhost:${process.env.PORT || 3001}`)