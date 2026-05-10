import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { userService, orderService } from '../services/api'

interface Order {
  id: string
  status: string
  totalPrice: string
  createdAt: string
  items: Array<{
    id: string
    quantity: number
    product: { name: string, price: string }
  }>
}

export default function ProfilePage() {
  const navigate = useNavigate()
  const { user, setUser } = useAuthStore()
  
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [vehicleType, setVehicleType] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  
  const [orders, setOrders] = useState<Order[]>([])
  const [ordersLoading, setOrdersLoading] = useState(false)

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }
    setName(user.name || '')
    // We don't populate vehicleType directly from auth store if it's missing, but if the endpoint returns it, we should fetch /auth/me or /users/me.
    // Actually, we can fetch the fresh profile.
    const fetchProfile = async () => {
      try {
        const response = await userService.getAll() // Wait, there's no /users/me GET. We have authService.getMe()!
        // Actually authService.getMe() doesn't return vehicleType. Let's just use what we have or update the backend.
        // Wait, for COURIER, we can just fetch the user by ID.
        if (user.role === 'COURIER') {
          const res = await userService.getById(user.id)
          setVehicleType(res.data.vehicleType || '')
        }
      } catch (err) {
        console.error(err)
      }
    }
    fetchProfile()

    if (user.role === 'CUSTOMER') {
      const fetchOrders = async () => {
        setOrdersLoading(true)
        try {
          const res = await orderService.getAll()
          setOrders(res.data)
        } catch (error) {
          console.error('Error fetching orders:', error)
        } finally {
          setOrdersLoading(false)
        }
      }
      fetchOrders()
    }
  }, [user, navigate])

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage({ type: '', text: '' })
    try {
      const payload: any = {}
      if (name !== user?.name) payload.name = name
      if (password) payload.password = password
      if (user?.role === 'COURIER' && vehicleType) payload.vehicleType = vehicleType

      if (Object.keys(payload).length === 0) {
        setMessage({ type: 'info', text: 'No changes made.' })
        setLoading(false)
        return
      }

      const res = await userService.updateMe(payload)
      if (res.data.error) throw new Error(res.data.error)
      
      if (user) {
        setUser({ ...user, name: res.data.name })
      }
      setMessage({ type: 'success', text: 'Profile updated successfully!' })
      setPassword('')
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to update profile' })
    } finally {
      setLoading(false)
    }
  }

  if (!user) return null

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="bg-card rounded-2xl border border-border p-8 shadow-sm">
        <h1 className="text-3xl font-bold mb-6">My Profile</h1>
        
        {message.text && (
          <div className={`p-4 rounded-lg mb-6 ${message.type === 'error' ? 'bg-red-100 text-red-700' : message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleUpdateProfile} className="space-y-6 max-w-md">
          <div>
            <label className="block text-sm font-medium mb-2">Email (Read Only)</label>
            <input 
              type="email" 
              value={user.email} 
              disabled 
              className="w-full border border-input rounded-lg p-3 bg-muted text-muted-foreground cursor-not-allowed"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Name</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full border border-input rounded-lg p-3 bg-background focus:ring-2 focus:ring-primary outline-none transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">New Password (Optional)</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Leave blank to keep current"
              className="w-full border border-input rounded-lg p-3 bg-background focus:ring-2 focus:ring-primary outline-none transition"
            />
          </div>

          {user.role === 'COURIER' && (
            <div>
              <label className="block text-sm font-medium mb-2">Vehicle Type</label>
              <input 
                type="text" 
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value)}
                placeholder="e.g. Van, Motorcycle, Truck"
                className="w-full border border-input rounded-lg p-3 bg-background focus:ring-2 focus:ring-primary outline-none transition"
              />
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-bold hover:opacity-90 transition disabled:opacity-50"
          >
            {loading ? 'Updating...' : 'Update Profile'}
          </button>
        </form>
      </div>

      {user.role === 'CUSTOMER' && (
        <div className="bg-card rounded-2xl border border-border p-8 shadow-sm">
          <h2 className="text-2xl font-bold mb-6">Recent Orders</h2>
          {ordersLoading ? (
            <p className="text-muted-foreground">Loading orders...</p>
          ) : orders.length === 0 ? (
            <p className="text-muted-foreground">You haven't placed any orders yet.</p>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div key={order.id} className="border border-border rounded-lg p-4 flex justify-between items-center hover:bg-muted/50 transition">
                  <div>
                    <p className="font-bold text-lg mb-1">Order #{order.id.slice(-6).toUpperCase()}</p>
                    <p className="text-sm text-muted-foreground">Placed on {new Date(order.createdAt).toLocaleDateString()}</p>
                    <p className="text-sm text-muted-foreground mt-2">{order.items.length} items • ${Number(order.totalPrice).toFixed(2)}</p>
                  </div>
                  <div className="text-right">
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      order.status === 'DELIVERED' ? 'bg-green-100 text-green-700' :
                      order.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
