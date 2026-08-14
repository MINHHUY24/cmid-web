import { apiFetch } from './api'
import type { Product } from '../types/product'

export function getProducts(): Promise<Product[]> {
  return apiFetch<Product[]>('/products')
}

export function getProductById(id: number): Promise<Product> {
  return apiFetch<Product>(`/products/${id}`)
}
