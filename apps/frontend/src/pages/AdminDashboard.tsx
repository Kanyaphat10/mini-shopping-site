import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminService, productService } from '../services/api'
import { useAuthStore } from '../store/authStore'
import { Users, ShoppingCart, Package, DollarSign, Edit, Plus, Trash2, Upload, Loader2, Image as ImageIcon } from 'lucide-react'
import { toast } from 'sonner'

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

interface Product {
  id: string
  sku: string
  name: string
  description: string
  price: string
  stock: number
  image?: string
  productStatus: string
}

export default function AdminDashboard() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [stats, setStats] = useState<Stats | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  // Product Form State
  const [showProductForm, setShowProductForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    description: '',
    price: '',
    stock: '',
    image: '',
    productStatus: 'ACTIVE',
  })
  const [isUploading, setIsUploading] = useState(false)

  useEffect(() => {
    if (!user || user.role !== 'ADMIN') {
      navigate('/')
      return
    }

    fetchData()
  }, [user, navigate])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [statsRes, ordersRes, productsRes] = await Promise.all([
        adminService.getStats(),
        adminService.getOrders(),
        productService.getAll(),
      ])
      setStats(statsRes.data)
      setOrders(ordersRes.data)
      setProducts(productsRes.data)
    } catch (error) {
      console.error('Error fetching admin data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSeedDatabase = async () => {
    if (!window.confirm('Are you sure you want to seed the database? This will clear existing data.')) return
    try {
      await adminService.seedDatabase()
      window.location.reload()
    } catch (error) {
      console.error('Error seeding database:', error)
    }
  }

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const payload = {
        ...formData,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock, 10),
      }
      
      if (editingProduct) {
        await productService.update(editingProduct.id, payload)
      } else {
        await productService.create(payload)
      }
      
      setShowProductForm(false)
      setEditingProduct(null)
      fetchData()
    } catch (error) {
      console.error('Failed to save product', error)
      alert('Failed to save product')
    }
  }

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product)
    setFormData({
      sku: product.sku,
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      stock: product.stock.toString(),
      image: product.image || '',
      productStatus: product.productStatus,
    })
    setShowProductForm(true)
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      const formDataUpload = new FormData()
      formDataUpload.append('file', file)
      formDataUpload.append('uploadType', '0')
      
      const response = await fetch('https://up.m1r.ai/upload', {
        method: 'POST',
        body: formDataUpload,
      })
      
      if (!response.ok) throw new Error('Upload failed')
      
      const data = await response.json()
      setFormData(prev => ({ ...prev, image: data.url }))
      toast.success('Image uploaded successfully')
    } catch (error) {
      toast.error('Failed to upload image', {
        description: (error as Error).message,
        duration: 5000,
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleArchiveProduct = async (id: string) => {
    if (!window.confirm('Are you sure you want to archive this product? It will be hidden from customers.')) return
    try {
      await productService.update(id, { productStatus: 'HIDDEN' })
      fetchData()
    } catch (error) {
      console.error('Failed to archive product', error)
    }
  }

  if (loading && !stats) {
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
        {['overview', 'orders', 'products', 'tools'].map(tab => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab)
              setShowProductForm(false)
            }}
            className={`px-4 py-2 font-semibold border-b-2 transition capitalize ${
              activeTab === tab
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && stats && (
        <div className="space-y-8 animate-in fade-in">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <p className="text-muted-foreground font-medium">Total Users</p>
                <Users className="text-blue-600" size={24} />
              </div>
              <p className="text-3xl font-bold">{stats.totalUsers}</p>
            </div>
            <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <p className="text-muted-foreground font-medium">Total Orders</p>
                <ShoppingCart className="text-green-600" size={24} />
              </div>
              <p className="text-3xl font-bold">{stats.totalOrders}</p>
            </div>
            <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <p className="text-muted-foreground font-medium">Total Products</p>
                <Package className="text-purple-600" size={24} />
              </div>
              <p className="text-3xl font-bold">{stats.totalProducts}</p>
            </div>
            <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <p className="text-muted-foreground font-medium">Total Revenue</p>
                <DollarSign className="text-yellow-600" size={24} />
              </div>
              <p className="text-3xl font-bold">${parseFloat(stats.totalRevenue.toString()).toFixed(2)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Orders Tab */}
      {activeTab === 'orders' && (
        <div className="animate-in fade-in">
          {orders.length === 0 ? (
            <div className="bg-card rounded-lg border border-border p-12 text-center">
              <p className="text-muted-foreground">No orders found</p>
            </div>
          ) : (
            <div className="bg-card rounded-lg border border-border overflow-hidden shadow-sm">
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
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
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

      {/* Products Tab */}
      {activeTab === 'products' && (
        <div className="animate-in fade-in">
          {!showProductForm ? (
            <>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Catalog</h2>
                <button
                  onClick={() => {
                    setEditingProduct(null)
                    setFormData({ sku: '', name: '', description: '', price: '', stock: '', image: '', productStatus: 'ACTIVE' })
                    setShowProductForm(true)
                  }}
                  className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-semibold flex items-center gap-2 hover:opacity-90 transition"
                >
                  <Plus size={18} /> New Product
                </button>
              </div>
              <div className="bg-card rounded-lg border border-border overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted border-b border-border">
                      <tr>
                        <th className="px-6 py-3 text-left text-sm font-semibold">SKU</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold">Name</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold">Price</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold">Stock</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
                        <th className="px-6 py-3 text-right text-sm font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map((product) => (
                        <tr key={product.id} className="border-b border-border hover:bg-muted transition">
                          <td className="px-6 py-3 font-mono text-sm">{product.sku}</td>
                          <td className="px-6 py-3 font-medium">{product.name}</td>
                          <td className="px-6 py-3">${parseFloat(product.price).toFixed(2)}</td>
                          <td className="px-6 py-3">{product.stock}</td>
                          <td className="px-6 py-3">
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              product.productStatus === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                              product.productStatus === 'OUT_OF_STOCK' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {product.productStatus}
                            </span>
                          </td>
                          <td className="px-6 py-3 text-right space-x-2">
                            <button onClick={() => handleEditProduct(product)} className="p-2 text-blue-600 hover:bg-blue-50 rounded transition">
                              <Edit size={18} />
                            </button>
                            <button onClick={() => handleArchiveProduct(product.id)} className="p-2 text-red-600 hover:bg-red-50 rounded transition" title="Archive (Hide)">
                              <Trash2 size={18} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-card rounded-lg border border-border p-6 max-w-2xl mx-auto shadow-sm">
              <h2 className="text-xl font-bold mb-4">{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
              <form onSubmit={handleProductSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">SKU</label>
                    <input type="text" required value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} className="w-full px-4 py-2 border border-border rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Status</label>
                    <select value={formData.productStatus} onChange={e => setFormData({...formData, productStatus: e.target.value})} className="w-full px-4 py-2 border border-border rounded-lg bg-background">
                      <option value="ACTIVE">Active</option>
                      <option value="OUT_OF_STOCK">Out of Stock</option>
                      <option value="HIDDEN">Hidden (Archived)</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Name</label>
                  <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2 border border-border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full px-4 py-2 border border-border rounded-lg" rows={3}></textarea>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Price ($)</label>
                    <input type="number" step="0.01" required value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full px-4 py-2 border border-border rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Stock</label>
                    <input type="number" required value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} className="w-full px-4 py-2 border border-border rounded-lg" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Product Image</label>
                  <div className="flex items-center gap-4 mt-1">
                    <div className="w-24 h-24 rounded-lg border-2 border-dashed border-border flex items-center justify-center overflow-hidden bg-muted">
                      {formData.image ? (
                        <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon className="text-muted-foreground" size={32} />
                      )}
                    </div>
                    <div className="flex-1">
                      <label className="inline-flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg cursor-pointer hover:opacity-90 transition">
                        {isUploading ? <Loader2 className="animate-spin" size={18} /> : <Upload size={18} />}
                        <span>{isUploading ? 'Uploading...' : 'Upload Image'}</span>
                        <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={isUploading} />
                      </label>
                      <p className="text-xs text-muted-foreground mt-2">Recommended: Square image, max 5MB</p>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <button type="button" onClick={() => setShowProductForm(false)} className="px-4 py-2 font-semibold border border-border rounded-lg hover:bg-muted transition">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground font-semibold rounded-lg hover:opacity-90 transition">Save Product</button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* Tools Tab */}
      {activeTab === 'tools' && (
        <div className="space-y-4 animate-in fade-in">
          <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
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
