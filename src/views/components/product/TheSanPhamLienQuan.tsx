/*
 * Vai trò: Card compact cho phần sản phẩm liên quan.
 */
import type { Product } from '../../../models/product'
import { ProductCard } from './TheSanPham'

interface TheSanPhamLienQuanProps {
  product: Product
}

export function TheSanPhamLienQuan({ product }: TheSanPhamLienQuanProps) {
  return <ProductCard product={product} variant="showcase" className="related-product-card" />
}
