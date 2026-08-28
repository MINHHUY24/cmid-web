import {
  ArrowLeft,
  Minus,
  Plus,
  Trash,
} from '@phosphor-icons/react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CamKetDichVu } from '../components/common/CamKetDichVu'
import { DonHangTomTat } from '../components/cart/DonHangTomTat'
import { useCart } from '../contexts/GioHangContext'
import { useLanguage } from '../contexts/NgonNguContext'
import { useUser } from '../contexts/NguoiDungContext'
import { formatCurrency } from '../utils/formatCurrency'
import { getProductName } from '../utils/localizeProduct'
import { getProductPrice } from '../utils/order'

export function TrangGioHangPage() {
  const { items, removeItem, updateQuantity } = useCart()
  const { content, language } = useLanguage()
  const { user } = useUser()
  const { cart } = content
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false)

  return (
    <main className="commerce-page cart-page">
      <div className="commerce-shell">
        <nav className="commerce-breadcrumb" aria-label="Breadcrumb">
          <Link to="/">{content.common.home}</Link>
          <span aria-hidden="true">/</span>
          <span>{cart.breadcrumb}</span>
        </nav>
        <h1>{cart.title}</h1>

        {items.length === 0 ? (
          <section className="commerce-empty">
            <h2>{cart.emptyTitle}</h2>
            <p>{cart.emptyDescription}</p>
            <Link className="button button--gold" to="/products">
              <ArrowLeft size={17} aria-hidden="true" />
              {cart.browseProducts}
            </Link>
          </section>
        ) : (
          <>
            <div className="commerce-layout cart-page__layout">
              <section className="cart-table" aria-label={cart.title}>
                <div className="cart-table__head" aria-hidden="true">
                  <span>{cart.product}</span>
                  <span>{cart.unitPrice}</span>
                  <span>{cart.quantity}</span>
                  <span>{cart.status}</span>
                  <span>{cart.amount}</span>
                  <span />
                </div>

                {items.map((item) => {
                  const productName = getProductName(item.product, language)
                  const image =
                    item.product.images.find((productImage) => productImage.isPrimary) ??
                    item.product.images[0]
                  const lineTotal = getProductPrice(item.product.price) * item.quantity

                  return (
                    <article key={item.product.id} className="cart-line-item">
                      <div className="cart-line-item__product">
                        {image ? <img src={image.imageUrl} alt="" /> : <span aria-hidden="true" />}
                        <div>
                          <h2>{productName}</h2>
                          <p>SKU: {item.product.sku}</p>
                        </div>
                      </div>
                      <strong className="cart-line-item__price">
                        {formatCurrency(item.product.price, language)}
                        {item.product.unit ? <small>/{item.product.unit}</small> : null}
                      </strong>
                      <div className="quantity-control">
                        <button
                          type="button"
                          aria-label={cart.decrease(productName)}
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                        >
                          <Minus size={14} aria-hidden="true" />
                        </button>
                        <output>{item.quantity}</output>
                        <button
                          type="button"
                          aria-label={cart.increase(productName)}
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        >
                          <Plus size={14} aria-hidden="true" />
                        </button>
                      </div>
                      <span className="cart-line-item__availability">{content.product.inStock}</span>
                      <strong className="cart-line-item__total">{formatCurrency(lineTotal, language)}</strong>
                      <button
                        className="cart-line-item__remove"
                        type="button"
                        aria-label={cart.remove(productName)}
                        onClick={() => removeItem(item.product.id)}
                      >
                        <Trash size={18} aria-hidden="true" />
                      </button>
                    </article>
                  )
                })}

                <div className="cart-table__actions">
                  <Link className="button button--small button--outline" to="/products">
                    <ArrowLeft size={15} aria-hidden="true" />
                    {cart.continueShopping}
                  </Link>
                </div>
              </section>

              <DonHangTomTat
                items={items}
                actionLabel={cart.checkout}
                actionTo={user ? '/thanh-toan' : undefined}
                onAction={user ? undefined : () => setIsLoginDialogOpen(true)}
              />
            </div>
            <CamKetDichVu />
          </>
        )}
      </div>

      {isLoginDialogOpen ? (
        <div className="auth-dialog-backdrop" role="presentation" onMouseDown={() => setIsLoginDialogOpen(false)}>
          <section
            className="auth-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="cart-login-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <h2 id="cart-login-title">{content.auth.checkoutTitle}</h2>
            <p>{content.auth.checkoutDescription}</p>
            <div className="auth-dialog__actions">
              <button type="button" className="button button--ghost" onClick={() => setIsLoginDialogOpen(false)}>
                {content.auth.cancel}
              </button>
              <Link className="button button--gold" to="/dang-nhap" state={{ from: '/thanh-toan' }} onClick={() => setIsLoginDialogOpen(false)}>
                {content.auth.continueToLogin}
              </Link>
            </div>
          </section>
        </div>
      ) : null}
    </main>
  )
}
