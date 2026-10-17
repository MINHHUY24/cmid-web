/*
 * Vai trò: Form login Admin, đặc biệt thao tác hiện/ẩn mật khẩu.
 */
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import type { AdminAuthContextValue } from '../src/controllers/state/QuanTriAuthContext'
import { AdminAuthContext } from '../src/controllers/state/QuanTriAuthContext'
import { TrangDangNhapQuanTri } from '../src/views/pages/admin/TrangDangNhapQuanTri'

afterEach(() => {
  cleanup()
})

it('shows and hides the admin password without submitting the form', () => {
  const signInAdminWithPassword = vi.fn().mockResolvedValue({
    id: 'admin-1',
    name: 'Admin CMID',
    email: 'admin@cmid.com.vn',
    role: 'admin',
    permissions: [],
    emailVerified: true,
  })
  const authValue: AdminAuthContextValue = {
    adminUser: null,
    isAdminAuthLoading: false,
    isAdminSigningIn: false,
    signInAdminWithPassword,
    signOutAdmin: vi.fn().mockResolvedValue(undefined),
  }

  render(
    <AdminAuthContext.Provider value={authValue}>
      <TrangDangNhapQuanTri />
    </AdminAuthContext.Provider>,
  )

  const passwordInput = screen.getByLabelText('Mật khẩu')
  const toggle = screen.getByRole('button', { name: 'Hiện mật khẩu' })

  expect(passwordInput.getAttribute('type')).toBe('password')
  expect(toggle.getAttribute('aria-pressed')).toBe('false')

  fireEvent.click(toggle)

  expect(passwordInput.getAttribute('type')).toBe('text')
  expect(screen.getByRole('button', { name: 'Ẩn mật khẩu' }).getAttribute('aria-pressed')).toBe('true')
  expect(signInAdminWithPassword).not.toHaveBeenCalled()

  fireEvent.click(screen.getByRole('button', { name: 'Ẩn mật khẩu' }))

  expect(passwordInput.getAttribute('type')).toBe('password')
  expect(screen.getByRole('button', { name: 'Hiện mật khẩu' }).getAttribute('aria-pressed')).toBe('false')
})
