import {
  CaretDown,
  EnvelopeSimple,
  Handbag,
  List,
  MagnifyingGlass,
  Phone,
  UserCircle,
  X,
} from '@phosphor-icons/react'
import { useState } from 'react'
import { NavLink } from 'react-router-dom'

const mainNavigation = [
  { label: 'Trang chủ', to: '/' },
  { label: 'Sản phẩm', to: '/products', hasMenu: true },
  { label: 'Giải pháp', to: '/giai-phap' },
  { label: 'Dự án', to: '/du-an' },
  { label: 'Dịch vụ', to: '/dich-vu' },
  { label: 'Về CMID', to: '/ve-cmid' },
  { label: 'Liên hệ', to: '/lien-he' },
]

const navLinkClassName = ({ isActive }: { isActive: boolean }): string =>
  isActive ? 'site-nav__link site-nav__link--active' : 'site-nav__link'

export function SiteHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <header className="site-header">
      <div className="topbar">
        <div className="topbar__inner">
          <div className="topbar__contact">
            <a href="tel:02838386173">
              <Phone size={14} weight="fill" aria-hidden="true" />
              Hotline: 028 3838 6173
            </a>
            <a href="mailto:cmidvxd@gmail.com">
              <EnvelopeSimple size={14} weight="fill" aria-hidden="true" />
              Email: cmidvxd@gmail.com
            </a>
          </div>
          <nav className="topbar__nav" aria-label="Điều hướng phụ">
            <NavLink to="/ve-cmid">Về CMID</NavLink>
            <NavLink to="/tin-tuc-su-kien">Tin tức & Sự kiện</NavLink>
            <NavLink to="/he-thong-showroom">Hệ thống showroom</NavLink>
            <span className="topbar__language">VI</span>
            <span aria-hidden="true">|</span>
            <span>EN</span>
          </nav>
        </div>
      </div>

      <div className="site-header__main">
        <NavLink to="/" className="brand" aria-label="CMID - Trang chủ">
          <span className="brand__mark">C</span>
          <span className="brand__copy">
            <strong>CMID</strong>
            <small>Vật liệu và Nội thất</small>
          </span>
        </NavLink>

        <button
          className="menu-toggle"
          type="button"
          aria-label={isMenuOpen ? 'Đóng menu' : 'Mở menu'}
          aria-expanded={isMenuOpen}
          onClick={() => setIsMenuOpen((isOpen) => !isOpen)}
        >
          {isMenuOpen ? <X size={24} /> : <List size={24} />}
        </button>

        <nav
          className={isMenuOpen ? 'site-nav site-nav--open' : 'site-nav'}
          aria-label="Điều hướng chính"
        >
          {mainNavigation.map((item) => (
            <NavLink
              key={item.label}
              to={item.to}
              end={item.to === '/'}
              className={navLinkClassName}
              onClick={() => setIsMenuOpen(false)}
            >
              {item.label}
              {item.hasMenu ? <CaretDown size={12} weight="bold" aria-hidden="true" /> : null}
            </NavLink>
          ))}
        </nav>

        <div className="site-header__tools">
          <label className="site-search">
            <span className="sr-only">Tìm kiếm sản phẩm</span>
            <input type="search" placeholder="Tìm kiếm sản phẩm..." />
            <MagnifyingGlass size={17} aria-hidden="true" />
          </label>
          <NavLink to="/lien-he" className="header-icon" aria-label="Tài khoản">
            <UserCircle size={23} weight="regular" />
          </NavLink>
          <NavLink to="/lien-he" className="header-icon" aria-label="Giỏ hàng">
            <Handbag size={23} weight="regular" />
          </NavLink>
        </div>
      </div>
    </header>
  )
}
