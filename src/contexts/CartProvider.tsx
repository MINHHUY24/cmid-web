import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Product } from '../types/product'
import { getProductPrice } from '../utils/order'
import { CartContext, type CartContextValue, type CartItem } from './GioHangContext'

const CART_STORAGE_KEY = 'cmid-cart'

function readStoredCart(): CartItem[] {
  try {
    const storedCart = window.localStorage.getItem(CART_STORAGE_KEY)

    if (!storedCart) {
      return []
    }

    const parsedCart: unknown = JSON.parse(storedCart)

    if (!Array.isArray(parsedCart)) {
      return []
    }

    return parsedCart.filter(
      (item): item is CartItem =>
        typeof item === 'object' &&
        item !== null &&
        'product' in item &&
        'quantity' in item &&
        typeof item.quantity === 'number' &&
        item.quantity > 0,
    )
  } catch {
    return []
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(readStoredCart)
  const [cartToastProductName, setCartToastProductName] = useState<string | null>(null)

  useEffect(() => {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items))
  }, [items])

  const addItem = useCallback((product: Product, quantity = 1) => {
    const safeQuantity = Math.max(1, Math.floor(quantity))

    setItems((currentItems) => {
      const currentItem = currentItems.find((item) => item.product.id === product.id)

      if (!currentItem) {
        return [...currentItems, { product, quantity: safeQuantity }]
      }

      return currentItems.map((item) =>
        item.product.id === product.id
          ? { ...item, quantity: item.quantity + safeQuantity }
          : item,
      )
    })
    setCartToastProductName(product.name)
  }, [])

  const dismissCartToast = useCallback(() => {
    setCartToastProductName(null)
  }, [])

  const updateQuantity = useCallback((productId: number, quantity: number) => {
    setItems((currentItems) =>
      currentItems.flatMap((item) => {
        if (item.product.id !== productId) {
          return [item]
        }

        return quantity > 0 ? [{ ...item, quantity: Math.floor(quantity) }] : []
      }),
    )
  }, [])

  const removeItem = useCallback((productId: number) => {
    setItems((currentItems) =>
      currentItems.filter((item) => item.product.id !== productId),
    )
  }, [])

  const clearCart = useCallback(() => {
    setItems([])
  }, [])

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      itemCount: items.reduce((total, item) => total + item.quantity, 0),
      subtotal: items.reduce(
        (total, item) => total + getProductPrice(item.product.price) * item.quantity,
        0,
      ),
      cartToastProductName,
      addItem,
      dismissCartToast,
      updateQuantity,
      removeItem,
      clearCart,
    }),
    [addItem, cartToastProductName, clearCart, dismissCartToast, items, removeItem, updateQuantity],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}
