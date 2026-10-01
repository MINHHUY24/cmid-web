import { useCallback, useEffect, useState } from 'react'
import { getProductById } from '../services/product.service'
import type { Product } from '../types/product'

interface UseProductResult {
  product: Product | null
  isLoading: boolean
  errorMessage: string | null
  retry: () => void
}

export function useProduct(productId: number): UseProductResult {
  const [product, setProduct] = useState<Product | null>(null)
  const [isLoading, setIsLoading] = useState(Number.isSafeInteger(productId) && productId > 0)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    const isValidProductId = Number.isSafeInteger(productId) && productId > 0

    if (!isValidProductId) {
      setProduct(null)
      setErrorMessage(null)
      setIsLoading(false)
      return undefined
    }

    let isCurrentRequest = true
    setIsLoading(true)
    setErrorMessage(null)

    void getProductById(productId)
      .then((response) => {
        if (isCurrentRequest) setProduct(response)
      })
      .catch((error: unknown) => {
        if (!isCurrentRequest) return
        setProduct(null)
        setErrorMessage(error instanceof Error ? error.message : 'Không thể tải sản phẩm.')
      })
      .finally(() => {
        if (isCurrentRequest) setIsLoading(false)
      })

    return () => {
      isCurrentRequest = false
    }
  }, [productId, reloadKey])

  const retry = useCallback(() => {
    setReloadKey((currentKey) => currentKey + 1)
  }, [])

  return { product, isLoading, errorMessage, retry }
}
