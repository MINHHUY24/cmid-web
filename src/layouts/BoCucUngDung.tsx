import { Outlet, useLocation } from 'react-router-dom'
import { CartToast } from '../components/cart/ThongBaoGioHang'
import { FloatingActions } from '../components/common/FloatingActions'
import { LanguageWelcomeDialog } from '../components/common/ChonNgonNguDialog'
import { PullToRefresh } from '../components/common/PullToRefresh'
import { SiteFooter } from '../components/layout/ChanTrang'
import { SiteHeader } from '../components/layout/DauTrang'
import { SiteSeo } from '../components/common/SiteSeo'
import { CartProvider } from '../contexts/CartProvider'

const heroPagePaths = new Set([
  '/products',
  '/giai-phap',
  '/du-an',
  '/dich-vu',
  '/ve-cmid',
  '/lien-he',
  '/tin-tuc-su-kien',
  '/he-thong-showroom',
])

export function AppLayout() {
  const { pathname } = useLocation()
  const isHomePage = pathname === '/'
  const isAccountPage = pathname === '/tai-khoan'
  const isProductDetailPage = /^\/products\/[^/]+$/.test(pathname)
  const isHeroPage = heroPagePaths.has(pathname) || isProductDetailPage
  const shellClassName = [
    'app-shell',
    'app-shell--site',
    isHomePage ? 'app-shell--home' : '',
    isAccountPage ? 'app-shell--account' : '',
    isHeroPage ? 'app-shell--hero' : '',
    isProductDetailPage ? 'app-shell--product-detail' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <CartProvider>
      <div className={shellClassName}>
        <SiteSeo />
        <PullToRefresh />
        <SiteHeader />
        <div className="site-main">
          <Outlet />
        </div>
        <SiteFooter />
        <CartToast />
        <FloatingActions />
        <LanguageWelcomeDialog />
        <div id="site-toast-root" />
        <div id="site-modal-root" />
      </div>
    </CartProvider>
  )
}
