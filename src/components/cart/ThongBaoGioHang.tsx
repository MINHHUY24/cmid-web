import { CheckCircle, X } from '@phosphor-icons/react'
import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useCart } from '../../contexts/GioHangContext'
import { useLanguage } from '../../contexts/NgonNguContext'

export function CartToast() {
  const { cartToastProductName, dismissCartToast } = useCart()
  const { content } = useLanguage()

  useEffect(() => {
    if (!cartToastProductName) {
      return undefined
    }

    const timeoutId = window.setTimeout(dismissCartToast, 3600)
    return () => window.clearTimeout(timeoutId)
  }, [cartToastProductName, dismissCartToast])

  if (!cartToastProductName) {
    return null
  }

  return (
    <div className="cart-toast" role="status" aria-live="polite">
      <CheckCircle size={20} weight="fill" aria-hidden="true" />
      <p><strong>{content.cart.added}</strong><span>{cartToastProductName}</span></p>
      <Link to="/gio-hang" onClick={dismissCartToast}>{content.cart.viewCart}</Link>
      <button type="button" onClick={dismissCartToast} aria-label={content.cart.closeNotification}>
        <X size={17} weight="bold" aria-hidden="true" />
      </button>
    </div>
  )
}
