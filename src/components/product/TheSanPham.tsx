import { ChatCircleText, Package, ShoppingCartSimple } from '@phosphor-icons/react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { SALE_TYPE_LABELS } from '../../constants/product'
import type { Product, ProductImage } from '../../types/product'
import { formatCurrency } from '../../utils/formatCurrency'

interface ProductCardProps {
  product: Product
  variant?: 'catalog' | 'showcase'
}

interface ProductImagePreviewProps {
  image: ProductImage | undefined
  productName: string
}

function ProductImagePreview({ image, productName }: ProductImagePreviewProps) {
  const [hasImageError, setHasImageError] = useState(false)

  if (!image || hasImageError) {
    return (
      <div className="product-card__placeholder" aria-label={`${productName}: Chưa có ảnh`}>
        <Package size={44} weight="thin" aria-hidden="true" />
        <span>Chưa có ảnh</span>
      </div>
    )
  }

  return (
    <img
      className="product-card__image"
      src={image.imageUrl}
      alt={image.altText ?? productName}
      onError={() => setHasImageError(true)}
    />
  )
}

export function ProductCard({ product, variant = 'catalog' }: ProductCardProps) {
  const primaryImage =
    product.images.find((image) => image.isPrimary) ?? product.images[0]
  const has3DModel = product.models3D.length > 0
  const isDirectOrder = product.saleType === 'DIRECT_ORDER'
  const actionLabel = isDirectOrder ? 'Mua trực tiếp' : 'Liên hệ báo giá'
  const actionPath = isDirectOrder
    ? `/lien-he?mua-san-pham=${product.id}`
    : `/lien-he?bao-gia-san-pham=${product.id}`
  const availabilityLabel = product.status === 'ACTIVE' ? 'Còn hàng' : 'Đặt hàng'

  return (
    <article className={`product-card product-card--${variant}`}>
      <Link
        className="product-card__media product-card__media-link"
        to={`/products/${product.id}`}
        aria-label={`Xem chi tiết ${product.name}`}
      >
        {variant === 'catalog' && has3DModel ? (
          <span className="product-card__3d-badge" aria-label="Có mô hình 3D">
            3D
          </span>
        ) : null}
        <ProductImagePreview image={primaryImage} productName={product.name} />
      </Link>

      <div className="product-card__body">
        <p className="product-card__meta">{product.category?.name ?? 'Chưa phân loại'}</p>
        <h2>{product.name}</h2>
        {variant === 'catalog' ? (
          <p className="product-card__sku">
            <span>{product.brand?.name ?? 'CMID'}</span>
            <span>SKU: {product.sku}</span>
          </p>
        ) : null}

        <div className="product-card__price-row">
          <strong>{formatCurrency(product.price)}</strong>
          {product.unit ? <span>/{product.unit}</span> : null}
          {variant === 'catalog' ? (
            <span className="product-card__availability">
              <i aria-hidden="true" />
              {availabilityLabel}
            </span>
          ) : null}
        </div>

        <div className="product-card__footer">
          {variant === 'catalog' ? (
            <span className="sr-only">
              {SALE_TYPE_LABELS[product.saleType]}
              {has3DModel ? ', Có mô hình 3D' : ''}
            </span>
          ) : null}
          <Link
            className={
              isDirectOrder
                ? 'button button--small button--gold product-card__action'
                : 'button button--small product-card__action product-card__action--quote'
            }
            to={actionPath}
          >
            {isDirectOrder ? (
              <ShoppingCartSimple size={16} weight="regular" aria-hidden="true" />
            ) : (
              <ChatCircleText size={16} weight="regular" aria-hidden="true" />
            )}
            {actionLabel}
          </Link>
        </div>
      </div>
    </article>
  )
}
