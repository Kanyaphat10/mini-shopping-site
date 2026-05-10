import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { shipmentService } from '../services/api'
import { useAuthStore } from '../store/authStore'
import { MapPin, Truck, CheckCircle, X } from 'lucide-react'

interface Shipment {
  id: string
  status: string
  trackingNumber?: string
  estimatedDelivery?: string
  order: {
    id: string
    shippingAddr: string
    user: {
      name: string
    }
  }
}

export default function CourierDashboard() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('ALL')
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null)
  const [updateData, setUpdateData] = useState({
    status: '',
    trackingNumber: '',
    estimatedDelivery: ''
  })
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    if (!user || user.role !== 'COURIER') {
      navigate('/')
      return
    }

    const fetchShipments = async () => {
      try {
        const response = await shipmentService.getCourierShipments(user.id)
        setShipments(response.data)
      } catch (error) {
        console.error('Error fetching shipments:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchShipments()
  }, [user, navigate])

  const filteredShipments = filter === 'ALL'
    ? shipments
    : shipments.filter(s => s.status === filter)

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PICKED_UP':
      case 'IN_TRANSIT':
        return <Truck className="text-blue-600" size={24} />
      case 'DELIVERED':
        return <CheckCircle className="text-green-600" size={24} />
      default:
        return <MapPin className="text-gray-600" size={24} />
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-700',
      PICKED_UP: 'bg-blue-100 text-blue-700',
      IN_TRANSIT: 'bg-purple-100 text-purple-700',
      OUT_FOR_DELIVERY: 'bg-orange-100 text-orange-700',
      DELIVERED: 'bg-green-100 text-green-700',
      FAILED: 'bg-red-100 text-red-700',
    }
    return colors[status] || 'bg-gray-100 text-gray-700'
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
        <h1 className="text-3xl font-bold mb-2">Courier Dashboard</h1>
        <p className="text-muted-foreground">Manage your shipments and deliveries</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-card rounded-lg border border-border p-4">
          <p className="text-muted-foreground text-sm">Total Shipments</p>
          <p className="text-2xl font-bold">{shipments.length}</p>
        </div>
        <div className="bg-card rounded-lg border border-border p-4">
          <p className="text-muted-foreground text-sm">In Transit</p>
          <p className="text-2xl font-bold">{shipments.filter(s => s.status === 'IN_TRANSIT').length}</p>
        </div>
        <div className="bg-card rounded-lg border border-border p-4">
          <p className="text-muted-foreground text-sm">Delivered</p>
          <p className="text-2xl font-bold">{shipments.filter(s => s.status === 'DELIVERED').length}</p>
        </div>
        <div className="bg-card rounded-lg border border-border p-4">
          <p className="text-muted-foreground text-sm">Pending</p>
          <p className="text-2xl font-bold">{shipments.filter(s => s.status === 'PENDING').length}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
        {['ALL', 'PENDING', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg font-semibold transition whitespace-nowrap ${
              filter === status
                ? 'bg-primary text-primary-foreground'
                : 'border border-border text-foreground hover:bg-muted'
            }`}
          >
            {status.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {/* Shipments List */}
      {filteredShipments.length === 0 ? (
        <div className="bg-card rounded-lg border border-border p-12 text-center">
          <p className="text-muted-foreground">No shipments found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredShipments.map((shipment) => (
            <div key={shipment.id} className="bg-card rounded-lg border border-border p-6 flex gap-6 items-start">
              <div className="flex-shrink-0">
                {getStatusIcon(shipment.status)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold">{shipment.order.user.name}</p>
                    <p className="text-sm text-muted-foreground font-mono">{shipment.order.id}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(shipment.status)}`}>
                    {shipment.status.replace(/_/g, ' ')}
                  </span>
                </div>

                <p className="text-sm text-muted-foreground mb-2">
                  <span className="font-semibold">Address:</span> {shipment.order.shippingAddr}
                </p>

                {shipment.trackingNumber && (
                  <p className="text-sm text-muted-foreground font-mono">
                    <span className="font-semibold">Tracking:</span> {shipment.trackingNumber}
                  </p>
                )}

                {shipment.estimatedDelivery && (
                  <p className="text-sm text-muted-foreground">
                    <span className="font-semibold">Est. Delivery:</span> {new Date(shipment.estimatedDelivery).toLocaleDateString()}
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    setSelectedShipment(shipment)
                    setUpdateData({
                      status: shipment.status,
                      trackingNumber: shipment.trackingNumber || '',
                      estimatedDelivery: shipment.estimatedDelivery ? new Date(shipment.estimatedDelivery).toISOString().split('T')[0] : ''
                    })
                  }}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 transition"
                >
                  Update Status
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Update Modal */}
      {selectedShipment && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card w-full max-w-md rounded-2xl border border-border shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-border">
              <h2 className="text-xl font-bold">Update Shipment</h2>
              <button onClick={() => setSelectedShipment(null)} className="p-2 hover:bg-muted rounded-full transition">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault()
              setUpdating(true)
              try {
                await shipmentService.update(selectedShipment.id, {
                  status: updateData.status,
                  trackingNumber: updateData.trackingNumber || undefined,
                  estimatedDelivery: updateData.estimatedDelivery ? new Date(updateData.estimatedDelivery).toISOString() : undefined,
                })
                // Refresh shipments
                const response = await shipmentService.getCourierShipments(user!.id)
                setShipments(response.data)
                setSelectedShipment(null)
              } catch (error) {
                console.error('Error updating shipment:', error)
              } finally {
                setUpdating(false)
              }
            }} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select 
                  value={updateData.status}
                  onChange={(e) => setUpdateData({ ...updateData, status: e.target.value })}
                  className="w-full border border-input rounded-lg p-2 bg-background"
                >
                  <option value="PENDING">Pending</option>
                  <option value="PICKED_UP">Picked Up</option>
                  <option value="IN_TRANSIT">In Transit</option>
                  <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
                  <option value="DELIVERED">Delivered</option>
                  <option value="FAILED">Failed</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Tracking Number</label>
                <input 
                  type="text"
                  value={updateData.trackingNumber}
                  onChange={(e) => setUpdateData({ ...updateData, trackingNumber: e.target.value })}
                  className="w-full border border-input rounded-lg p-2 bg-background"
                  placeholder="Enter tracking number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Estimated Delivery Date</label>
                <input 
                  type="date"
                  value={updateData.estimatedDelivery}
                  onChange={(e) => setUpdateData({ ...updateData, estimatedDelivery: e.target.value })}
                  className="w-full border border-input rounded-lg p-2 bg-background"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setSelectedShipment(null)}
                  className="flex-1 py-2 border border-input rounded-lg font-semibold hover:bg-muted transition"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={updating}
                  className="flex-1 py-2 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-50"
                >
                  {updating ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
