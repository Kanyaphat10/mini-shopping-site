import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { productService } from '../services/api'
import { ShoppingCart } from 'lucide-react'

interface Product {
  id: string
  sku: string
  name: string
  description: string
  price: string
  image?: string
  stock: number
  productStatus: string
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await productService.getAll()
        setProducts(response.data)
      } catch (error) {
        console.error('Error fetching products:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="animate-in fade-in">
      <h1 className="text-4xl font-extrabold mb-8 tracking-tight">Our Collection</h1>

      {products.length === 0 ? (
        <div className="text-center py-16 bg-muted/30 rounded-2xl border border-border">
          <p className="text-muted-foreground text-lg">No products available yet. Check back soon!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {products.map((product) => {
            const isOutOfStock = product.stock <= 0 || product.productStatus === 'OUT_OF_STOCK'
            
            return (
              <div key={product.id} className="group flex flex-col bg-card rounded-2xl border border-border overflow-hidden hover:shadow-xl transition-all duration-300">
                <div className="h-56 bg-muted flex items-center justify-center relative overflow-hidden">
                  {product.image ? (
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="text-5xl opacity-50 transform group-hover:scale-110 transition-transform duration-500">🛍️</div>
                  )}
                  {isOutOfStock && (
                    <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center">
                      <span className="font-bold text-lg text-foreground px-4 py-2 bg-background/80 rounded-full shadow-sm">Out of Stock</span>
                    </div>
                  )}
                </div>

                <div className="p-5 flex flex-col flex-1">
                  <div className="flex items-start justify-between mb-2 gap-2">
                    <h3 className="font-bold text-lg line-clamp-2 leading-tight">{product.name}</h3>
                    <span className="text-xl font-bold text-primary shrink-0">${parseFloat(product.price).toFixed(2)}</span>
                  </div>
                  
                  <p className="text-muted-foreground text-sm line-clamp-2 mb-4 flex-1">{product.description}</p>

                  <Link
                    to={`/products/${product.id}`}
                    className={`block w-full py-2.5 rounded-xl text-center font-semibold transition-all ${
                      isOutOfStock 
                        ? 'bg-muted text-muted-foreground cursor-not-allowed' 
                        : 'bg-primary text-primary-foreground hover:opacity-90 shadow-sm hover:shadow active:scale-[0.98]'
                    }`}
                    onClick={(e) => isOutOfStock && e.preventDefault()}
                  >
                    {isOutOfStock ? 'Currently Unavailable' : 'View Details'}
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
