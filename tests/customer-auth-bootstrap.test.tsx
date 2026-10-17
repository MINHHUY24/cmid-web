/*
 * Vai trò: Trạng thái UI khi đang restore phiên khách hàng.
 */
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SiteHeader } from '../src/views/components/layout/DauTrang'
import { siteContent } from '../src/models/content/site-content'
import { CartProvider } from '../src/controllers/state/CartProvider'
import { SiteSettingsProvider } from '../src/controllers/state/ThongTinWebsiteContext'
import { LanguageContext } from '../src/controllers/state/NgonNguContext'
import { type CustomerProfile, type UserContextValue, UserContext } from '../src/controllers/state/NguoiDungContext'
import { TrangDangNhapPage } from '../src/views/pages/TrangDangNhap'
import { TrangTaiKhoanPage } from '../src/views/pages/TrangTaiKhoan'

const emptyProfile: CustomerProfile = {
  fullName: '',
  avatar: '',
  phone: '',
  birthDate: '',
  gender: '',
  city: '',
  district: '',
  ward: '',
  address: '',
}

const restoringUserContext: UserContextValue = {
  user: null,
  profile: emptyProfile,
  isAuthLoading: true,
  isSigningIn: false,
  signInWithGoogle: vi.fn(),
  updateProfile: vi.fn(),
  signOut: vi.fn(),
}

function renderWithCustomerAuth(ui: React.ReactNode) {
  return render(
    <LanguageContext.Provider value={{ language: 'vi', setLanguage: () => {}, content: siteContent.vi }}>
      <UserContext.Provider value={restoringUserContext}>
        {ui}
      </UserContext.Provider>
    </LanguageContext.Provider>,
  )
}

beforeEach(() => {
  vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }))
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('customer auth bootstrap', () => {
  it('holds the account route in a neutral state instead of redirecting before the session restore completes', () => {
    renderWithCustomerAuth(
      <MemoryRouter initialEntries={['/tai-khoan']}>
        <Routes>
          <Route path="/tai-khoan" element={<TrangTaiKhoanPage />} />
          <Route path="/dang-nhap" element={<p>redirected to login</p>} />
        </Routes>
      </MemoryRouter>,
    )

    const loadingStatus = screen.getByRole('status')
    expect(loadingStatus.className).toContain('account-page--skeleton')
    expect(loadingStatus.querySelector('.account-session-skeleton__sidebar')).not.toBeNull()
    expect(loadingStatus.querySelectorAll('.cmid-skeleton').length).toBeGreaterThan(1)
    expect(loadingStatus.querySelector('.auth-session-status__spinner')).toBeNull()
    expect(loadingStatus.querySelector('.sr-only')?.textContent).toContain('Đang khôi phục phiên đăng nhập')
    expect(screen.queryByText('redirected to login')).toBeNull()
  })

  it('does not render the Google sign-in action while an existing session is being restored', () => {
    renderWithCustomerAuth(
      <MemoryRouter initialEntries={['/dang-nhap']}>
        <Routes>
          <Route path="/dang-nhap" element={<TrangDangNhapPage />} />
        </Routes>
      </MemoryRouter>,
    )

    const loadingStatus = screen.getByRole('status')
    expect(loadingStatus.querySelector('.auth-session-status__spinner')).not.toBeNull()
    expect(loadingStatus.querySelector('.sr-only')?.textContent).toContain('Đang khôi phục phiên đăng nhập')
    expect(screen.queryByRole('button', { name: 'Tiếp tục với Google' })).toBeNull()
  })

  it('keeps the header account link neutral and routed to the account while auth is restoring', () => {
    renderWithCustomerAuth(
      <MemoryRouter>
        <CartProvider>
          <SiteSettingsProvider>
            <SiteHeader />
          </SiteSettingsProvider>
        </CartProvider>
      </MemoryRouter>,
    )

    const accountLink = screen.getByRole('link', { name: 'Tài khoản' })
    expect(accountLink.getAttribute('href')).toBe('/tai-khoan')
    expect(accountLink.getAttribute('aria-busy')).toBe('true')
    expect(accountLink.textContent).toBe('')
    expect(accountLink.querySelector('.topbar__account-loader')).not.toBeNull()
  })
})
