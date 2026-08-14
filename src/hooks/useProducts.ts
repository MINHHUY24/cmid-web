import { useCallback, useEffect, useState } from 'react'
import { getProducts } from '../services/product.service'
import type { Product } from '../types/product'

interface UseProductsResult {
  products: Product[]
  isLoading: boolean
  errorMessage: string | null
  retry: () => void
}

export function useProducts(): UseProductsResult {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let isCurrentRequest = true

    async function loadProducts() {
      setIsLoading(true)
      setErrorMessage(null)

      try {
        const response = await getProducts()

        if (isCurrentRequest) {
          setProducts(response)
        }
      } catch (error: unknown) {
        if (isCurrentRequest) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : 'Không thể tải danh sách sản phẩm.',
          )
        }
      } finally {
        if (isCurrentRequest) {
          setIsLoading(false)
        }
      }
    }

    void loadProducts()

    return () => {
      isCurrentRequest = false
    }
  }, [reloadKey])

  const retry = useCallback(() => {
    setReloadKey((currentKey) => currentKey + 1)
  }, [])

  return { products, isLoading, errorMessage, retry }
}
