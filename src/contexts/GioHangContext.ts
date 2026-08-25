import { createContext, useContext } from 'react'
import type { Product } from '../types/product'

export interface CartItem {
  product: Product
  quantity: number
}

export interface CartContextValue {
  items: CartItem[]
  itemCount: number
  subtotal: number
  cartToastProductName: string | null
  addItem: (product: Product, quantity?: number) => void
  dismissCartToast: () => void
  updateQuantity: (productId: number, quantity: number) => void
  removeItem: (productId: number) => void
  clearCart: () => void
}

export const CartContext = createContext<CartContextValue | null>(null)

export function useCart(): CartContextValue {
  const context = useContext(CartContext)

  if (!context) {
    throw new Error('useCart must be used within CartProvider.')
  }

  return context
}
