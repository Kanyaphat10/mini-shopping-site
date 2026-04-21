import { z } from 'zod'

export const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
})

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
})

export const AddToCartSchema = z.object({
  productId: z.string(),
  quantity: z.number().int().positive(),
})

export const CreateOrderSchema = z.object({
  shippingAddr: z.string().min(10),
})

export const UpdateShipmentSchema = z.object({
  status: z.enum(['PENDING', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'FAILED']),
  estimatedDelivery: z.string().datetime().optional(),
  trackingNumber: z.string().optional(),
})

export const CreateProductSchema = z.object({
  name: z.string().min(2),
  description: z.string(),
  price: z.number().positive(),
  stock: z.number().int().nonnegative(),
  image: z.string().optional(),
})
