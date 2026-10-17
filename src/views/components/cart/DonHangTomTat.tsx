/*
 * Vai trò: Tóm tắt sản phẩm, số lượng, phí và tổng tiền trước thanh toán.
 */
import { LockKeyIcon, ShieldCheckIcon } from '@phosphor-icons/react'
import { Link } from 'react-router-dom'
import type { CartItem } from '../../../controllers/state/GioHangContext'
import { formatCurrency } from '../../utils/formatCurrency'
import { getOrderCosts, getProductPrice } from '../../../models/order'
import { useLanguage } from '../../../controllers/state/NgonNguContext'
import { getProductName } from '../../utils/localizeProduct'

interface DonHangTomTatProps {
  items: CartItem[]
  actionLabel: string
  actionTo?: string
  formId?: string
  onAction?: () => void
  showProducts?: boolean
  disabled?: boolean
}

export function DonHangTomTat({
  items,
  actionLabel,
  actionTo,
  formId,
  onAction,
  showProducts = false,
  disabled = false,
}: DonHangTomTatProps) {
  const { content, language } = useLanguage()
  const subtotal = items.reduce(
    (total, item) => total + getProductPrice(item.product.price) * item.quantity,
    0,
  )
  const costs = getOrderCosts(subtotal)

  return (
    <aside className="order-summary" aria-label={content.cart.summary}>
      <h2>{showProducts ? content.cart.itemSummary(items.length) : content.cart.summary}</h2>

      {showProducts ? (
        <div className="order-summary__items">
          {items.map((item) => {
            const productName = getProductName(item.product, language)
            const image =
              item.product.images.find((productImage) => productImage.isPrimary) ??
              item.product.images[0]

            return (
              <article key={item.product.id} className="order-summary__item">
                {image ? <img src={image.imageUrl} alt="" /> : <span aria-hidden="true" />}
                <div>
                  <h3>{productName}</h3>
                  <p>
                    {item.quantity} {item.product.unit ?? content.common.product}
                  </p>
                </div>
                <strong>{formatCurrency(getProductPrice(item.product.price) * item.quantity, language)}</strong>
              </article>
            )
          })}
        </div>
      ) : null}

      <dl className="order-summary__costs">
        <div>
          <dt>{content.cart.subtotal}</dt>
          <dd>{formatCurrency(subtotal, language)}</dd>
        </div>
        <div>
          <dt>{content.cart.shipping}</dt>
          <dd className="order-summary__free">{content.cart.free}</dd>
        </div>
        <div>
          <dt>VAT (10%)</dt>
          <dd>{formatCurrency(costs.vat, language)}</dd>
        </div>
      </dl>

      <div className="order-summary__total">
        <span>{content.cart.total}</span>
        <strong>{formatCurrency(costs.total, language)}</strong>
      </div>

      {actionTo && !onAction ? (
        <Link className="button button--gold order-summary__action" to={actionTo}>
          {actionLabel}
        </Link>
      ) : (
        <button
          className="button button--gold order-summary__action"
          type={onAction ? 'button' : 'submit'}
          form={onAction ? undefined : formId}
          onClick={onAction}
          disabled={disabled}
        >
          {actionLabel}
        </button>
      )}

      <p className="order-summary__privacy">
        <LockKeyIcon size={16} aria-hidden="true" />
        {content.cart.privacy}
      </p>
      <p className="order-summary__assurance">
        <ShieldCheckIcon size={28} weight="thin" aria-hidden="true" />
        {content.cart.assurance}
      </p>
    </aside>
  )
}
