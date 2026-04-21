import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { orderService } from '../services/api'
import { useAuthStore } from '../store/authStore'

interface Order {
  id: string
  status: string
  totalPrice: string
  shippingAddr: string
  createdAt: string
  items: Array<{
    id: string
    quantity: number
    price: string
    product: {
      name: string
    }
  }>
  shipment?: {
    status: string
    trackingNumber?: string
  }
}

export default function OrdersPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }

    const fetchOrders = async () => {
      try {
        const response = await orderService.getAll()
        setOrders(response.data)
      } catch (error) {
        console.error('Error fetching orders:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [user, navigate])

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-700',
      CONFIRMED: 'bg-blue-100 text-blue-700',
      SHIPPED: 'bg-purple-100 text-purple-700',
      DELIVERED: 'bg-green-100 text-green-700',
      CANCELLED: 'bg-red-100 text-red-700',
    }
    return colors[status] || 'bg-gray-100 text-gray-700'
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">My Orders</h1>

      {orders.length === 0 ? (
        <div className="bg-card rounded-lg border border-border p-12 text-center">
          <p className="text-muted-foreground text-lg">No orders yet</p>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <div key={order.id} className="bg-card rounded-lg border border-border overflow-hidden">
              {/* Order Header */}
              <div className="bg-muted px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Order ID</p>
                  <p className="font-mono font-semibold">{order.id}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Order Date</p>
                  <p className="font-semibold">{new Date(order.createdAt).toLocaleDateString()}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                </div>

                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-xl font-bold text-primary">${parseFloat(order.totalPrice).toFixed(2)}</p>
                </div>
              </div>

              {/* Order Items */}
              <div className="px-6 py-4 border-t border-border">
                <p className="font-semibold mb-3">Items</p>
                <div className="space-y-2">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span>{item.product.name} x {item.quantity}</span>
                      <span>${(parseFloat(item.price) * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Shipping & Tracking */}
              <div className="px-6 py-4 border-t border-border bg-muted">
                <p className="font-semibold mb-2">Shipping Address</p>
                <p className="text-sm text-muted-foreground">{order.shippingAddr}</p>

                {order.shipment && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <p className="font-semibold mb-2">Tracking</p>
                    <div className="flex justify-between">
                      <span className="text-sm">
                        Status: <span className="font-semibold">{order.shipment.status}</span>
                      </span>
                      {order.shipment.trackingNumber && (
                        <span className="text-sm font-mono">{order.shipment.trackingNumber}</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
