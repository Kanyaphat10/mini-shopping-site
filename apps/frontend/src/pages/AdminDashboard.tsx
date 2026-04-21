import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminService } from '../services/api'
import { useAuthStore } from '../store/authStore'
import { Users, ShoppingCart, Package, DollarSign } from 'lucide-react'

interface Stats {
  totalUsers: number
  totalOrders: number
  totalProducts: number
  totalRevenue: number
}

interface Order {
  id: string
  status: string
  totalPrice: string
  user: {
    email: string
    name: string
  }
  createdAt: string
}

export default function AdminDashboard() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [stats, setStats] = useState<Stats | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    if (!user || user.role !== 'ADMIN') {
      navigate('/')
      return
    }

    const fetchData = async () => {
      try {
        const [statsRes, ordersRes] = await Promise.all([
          adminService.getStats(),
          adminService.getOrders(),
        ])
        setStats(statsRes.data)
        setOrders(ordersRes.data)
      } catch (error) {
        console.error('Error fetching admin data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user, navigate])

  const handleSeedDatabase = async () => {
    if (!window.confirm('Are you sure you want to seed the database? This will clear existing data.')) {
      return
    }

    try {
      await adminService.seedDatabase()
      window.location.reload()
    } catch (error) {
      console.error('Error seeding database:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-muted-foreground">Manage your store and view analytics</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-8 border-b border-border">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 font-semibold border-b-2 transition ${
            activeTab === 'overview'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-2 font-semibold border-b-2 transition ${
            activeTab === 'orders'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Orders
        </button>
        <button
          onClick={() => setActiveTab('tools')}
          className={`px-4 py-2 font-semibold border-b-2 transition ${
            activeTab === 'tools'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Tools
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && stats && (
        <div className="space-y-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-card rounded-lg border border-border p-6">
              <div className="flex items-center justify-between mb-3">
                <p className="text-muted-foreground">Total Users</p>
                <Users className="text-blue-600" size={24} />
              </div>
              <p className="text-3xl font-bold">{stats.totalUsers}</p>
            </div>

            <div className="bg-card rounded-lg border border-border p-6">
              <div className="flex items-center justify-between mb-3">
                <p className="text-muted-foreground">Total Orders</p>
                <ShoppingCart className="text-green-600" size={24} />
              </div>
              <p className="text-3xl font-bold">{stats.totalOrders}</p>
            </div>

            <div className="bg-card rounded-lg border border-border p-6">
              <div className="flex items-center justify-between mb-3">
                <p className="text-muted-foreground">Total Products</p>
                <Package className="text-purple-600" size={24} />
              </div>
              <p className="text-3xl font-bold">{stats.totalProducts}</p>
            </div>

            <div className="bg-card rounded-lg border border-border p-6">
              <div className="flex items-center justify-between mb-3">
                <p className="text-muted-foreground">Total Revenue</p>
                <DollarSign className="text-yellow-600" size={24} />
              </div>
              <p className="text-3xl font-bold">${parseFloat(stats.totalRevenue.toString()).toFixed(2)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Orders Tab */}
      {activeTab === 'orders' && (
        <div>
          {orders.length === 0 ? (
            <div className="bg-card rounded-lg border border-border p-12 text-center">
              <p className="text-muted-foreground">No orders found</p>
            </div>
          ) : (
            <div className="bg-card rounded-lg border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted border-b border-border">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Order ID</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Customer</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Amount</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order.id} className="border-b border-border hover:bg-muted transition">
                        <td className="px-6 py-3 font-mono text-sm">{order.id.slice(0, 8)}</td>
                        <td className="px-6 py-3">
                          <div>
                            <p className="font-semibold">{order.user.name}</p>
                            <p className="text-sm text-muted-foreground">{order.user.email}</p>
                          </div>
                        </td>
                        <td className="px-6 py-3 font-semibold">${parseFloat(order.totalPrice).toFixed(2)}</td>
                        <td className="px-6 py-3">
                          <span className="px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-700">
                            {order.status}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-sm">{new Date(order.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tools Tab */}
      {activeTab === 'tools' && (
        <div className="space-y-4">
          <div className="bg-card rounded-lg border border-border p-6">
            <h2 className="text-lg font-bold mb-2">Database Tools</h2>
            <p className="text-muted-foreground mb-4">
              Seed your database with sample products, users, and orders for testing.
            </p>
            <button
              onClick={handleSeedDatabase}
              className="bg-primary text-primary-foreground px-6 py-2 rounded-lg font-semibold hover:opacity-90 transition"
            >
              Seed Database
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
