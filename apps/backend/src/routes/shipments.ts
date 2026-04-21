import { Elysia, t } from 'elysia'
import { PrismaClient } from '@prisma/client'
import { UpdateShipmentSchema } from '../utils/schemas'

export const shipmentRoutes = new Elysia({ prefix: '/shipments' })
  .get('/', async ({ headers, prisma }: { headers: any; prisma: PrismaClient }) => {
    try {
      const token = headers['authorization']?.replace('Bearer ', '')
      if (!token) return { error: 'Unauthorized' }

      const shipments = await prisma.shipment.findMany({
        include: { order: true, courier: true },
      })

      return shipments
    } catch (error: any) {
      return { error: error.message }
    }
  })
  .get('/:id', async ({ params: { id }, prisma }: { params: any; prisma: PrismaClient }) => {
    try {
      const shipment = await prisma.shipment.findUnique({
        where: { id },
        include: { order: true, courier: true },
      })

      return shipment
    } catch (error: any) {
      return { error: error.message }
    }
  })
  .post(
    '/:orderId/assign',
    async ({ params: { orderId }, body, prisma }: { params: any; body: any; prisma: PrismaClient }) => {
      try {
        const shipment = await prisma.shipment.create({
          data: {
            orderId,
            courierId: body.courierId,
          },
          include: { order: true, courier: true },
        })

        return shipment
      } catch (error: any) {
        return { error: error.message }
      }
    },
    {
      body: t.Object({
        courierId: t.String(),
      }),
    }
  )
  .put(
    '/:id',
    async ({ params: { id }, body, prisma }: { params: any; body: any; prisma: PrismaClient }) => {
      try {
        const shipment = await prisma.shipment.update({
          where: { id },
          data: {
            status: body.status,
            estimatedDelivery: body.estimatedDelivery ? new Date(body.estimatedDelivery) : undefined,
            trackingNumber: body.trackingNumber,
          },
          include: { order: true, courier: true },
        })

        return shipment
      } catch (error: any) {
        return { error: error.message }
      }
    },
    {
      body: t.Object({
        status: t.Enum(['PENDING', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'FAILED']),
        estimatedDelivery: t.Optional(t.String()),
        trackingNumber: t.Optional(t.String()),
      }),
    }
  )
  .get('/courier/:courierId', async ({ params: { courierId }, prisma }: { params: any; prisma: PrismaClient }) => {
    try {
      const shipments = await prisma.shipment.findMany({
        where: { courierId },
        include: { order: true, courier: true },
      })

      return shipments
    } catch (error: any) {
      return { error: error.message }
    }
  })
