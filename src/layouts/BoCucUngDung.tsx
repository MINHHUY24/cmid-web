import { Outlet, useLocation } from 'react-router-dom'
import { CartToast } from '../components/cart/ThongBaoGioHang'
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
  const isHeroPage = heroPagePaths.has(pathname)
  const shellClassName = [
    'app-shell',
    'app-shell--site',
    isHomePage ? 'app-shell--home' : '',
    isHeroPage ? 'app-shell--hero' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <CartProvider>
      <div className={shellClassName}>
        <SiteSeo />
        <SiteHeader />
        <div className="site-main">
          <Outlet />
        </div>
        <SiteFooter />
        <CartToast />
      </div>
    </CartProvider>
  )
}
