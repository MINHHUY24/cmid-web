import type { Product } from '../../types/product'
import { ProductCard } from './TheSanPham'

interface TheSanPhamLienQuanProps {
  product: Product
}

export function TheSanPhamLienQuan({ product }: TheSanPhamLienQuanProps) {
  return <ProductCard product={product} variant="showcase" className="related-product-card" />
}
