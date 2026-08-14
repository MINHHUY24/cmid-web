import { Link } from 'react-router-dom'
import type { Product } from '../../types/product'
import { formatCurrency } from '../../utils/formatCurrency'

interface TheSanPhamLienQuanProps {
  product: Product
}

export function TheSanPhamLienQuan({ product }: TheSanPhamLienQuanProps) {
  const primaryImage = product.images.find((image) => image.isPrimary) ?? product.images[0]

  return (
    <Link className="related-product-card" to={`/products/${product.id}`}>
      <div className="related-product-card__image">
        {primaryImage ? <img src={primaryImage.imageUrl} alt={primaryImage.altText ?? product.name} /> : null}
      </div>
      <div className="related-product-card__body">
        <p>{product.category?.name ?? 'Sản phẩm CMID'}</p>
        <h3>{product.name}</h3>
        <strong>
          {formatCurrency(product.price)}
          {product.unit ? <span>/{product.unit}</span> : null}
        </strong>
      </div>
    </Link>
  )
}
