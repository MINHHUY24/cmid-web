import {
  ArrowRight,
  Bell,
  CaretRight,
  ListBullets,
  MagnifyingGlass,
  SignOut,
  X,
} from '@phosphor-icons/react'
import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { AdminSession } from './admin-auth'
import { adminMenuGroups, adminViewMeta, type AdminView } from './admin-navigation'
import type { AdminActivity } from './admin-database'
import { useAdminCopy } from './admin-language-context'

interface AdminLayoutProps {
  session: AdminSession
  activeView: AdminView
  activities: AdminActivity[]
  onNavigate: (view: AdminView) => void
  onSignOut: () => void
  onGlobalSearch: (value: string) => void
  globalSearchValue: string
  badges?: Partial<Record<AdminView, number>>
  children: ReactNode
}

export function AdminLayout({
  session,
  activeView,
  activities,
  onNavigate,
  onSignOut,
  onGlobalSearch,
  globalSearchValue,
  badges = {},
  children,
}: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const { language, t } = useAdminCopy()

  function navigate(view: AdminView) {
    onNavigate(view)
    setSidebarOpen(false)
  }

  return (
    <div className="admin-shell" lang={language}>
      <aside className={`admin-sidebar${sidebarOpen ? ' is-open' : ''}`} aria-label={t('Mở điều hướng')}>
        <div className="admin-sidebar__brand">
          <Link to="/" className="admin-brand" aria-label={t('Về website CMID')}>
            <strong>CMID</strong>
            <span>STONE &amp; INTERIOR</span>
          </Link>
          <b>{t('QUẢN TRỊ')}</b>
        </div>

        <nav className="admin-sidebar__nav">
          {adminMenuGroups.map((group) => (
            <section className="admin-nav-group" key={group.label}>
              <p>{t(group.label)}</p>
              {group.items.map((item) => {
                const active = activeView === item.id || (item.id === 'products' && activeView === 'product-editor')
                const badge = badges[item.id] ?? item.badge
                return (
                  <button
                    className={active ? 'is-active' : ''}
                    key={item.id}
                    type="button"
                    onClick={() => navigate(item.id)}
                  >
                    {item.icon}
                    <span>{t(item.label)}</span>
                    {badge ? <b className="admin-nav-badge">{badge}</b> : null}
                    {!badge ? <CaretRight size={14} aria-hidden="true" /> : null}
                  </button>
                )
              })}
            </section>
          ))}
        </nav>

        <div className="admin-sidebar__profile">
          <span className="admin-sidebar__avatar">A</span>
          <div>
            <strong>{session.name}</strong>
            <small>{t('Quản trị viên')}</small>
          </div>
          <button type="button" onClick={onSignOut} aria-label={t('Đăng xuất')}>
            <SignOut size={19} />
          </button>
        </div>
      </aside>

      <div className="admin-workspace">
        <header className="admin-topbar">
          <button
            className="admin-menu-toggle"
            type="button"
            onClick={() => setSidebarOpen((current) => !current)}
            aria-label={t(sidebarOpen ? 'Đóng điều hướng' : 'Mở điều hướng')}
          >
            {sidebarOpen ? <X size={21} /> : <ListBullets size={21} />}
          </button>

          <nav className="admin-breadcrumb" aria-label="Breadcrumb">
            <span>{t('Hệ thống')}</span>
            <CaretRight size={14} aria-hidden="true" />
            <strong>{t(adminViewMeta[activeView].label)}</strong>
          </nav>

          <label className="admin-global-search">
            <MagnifyingGlass size={18} aria-hidden="true" />
            <input
              value={globalSearchValue}
              onChange={(event) => {
                const value = event.target.value
                onGlobalSearch(value)
              }}
              placeholder={t('Tìm sản phẩm, đơn hàng...')}
            />
          </label>

          <div className="admin-notification-wrap">
            <button
              className="admin-icon-button"
              type="button"
              aria-label={t('Thông báo')}
              aria-expanded={notificationsOpen}
              onClick={() => setNotificationsOpen((current) => !current)}
            >
              <Bell size={19} />
              <i aria-hidden="true" />
            </button>
            {notificationsOpen ? (
              <section className="admin-notification-popover">
                <header><strong>{t('Hoạt động mới')}</strong><span>{activities.length}</span></header>
                {activities.slice(0, 4).map((activity) => (
                  <button key={activity.id} type="button" onClick={() => setNotificationsOpen(false)}>
                    <strong>{t(activity.action)}</strong>
                    <small>{formatRelativeTime(activity.createdAt, language)}</small>
                  </button>
                ))}
                <button type="button" onClick={() => { navigate('logs'); setNotificationsOpen(false) }}>
                  {t('Xem toàn bộ nhật ký')} <ArrowRight size={14} />
                </button>
              </section>
            ) : null}
          </div>

          <Link className="admin-site-link" to="/" target="_blank">
            {t('Xem website')} <ArrowRight size={15} />
          </Link>
        </header>

        <main className="admin-main">{children}</main>
      </div>

      {sidebarOpen ? (
        <button
          type="button"
          className="admin-backdrop"
          aria-label={t('Đóng điều hướng')}
          onClick={() => setSidebarOpen(false)}
        />
      ) : null}
    </div>
  )
}

function formatRelativeTime(value: string, language: 'vi' | 'en') {
  const timestamp = new Date(value).getTime()
  const minutes = Math.max(1, Math.round((Date.now() - timestamp) / 60000))
  if (minutes < 60) return language === 'en' ? `${minutes} min ago` : `${minutes} phút trước`
  if (minutes < 1440) return language === 'en' ? `${Math.round(minutes / 60)} hr ago` : `${Math.round(minutes / 60)} giờ trước`
  return new Date(value).toLocaleDateString(language === 'en' ? 'en-GB' : 'vi-VN')
}
