/*
 * Vai trò: Hiển thị/điều hướng đơn hàng của khách.
 */
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { siteContent } from '../src/models/content/site-content'
import { LanguageContext } from '../src/controllers/state/NgonNguContext'
import { type CustomerProfile, type UserContextValue, UserContext } from '../src/controllers/state/NguoiDungContext'
import { TrangTaiKhoanPage } from '../src/views/pages/TrangTaiKhoan'

const orderService = vi.hoisted(() => ({
  getCustomerOrders: vi.fn(),
}))

vi.mock('../src/services/order.service', () => orderService)

const profile: CustomerProfile = {
  fullName: 'Nguyễn Văn A',
  avatar: '',
  phone: '0909000000',
  birthDate: '',
  gender: '',
  city: 'Hồ Chí Minh',
  district: 'Quận 1',
  ward: 'Phường Bến Nghé',
  address: '12 Lê Lợi',
}

const userContext: UserContextValue = {
  user: {
    id: 'customer-1',
    name: 'Nguyễn Văn A',
    email: 'a@example.com',
    role: 'CUSTOMER',
    permissions: [],
    emailVerified: true,
  },
  profile,
  isAuthLoading: false,
  isSigningIn: false,
  signInWithGoogle: vi.fn(),
  updateProfile: vi.fn(),
  signOut: vi.fn(),
}

function renderAccount(initialEntries = ['/tai-khoan']) {
  return render(
    <LanguageContext.Provider value={{ language: 'vi', setLanguage: () => {}, content: siteContent.vi }}>
      <UserContext.Provider value={userContext}>
        <MemoryRouter initialEntries={initialEntries}>
          <TrangTaiKhoanPage />
        </MemoryRouter>
      </UserContext.Provider>
    </LanguageContext.Provider>,
  )
}

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('customer orders on the account page', () => {
  it('loads and displays the signed-in customer orders', async () => {
    const pendingConfirmationOrder = {
      id: 'CMID-1001',
      customer: 'Nguyễn Văn A',
      email: 'a@example.com',
      phone: '0909000000',
      address: '12 Lê Lợi, Phường Bến Nghé, Quận 1, Hồ Chí Minh',
      items: [{ productId: 7, name: 'Ghế thử nghiệm', sku: 'GHE-01', quantity: 2, price: 1_000_000, image: '' }],
      subtotal: 2_000_000,
      vat: 200_000,
      total: 2_200_000,
      refundedAmount: 0,
      paymentMethod: 'Thanh toán khi nhận hàng (COD)',
      paymentMethodCode: 'COD' as const,
      paymentStatus: 'Chưa thanh toán' as const,
      status: 'Chờ xác nhận' as const,
      note: '',
      refunds: [],
      statusHistory: [],
      createdAt: '2026-10-02T08:00:00.000Z',
    }
    orderService.getCustomerOrders.mockResolvedValue([
      pendingConfirmationOrder,
      { ...pendingConfirmationOrder, id: 'CMID-1002', status: 'Chờ lấy hàng' },
    ])

    renderAccount()

    expect(await screen.findByText('CMID-1001')).toBeTruthy()
    expect(orderService.getCustomerOrders).toHaveBeenCalledTimes(1)
    expect(screen.getAllByText('Ghế thử nghiệm')).toHaveLength(2)
    expect(screen.getByText('Chờ xác nhận')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Đơn hàng' }))

    expect(screen.getByRole('heading', { name: 'Đơn hàng của tôi' })).toBeTruthy()
    expect(screen.getAllByText('Tổng thanh toán')).toHaveLength(2)
    expect(screen.getAllByText('2.200.000 đ')).toHaveLength(2)
    expect(screen.getByRole('button', { name: 'Tất cả (2)' }).getAttribute('aria-pressed')).toBe('true')
    expect(screen.getByRole('button', { name: 'Chờ xác nhận (1)' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Chờ lấy hàng (1)' })).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Chờ lấy hàng (1)' }))

    expect(screen.getByText('CMID-1002')).toBeTruthy()
    expect(screen.queryByText('CMID-1001')).toBeNull()
    expect(screen.getByRole('button', { name: 'Chờ lấy hàng (1)' }).getAttribute('aria-pressed')).toBe('true')

    fireEvent.click(screen.getByRole('button', { name: 'Đã hủy' }))

    expect(screen.getByText('Bạn chưa có đơn hàng nào cả.')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Đã hủy' }).getAttribute('aria-pressed')).toBe('true')

    fireEvent.click(screen.getByRole('button', { name: 'Chờ xác nhận (1)' }))

    expect(screen.getByText('CMID-1001')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Chờ xác nhận (1)' }).getAttribute('aria-pressed')).toBe('true')

    fireEvent.change(screen.getByRole('searchbox', { name: 'Tìm sản phẩm' }), { target: { value: 'Bàn' } })

    expect(screen.getByText('Bạn chưa có đơn hàng nào cả.')).toBeTruthy()

    expect(screen.queryByRole('button', { name: 'Lịch sử mua hàng' })).toBeNull()
  })

  it('restores the active order tab, filter, and product query from the URL', async () => {
    orderService.getCustomerOrders.mockResolvedValue([])

    renderAccount(['/tai-khoan?section=orders&filter=awaiting-pickup&q=ban'])

    expect(await screen.findByText('Bạn chưa có đơn hàng nào cả.')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Chờ lấy hàng' }).getAttribute('aria-pressed')).toBe('true')
    expect(screen.getByRole('searchbox', { name: 'Tìm sản phẩm' }).getAttribute('value')).toBe('ban')
  })
})
