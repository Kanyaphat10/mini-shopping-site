import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { cartService } from '../services/api'
import { useCartStore } from '../store/cartStore'
import { useAuthStore } from '../store/authStore'
import { Trash2, Plus, Minus } from 'lucide-react'

export default function CartPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { items, setItems, removeItem, updateQuantity, getTotalPrice } = useCartStore()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }

    const fetchCart = async () => {
      try {
        const response = await cartService.get()
        if (response.data?.items) {
          setItems(response.data.items)
        }
      } catch (error) {
        console.error('Error fetching cart:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchCart()
  }, [user, navigate, setItems])

  const handleRemoveItem = async (itemId: string) => {
    try {
      await cartService.removeItem(itemId)
      removeItem(itemId)
    } catch (error) {
      console.error('Error removing item:', error)
    }
  }

  const handleUpdateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return
    try {
      await cartService.updateQuantity(itemId, newQuantity)
      updateQuantity(itemId, newQuantity)
    } catch (error) {
      console.error('Error updating quantity:', error)
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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Cart Items */}
      <div className="lg:col-span-2">
        <h1 className="text-3xl font-bold mb-6">Shopping Cart</h1>

        {items.length === 0 ? (
          <div className="bg-card rounded-lg border border-border p-12 text-center">
            <p className="text-muted-foreground text-lg mb-6">Your cart is empty</p>
            <Link
              to="/products"
              className="inline-block bg-primary text-primary-foreground px-6 py-2 rounded-lg font-semibold hover:opacity-90 transition"
            >
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.id} className="bg-card rounded-lg border border-border p-4 flex gap-4">
                {/* Product Image */}
                <div className="w-24 h-24 bg-muted rounded-lg flex-shrink-0 flex items-center justify-center">
                  {item.product?.image ? (
                    <img src={item.product.image} alt={item.product.name} className="w-full h-full object-cover rounded-lg" />
                  ) : (
                    <div className="text-2xl">📦</div>
                  )}
                </div>

                {/* Product Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-lg">{item.product?.name}</h3>
                  <p className="text-muted-foreground text-sm mb-3">
                    ${parseFloat(item.product?.price || '0').toFixed(2)} each
                  </p>

                  {/* Quantity Controls */}
                  <div className="flex items-center gap-2 border border-border rounded-lg w-fit">
                    <button
                      onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                      className="p-2 hover:bg-muted transition"
                    >
                      <Minus size={16} />
                    </button>
                    <span className="px-3 font-semibold">{item.quantity}</span>
                    <button
                      onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                      className="p-2 hover:bg-muted transition"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>

                {/* Price and Remove */}
                <div className="flex flex-col items-end justify-between">
                  <p className="text-lg font-bold">
                    ${(parseFloat(item.product?.price || '0') * item.quantity).toFixed(2)}
                  </p>
                  <button
                    onClick={() => handleRemoveItem(item.id)}
                    className="text-destructive hover:opacity-70 transition"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Order Summary */}
      {items.length > 0 && (
        <div className="lg:col-span-1">
          <div className="bg-card rounded-lg border border-border p-6 sticky top-20 space-y-4">
            <h2 className="text-xl font-bold">Order Summary</h2>

            <div className="space-y-2 border-b border-border pb-4">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>${getTotalPrice().toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Shipping</span>
                <span>Free</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Tax</span>
                <span>${(getTotalPrice() * 0.1).toFixed(2)}</span>
              </div>
            </div>

            <div className="flex justify-between items-center text-xl font-bold">
              <span>Total</span>
              <span className="text-primary">${(getTotalPrice() * 1.1).toFixed(2)}</span>
            </div>

            <Link
              to="/checkout"
              className="block w-full bg-primary text-primary-foreground py-3 rounded-lg text-center font-semibold hover:opacity-90 transition"
            >
              Proceed to Checkout
            </Link>

            <Link
              to="/products"
              className="block w-full border border-border text-foreground py-2 rounded-lg text-center font-semibold hover:bg-muted transition"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
