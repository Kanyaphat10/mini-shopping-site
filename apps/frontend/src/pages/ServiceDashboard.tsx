import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { userService } from '../services/api'
import { useAuthStore } from '../store/authStore'
import { Search, User, Edit, X, ShoppingBag } from 'lucide-react'

interface UserProfile {
  id: string
  email: string
  name: string
  role: string
  vehicleType?: string
  createdAt: string
}

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

export default function ServiceDashboard() {
  const navigate = useNavigate()
  const { user } = useAuthStore()

  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null)
  const [userOrders, setUserOrders] = useState<Order[]>([])
  const [ordersLoading, setOrdersLoading] = useState(false)
  
  const [editMode, setEditMode] = useState(false)
  const [updateData, setUpdateData] = useState({ name: '', email: '', role: '' })
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    if (!user || (user.role !== 'SERVICE_AGENT' && user.role !== 'ADMIN')) {
      navigate('/')
      return
    }

    fetchUsers()
  }, [user, navigate])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const res = await userService.getAll()
      setUsers(res.data)
    } catch (error) {
      console.error('Failed to fetch users', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectUser = async (profile: UserProfile) => {
    setSelectedUser(profile)
    setEditMode(false)
    setUpdateData({ name: profile.name, email: profile.email, role: profile.role })
    
    // Fetch orders
    setOrdersLoading(true)
    try {
      const res = await userService.getUserOrders(profile.id)
      setUserOrders(res.data)
    } catch (error) {
      console.error('Failed to fetch user orders', error)
      setUserOrders([])
    } finally {
      setOrdersLoading(false)
    }
  }

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUser) return
    setUpdating(true)
    try {
      const res = await userService.update(selectedUser.id, updateData)
      if (res.data.error) throw new Error(res.data.error)
      
      // Update local state
      const updatedUser = res.data
      setUsers(users.map(u => u.id === updatedUser.id ? updatedUser : u))
      setSelectedUser(updatedUser)
      setEditMode(false)
    } catch (error) {
      console.error('Update failed:', error)
      alert('Failed to update user.')
    } finally {
      setUpdating(false)
    }
  }

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>
  }

  return (
    <div className="flex flex-col md:flex-row gap-8 min-h-[70vh]">
      {/* Left side: User List */}
      <div className="w-full md:w-1/3 bg-card rounded-2xl border border-border flex flex-col overflow-hidden shadow-sm">
        <div className="p-4 border-b border-border bg-muted/30">
          <h2 className="text-xl font-bold mb-4">Customer Profiles</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <input 
              type="text" 
              placeholder="Search by name or email..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary outline-none transition"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2">
          {filteredUsers.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No users found.</p>
          ) : (
            <div className="space-y-1">
              {filteredUsers.map(u => (
                <button
                  key={u.id}
                  onClick={() => handleSelectUser(u)}
                  className={`w-full text-left p-3 rounded-lg flex items-center gap-3 transition ${
                    selectedUser?.id === u.id ? 'bg-primary/10 border border-primary/20' : 'hover:bg-muted border border-transparent'
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 text-primary">
                    <User size={20} />
                  </div>
                  <div className="overflow-hidden">
                    <p className="font-semibold truncate">{u.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right side: User Details & Orders */}
      <div className="w-full md:w-2/3">
        {!selectedUser ? (
          <div className="h-full border-2 border-dashed border-border rounded-2xl flex flex-col items-center justify-center text-muted-foreground bg-muted/10 p-12 text-center">
            <User size={48} className="mb-4 opacity-50" />
            <h3 className="text-xl font-semibold mb-2">Select a Profile</h3>
            <p>Choose a user from the list to view their profile details and recent orders.</p>
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            {/* Profile Card */}
            <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
              <div className="p-6 border-b border-border flex justify-between items-center bg-muted/10">
                <h3 className="text-2xl font-bold">Profile Details</h3>
                <button 
                  onClick={() => setEditMode(!editMode)}
                  className="p-2 bg-secondary text-secondary-foreground rounded-lg hover:opacity-80 transition flex items-center gap-2 text-sm font-semibold"
                >
                  {editMode ? <><X size={16}/> Cancel</> : <><Edit size={16}/> Edit</>}
                </button>
              </div>
              
              <div className="p-6">
                {editMode ? (
                  <form onSubmit={handleUpdateUser} className="space-y-4 max-w-md">
                    <div>
                      <label className="block text-sm font-medium mb-1">Name</label>
                      <input 
                        type="text" 
                        value={updateData.name} 
                        onChange={e => setUpdateData({...updateData, name: e.target.value})}
                        className="w-full border border-input rounded-lg p-2 bg-background"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Email</label>
                      <input 
                        type="email" 
                        value={updateData.email} 
                        onChange={e => setUpdateData({...updateData, email: e.target.value})}
                        className="w-full border border-input rounded-lg p-2 bg-background"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Role</label>
                      <select 
                        value={updateData.role} 
                        onChange={e => setUpdateData({...updateData, role: e.target.value})}
                        className="w-full border border-input rounded-lg p-2 bg-background"
                      >
                        <option value="CUSTOMER">Customer</option>
                        <option value="COURIER">Courier</option>
                        <option value="SERVICE_AGENT">Service Agent</option>
                        <option value="ADMIN">Admin</option>
                      </select>
                    </div>
                    <div className="pt-2">
                      <button 
                        type="submit" 
                        disabled={updating}
                        className="bg-primary text-primary-foreground px-6 py-2 rounded-lg font-bold hover:opacity-90 disabled:opacity-50"
                      >
                        {updating ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="grid grid-cols-2 gap-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Full Name</p>
                      <p className="font-semibold text-lg">{selectedUser.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Email Address</p>
                      <p className="font-semibold text-lg">{selectedUser.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Role</p>
                      <span className="inline-block bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-semibold mt-1">
                        {selectedUser.role}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Joined Date</p>
                      <p className="font-semibold text-lg">{new Date(selectedUser.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Orders List */}
            <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
              <div className="p-6 border-b border-border bg-muted/10 flex items-center gap-3">
                <ShoppingBag className="text-primary" />
                <h3 className="text-xl font-bold">Order History</h3>
              </div>
              
              <div className="p-6">
                {ordersLoading ? (
                  <p className="text-muted-foreground animate-pulse">Loading orders...</p>
                ) : userOrders.length === 0 ? (
                  <p className="text-muted-foreground">This user has no orders.</p>
                ) : (
                  <div className="space-y-4">
                    {userOrders.map(order => (
                      <div key={order.id} className="border border-border rounded-lg p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:bg-muted/30 transition">
                        <div>
                          <p className="font-bold text-lg mb-1">#{order.id.slice(-8).toUpperCase()}</p>
                          <p className="text-sm text-muted-foreground">{new Date(order.createdAt).toLocaleString()}</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="font-bold">${Number(order.totalPrice).toFixed(2)}</p>
                            <p className="text-xs text-muted-foreground">{order.items.length} items</p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
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
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
