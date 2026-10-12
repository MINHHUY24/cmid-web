import { useCallback, useEffect, useState } from 'react'
import { getProducts } from '../services/product.service'
import type { Product } from '../types/product'

interface UseProductsResult {
  products: Product[]
  isLoading: boolean
  errorMessage: string | null
  retry: () => void
  removeProduct: (productId: number) => void
}

interface UseProductsOptions {
  includeModels?: boolean
}

export function useProducts({ includeModels = false }: UseProductsOptions = {}): UseProductsResult {
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
        const response = await getProducts({ includeModels })

        if (isCurrentRequest) {
          setProducts(response)
        }
      } catch (error: unknown) {
        if (isCurrentRequest) {
          setProducts([])
          setErrorMessage(error instanceof Error ? error.message : 'Không thể tải danh sách sản phẩm.')
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
  }, [includeModels, reloadKey])

  const retry = useCallback(() => {
    setReloadKey((currentKey) => currentKey + 1)
  }, [])

  const removeProduct = useCallback((productId: number) => {
    setProducts((currentProducts) => currentProducts.filter((product) => product.id !== productId))
  }, [])

  return { products, isLoading, errorMessage, retry, removeProduct }
}
