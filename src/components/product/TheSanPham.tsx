import { ChatCircleText, Package, ShoppingCartSimple } from '@phosphor-icons/react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useCart } from '../../contexts/GioHangContext'
import { useLanguage } from '../../contexts/NgonNguContext'
import type { Product, ProductImage } from '../../types/product'
import { formatCurrency } from '../../utils/formatCurrency'
import { getBrandName, getCategoryName, getProductName } from '../../utils/localizeProduct'

interface ProductCardProps {
  product: Product
  variant?: 'catalog' | 'showcase'
  className?: string
}

interface ProductImagePreviewProps {
  image: ProductImage | undefined
  productName: string
}

function ProductImagePreview({ image, productName }: ProductImagePreviewProps) {
  const [hasImageError, setHasImageError] = useState(false)
  const { content } = useLanguage()

  if (!image || hasImageError) {
    return (
      <div className="product-card__placeholder" aria-label={`${productName}: ${content.product.noImage}`}>
        <Package size={44} weight="thin" aria-hidden="true" />
        <span>{content.product.noImage}</span>
      </div>
    )
  }

  return (
    <img
      className="product-card__image"
      src={image.imageUrl}
      alt={image.altText?.trim() || productName}
      loading="lazy"
      decoding="async"
      onError={() => setHasImageError(true)}
    />
  )
}

export function ProductCard({ product, variant = 'catalog', className = '' }: ProductCardProps) {
  const { addItem } = useCart()
  const { content, language } = useLanguage()
  const productName = getProductName(product, language)
  const categoryName = getCategoryName(product.category, language)
  const brandName = getBrandName(product.brand, language)
  const primaryImage =
    product.images.find((image) => image.isPrimary) ?? product.images[0]
  const has3DModel = product.models3D.length > 0
  const canAddToCart = product.saleType === 'DIRECT_ORDER' && product.status === 'ACTIVE'
  const actionLabel = canAddToCart ? content.product.addToCart : content.product.quote
  const actionPath = `/lien-he?bao-gia-san-pham=${product.id}`
  const availabilityLabel = product.status === 'ACTIVE' ? content.product.inStock : content.product.madeToOrder

  function handleAddToCart() {
    addItem(product)
  }

  if (variant === 'showcase') {
    return (
      <article className={`product-card product-card--showcase ${className}`.trim()}>
        <Link
          className="product-card__showcase-link"
          to={`/products/${product.id}`}
          aria-label={content.product.viewDetail(productName)}
        >
          <div className="product-card__media">
            <ProductImagePreview image={primaryImage} productName={productName} />
          </div>
          <div className="product-card__body">
            <h2>{productName}</h2>
            <div className="product-card__price-row">
              <strong>{formatCurrency(product.price, language)}</strong>
              {product.unit ? <span>/{product.unit}</span> : null}
            </div>
          </div>
        </Link>
      </article>
    )
  }

  return (
    <article className="product-card product-card--catalog">
      <Link
        className="product-card__detail-link"
        to={`/products/${product.id}`}
        aria-label={content.product.viewDetail(productName)}
      />
      <div className="product-card__media">
        {has3DModel ? (
            <span className="product-card__3d-badge" aria-label={content.product.has3D}>
            3D
          </span>
        ) : null}
        <ProductImagePreview image={primaryImage} productName={productName} />
      </div>

      <div className="product-card__body">
        <p className="product-card__meta">{categoryName ?? content.product.uncategorized}</p>
        <h2>{productName}</h2>
        <p className="product-card__sku">
          <span>{brandName ?? 'CMID'}</span>
          <span>SKU: {product.sku}</span>
        </p>

        <div className="product-card__price-row">
          <strong>{formatCurrency(product.price, language)}</strong>
          {product.unit ? <span>/{product.unit}</span> : null}
          <span className="product-card__availability">
            <i aria-hidden="true" />
            {availabilityLabel}
          </span>
        </div>

        <div className="product-card__footer">
          <span className="sr-only">
            {product.saleType === 'DIRECT_ORDER' ? content.product.directOrder : content.product.quote}
            {has3DModel ? `, ${content.product.has3D}` : ''}
          </span>
          {canAddToCart ? (
            <button
              className="button button--small button--gold product-card__action"
              type="button"
              onClick={handleAddToCart}
            >
              <ShoppingCartSimple size={16} weight="regular" aria-hidden="true" />
              {actionLabel}
            </button>
          ) : (
            <Link
              className="button button--small product-card__action product-card__action--quote"
              to={actionPath}
            >
              <ChatCircleText size={16} weight="regular" aria-hidden="true" />
              {actionLabel}
            </Link>
          )}
        </div>
      </div>
    </article>
  )
}
