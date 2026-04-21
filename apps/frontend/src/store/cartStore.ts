import { create } from 'zustand'

export interface CartItem {
  id: string
  cartId: string
  productId: string
  quantity: number
  product?: {
    id: string
    name: string
    price: string
    image?: string
  }
}

interface CartState {
  items: CartItem[]
  setItems: (items: CartItem[]) => void
  addItem: (item: CartItem) => void
  removeItem: (itemId: string) => void
  updateQuantity: (itemId: string, quantity: number) => void
  clear: () => void
  getTotalPrice: () => number
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  setItems: (items) => set({ items }),
  addItem: (item) => {
    const existing = get().items.find(i => i.productId === item.productId)
    if (existing) {
      set({
        items: get().items.map(i =>
          i.id === existing.id ? { ...i, quantity: i.quantity + item.quantity } : i
        ),
      })
    } else {
      set({ items: [...get().items, item] })
    }
  },
  removeItem: (itemId) =>
    set({ items: get().items.filter(i => i.id !== itemId) }),
  updateQuantity: (itemId, quantity) =>
    set({
      items: get().items.map(i =>
        i.id === itemId ? { ...i, quantity } : i
      ),
    }),
  clear: () => set({ items: [] }),
  getTotalPrice: () => {
    return get().items.reduce((sum, item) => {
      const price = item.product?.price ? parseFloat(item.product.price) : 0
      return sum + price * item.quantity
    }, 0)
  },
}))
