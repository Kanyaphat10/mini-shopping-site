import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { orderService } from '../services/api'
import { useCartStore } from '../store/cartStore'
import { useAuthStore } from '../store/authStore'

const schema = z.object({
  shippingAddr: z.string().min(10, 'Please enter a valid shipping address'),
})

type FormData = z.infer<typeof schema>

export default function CheckoutPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { items, getTotalPrice, clear } = useCartStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  useEffect(() => {
    if (!user) {
      navigate("/login");
    } else if (items.length === 0) {
      navigate("/cart");
    }
  }, [user, items, navigate]);

  if (!user || items.length === 0) {
    return null;
  }

  const onSubmit = async (data: FormData) => {
    setError('')
    setLoading(true)

    try {
      await orderService.create(data.shippingAddr)
      clear()
      navigate('/orders')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Order creation failed')
    } finally {
      setLoading(false)
    }
  }

  const total = getTotalPrice() * 1.1

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Checkout Form */}
      <div className="lg:col-span-2">
        <div className="bg-card rounded-lg border border-border p-8">
          <h1 className="text-3xl font-bold mb-8">Checkout</h1>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Shipping Information */}
            <div className="border-b border-border pb-6">
              <h2 className="text-lg font-bold mb-4">Shipping Address</h2>

              <div>
                <label className="block text-sm font-medium mb-2">Full Address</label>
                <textarea
                  {...register('shippingAddr')}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  rows={4}
                  placeholder="Enter your complete shipping address"
                />
                {errors.shippingAddr && (
                  <p className="text-red-600 text-sm mt-1">{errors.shippingAddr.message}</p>
                )}
              </div>
            </div>

            {/* Payment Information */}
            <div className="border-b border-border pb-6">
              <h2 className="text-lg font-bold mb-4">Payment Method</h2>
              <p className="text-muted-foreground mb-4">Credit Card (Demo)</p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Card Number</label>
                  <input
                    type="text"
                    value="4242 4242 4242 4242"
                    disabled
                    className="w-full px-4 py-2 border border-border rounded-lg bg-muted"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Expiry</label>
                    <input
                      type="text"
                      value="12/25"
                      disabled
                      className="w-full px-4 py-2 border border-border rounded-lg bg-muted"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">CVC</label>
                    <input
                      type="text"
                      value="123"
                      disabled
                      className="w-full px-4 py-2 border border-border rounded-lg bg-muted"
                    />
                  </div>
                </div>

                <p className="text-sm text-muted-foreground">
                  This is a demo checkout. No actual payment is processed.
                </p>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-semibold hover:opacity-90 disabled:opacity-50 transition"
            >
              {loading ? 'Processing...' : 'Place Order'}
            </button>
          </form>
        </div>
      </div>

      {/* Order Summary */}
      <div className="lg:col-span-1">
        <div className="bg-card rounded-lg border border-border p-6 sticky top-20 space-y-4">
          <h2 className="text-xl font-bold">Order Summary</h2>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <div>
                  <p className="font-medium">{item.product?.name}</p>
                  <p className="text-muted-foreground text-xs">Qty: {item.quantity}</p>
                </div>
                <p className="font-medium">
                  ${(parseFloat(item.product?.price || '0') * item.quantity).toFixed(2)}
                </p>
              </div>
            ))}
          </div>

          <div className="border-t border-border pt-4 space-y-2">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span>${getTotalPrice().toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Tax (10%)</span>
              <span>${(getTotalPrice() * 0.1).toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-lg font-bold pt-2 border-t border-border">
              <span>Total</span>
              <span className="text-primary">${total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
