import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { productService, cartService } from '../services/api'
import { useAuthStore } from '../store/authStore'
import { useCartStore } from '../store/cartStore'
import { Minus, Plus } from 'lucide-react'

interface Product {
  id: string
  name: string
  description: string
  price: string
  image?: string
  stock: number
}

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { addItem } = useCartStore()
  const [product, setProduct] = useState<Product | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return
      try {
        const response = await productService.getById(id)
        setProduct(response.data)
      } catch (error) {
        console.error('Error fetching product:', error)
        navigate('/products')
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [id, navigate])

  const handleAddToCart = async () => {
    if (!user) {
      navigate('/login')
      return
    }

    setAdding(true)
    try {
      const response = await cartService.addItem(product!.id, quantity)
      addItem({
        id: response.data.id,
        cartId: response.data.cartId,
        productId: product!.id,
        quantity,
        product,
      })
      navigate('/cart')
    } catch (error) {
      console.error('Error adding to cart:', error)
    } finally {
      setAdding(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!product) {
    return <div className="text-center py-12">Product not found</div>
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* Product Image */}
      <div className="bg-muted rounded-lg flex items-center justify-center min-h-96">
        {product.image ? (
          <img src={product.image} alt={product.name} className="w-full h-full object-cover rounded-lg" />
        ) : (
          <div className="text-6xl">📦</div>
        )}
      </div>

      {/* Product Info */}
      <div className="space-y-6">
        <div>
          <h1 className="text-4xl font-bold mb-2">{product.name}</h1>
          <p className="text-muted-foreground">{product.description}</p>
        </div>

        <div>
          <p className="text-sm text-muted-foreground mb-2">Price</p>
          <p className="text-4xl font-bold text-primary">${parseFloat(product.price).toFixed(2)}</p>
        </div>

        <div>
          <p className="text-sm text-muted-foreground mb-2">Availability</p>
          <p className={`text-lg font-semibold ${
            product.stock > 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
          </p>
        </div>

        {product.stock > 0 && (
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-3">Quantity</p>
              <div className="flex items-center gap-4 border border-border rounded-lg w-fit">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-2 hover:bg-muted transition"
                >
                  <Minus size={20} />
                </button>
                <span className="font-semibold">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  className="p-2 hover:bg-muted transition"
                >
                  <Plus size={20} />
                </button>
              </div>
            </div>

            <button
              onClick={handleAddToCart}
              disabled={adding}
              className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-semibold hover:opacity-90 disabled:opacity-50 transition"
            >
              {adding ? 'Adding...' : 'Add to Cart'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
