/*
 * Vai trò: Toast xác nhận khi một sản phẩm được thêm vào giỏ.
 */
import { CheckCircleIcon, XIcon } from '@phosphor-icons/react'
import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useCart } from '../../../controllers/state/GioHangContext'
import { useLanguage } from '../../../controllers/state/NgonNguContext'

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
      <CheckCircleIcon size={20} weight="fill" aria-hidden="true" />
      <p><strong>{content.cart.added}</strong><span>{cartToastProductName}</span></p>
      <Link to="/gio-hang" onClick={dismissCartToast}>{content.cart.viewCart}</Link>
      <button type="button" onClick={dismissCartToast} aria-label={content.cart.closeNotification}>
        <XIcon size={17} weight="bold" aria-hidden="true" />
      </button>
    </div>
  )
}
