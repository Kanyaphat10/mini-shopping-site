import { Elysia, t } from 'elysia'
import { PrismaClient } from '@prisma/client'
import { UpdateShipmentSchema } from '../utils/schemas'

export const shipmentRoutes = new Elysia({ prefix: '/shipments' })
  .get('/', async ({ headers, prisma }: any) => {
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
  .get('/:id', async ({ params: { id }, prisma }: any) => {
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
    async ({ params: { orderId }, body, prisma }: any) => {
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
    async ({ params: { id }, body, prisma }: any) => {
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

        // Sync order status
        let orderStatus;
        if (body.status === 'DELIVERED') orderStatus = 'DELIVERED';
        else if (body.status === 'PICKED_UP') orderStatus = 'SHIPPED';
        else if (body.status === 'IN_TRANSIT') orderStatus = 'IN_TRANSIT';
        else if (body.status === 'OUT_FOR_DELIVERY') orderStatus = 'OUT_FOR_DELIVERY';
        else if (body.status === 'FAILED') orderStatus = 'FAILED';

        if (orderStatus) {
          await prisma.order.update({
            where: { id: shipment.orderId },
            data: { status: orderStatus }
          });
          shipment.order.status = orderStatus; // update the returned object
        }

        return shipment
      } catch (error: any) {
        return { error: error.message }
      }
    },
    {
      body: t.Object({
        status: t.Union([t.Literal('PENDING'), t.Literal('PICKED_UP'), t.Literal('IN_TRANSIT'), t.Literal('OUT_FOR_DELIVERY'), t.Literal('DELIVERED'), t.Literal('FAILED')]),
        estimatedDelivery: t.Optional(t.String()),
        trackingNumber: t.Optional(t.String()),
      }),
    }
  )
  .get('/courier/:courierId', async ({ params: { courierId }, prisma }: any) => {
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
