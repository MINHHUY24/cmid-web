/*
 * Vai trò: Header desktop/mobile: hotline, ngôn ngữ, theme, menu, tài khoản và giỏ hàng.
 */
import {
  EnvelopeSimpleIcon,
  ListIcon,
  MoonIcon,
  PhoneIcon,
  ShoppingCartSimpleIcon,
  SunIcon,
  UserCircleIcon,
  XIcon,
} from '@phosphor-icons/react'
import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useCart } from '../../../controllers/state/GioHangContext'
import { useLanguage } from '../../../controllers/state/NgonNguContext'
import { useUser } from '../../../controllers/state/NguoiDungContext'
import { useColorThemeController as useColorTheme } from '../../../controllers/ui/useColorThemeController'
import { useSiteSettings } from '../../../controllers/state/ThongTinWebsiteContext'
import logoImage from '../../../models/assets/images/logo.webp'

const navLinkClassName = ({ isActive }: { isActive: boolean }): string =>
  isActive ? 'site-nav__link site-nav__link--active' : 'site-nav__link'

export function SiteHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { colorTheme, toggleColorTheme } = useColorTheme()
  const { itemCount } = useCart()
  const { content, language, setLanguage } = useLanguage()
  const { user, isAuthLoading } = useUser()
  const { settings } = useSiteSettings()
  const mainNavigation = [
    { label: content.header.home, to: '/' },
    { label: content.header.products, to: '/products' },
    { label: content.header.projects, to: '/du-an' },
    { label: content.header.about, to: '/ve-cmid' },
    { label: content.header.news, to: '/tin-tuc-su-kien' },
    { label: content.header.contact, to: '/lien-he' },
  ]

  const nextThemeLabel = colorTheme === 'dark'
    ? language === 'vi' ? 'Chuyển sang giao diện sáng' : 'Switch to light theme'
    : language === 'vi' ? 'Chuyển sang giao diện tối' : 'Switch to dark theme'
  const languageSelectorLabel = language === 'vi' ? 'Chọn ngôn ngữ' : 'Language selector'
  const mainNavigationLabel = language === 'vi' ? 'Điều hướng chính' : 'Main navigation'

  useEffect(() => {
    if (!isMenuOpen) return

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsMenuOpen(false)
    }
    const previousOverflow = document.body.style.overflow

    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', closeOnEscape)

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [isMenuOpen])

  const renderNavigationLinks = () => mainNavigation.map((item) => (
    <NavLink
      key={item.label}
      to={item.to}
      end={item.to === '/'}
      className={navLinkClassName}
      onClick={() => setIsMenuOpen(false)}
    >
      {item.label}
    </NavLink>
  ))

  return (
    <>
      <header className="site-header">
      <div className="topbar">
        <div className="topbar__inner">
          <div className="topbar__contact">
            <a href={`tel:${settings.phone.replaceAll(/[^+\d]/g, '')}`}>
              <PhoneIcon size={14} weight="fill" aria-hidden="true" />
              {content.header.hotline} {settings.phone}
            </a>
            <a href={`mailto:${settings.email}`}>
              <EnvelopeSimpleIcon size={14} weight="fill" aria-hidden="true" />
              {settings.email}
            </a>
          </div>
          <div className="topbar__actions">
            <div
              className="topbar__language-switcher"
              role="group"
              aria-label={languageSelectorLabel}
            >
              <button
                type="button"
                className={language === 'vi' ? 'topbar__language topbar__language--active' : 'topbar__language'}
                aria-pressed={language === 'vi'}
                onClick={() => setLanguage('vi')}
              >
                VI
              </button>
              <span aria-hidden="true">/</span>
              <button
                type="button"
                className={language === 'en' ? 'topbar__language topbar__language--active' : 'topbar__language'}
                aria-pressed={language === 'en'}
                onClick={() => setLanguage('en')}
              >
                EN
              </button>
            </div>

            <span className="topbar__divider" aria-hidden="true" />
            <button
              type="button"
              className="color-theme-switch"
              data-theme={colorTheme}
              aria-label={nextThemeLabel}
              title={nextThemeLabel}
              onClick={toggleColorTheme}
            >
              <span className="color-theme-switch__thumb" aria-hidden="true" />
              <SunIcon size={14} weight="bold" aria-hidden="true" />
              <MoonIcon size={14} weight="fill" aria-hidden="true" />
            </button>

            <span className="topbar__divider" aria-hidden="true" />
            <NavLink
              to={user || isAuthLoading ? '/tai-khoan' : '/dang-nhap'}
              className={isAuthLoading ? 'topbar__account-link topbar__account-link--loading' : 'topbar__account-link'}
              aria-label={user || isAuthLoading ? content.auth.account : content.auth.signIn}
              aria-busy={isAuthLoading || undefined}
            >
              {isAuthLoading ? (
                <span className="topbar__account-loader" aria-hidden="true" />
              ) : (
                <>
                  <UserCircleIcon size={17} weight="regular" aria-hidden="true" />
                  <span>{user ? user.name : content.auth.signIn}</span>
                </>
              )}
            </NavLink>

            <span className="topbar__divider" aria-hidden="true" />
            <NavLink
              to="/gio-hang"
              className="header-icon header-icon--cart"
              aria-label={content.header.cartAria(itemCount)}
            >
              <ShoppingCartSimpleIcon size={21} weight="regular" />
              {itemCount > 0 ? <span>{itemCount > 99 ? '99+' : itemCount}</span> : null}
            </NavLink>
          </div>
        </div>
      </div>

      <div className="site-header__main">
        <NavLink to="/" className="brand" aria-label={`CMID - ${content.common.home}`}>
          <img className="brand__mark" src={logoImage} alt="" aria-hidden="true" />
          <span className="brand__copy">
            <strong>CMID</strong>
            <small>Stone &amp; Interior</small>
          </span>
        </NavLink>

        <button
          className="menu-toggle"
          type="button"
          aria-controls="mobile-navigation"
          aria-label={isMenuOpen ? content.header.menuClose : content.header.menuOpen}
          aria-expanded={isMenuOpen}
          onClick={() => setIsMenuOpen((isOpen) => !isOpen)}
        >
          <ListIcon size={28} />
        </button>

        <nav className="site-nav" aria-label={mainNavigationLabel}>
          {renderNavigationLinks()}
        </nav>

      </div>
      </header>
      <div className={isMenuOpen ? 'mobile-navigation mobile-navigation--open' : 'mobile-navigation'}>
      <button
        className="mobile-navigation__backdrop"
        type="button"
        tabIndex={isMenuOpen ? 0 : -1}
        aria-label={content.header.menuClose}
        onClick={() => setIsMenuOpen(false)}
      />
      <aside
        id="mobile-navigation"
        className="mobile-navigation__panel"
        aria-label={mainNavigationLabel}
        aria-hidden={!isMenuOpen}
      >
        <div className="mobile-navigation__header">
          <button
            className="mobile-navigation__close"
            type="button"
            tabIndex={isMenuOpen ? 0 : -1}
            aria-label={content.header.menuClose}
            onClick={() => setIsMenuOpen(false)}
          >
            <XIcon size={26} weight="bold" aria-hidden="true" />
          </button>
        </div>
        <nav className="mobile-navigation__links" aria-label={mainNavigationLabel}>
          {renderNavigationLinks()}
        </nav>
      </aside>
      </div>
    </>
  )
}
