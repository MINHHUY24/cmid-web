import { Outlet } from 'react-router-dom'
import { SiteFooter } from '../components/layout/ChanTrang'
import { SiteHeader } from '../components/layout/DauTrang'

export function AppLayout() {
  return (
    <div className="app-shell">
      <SiteHeader />
      <main className="site-main">
        <Outlet />
      </main>
      <SiteFooter />
    </div>
  )
}
