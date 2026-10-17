/*
 * Vai trò: Select Admin đóng khi click ngoài và scroll đến option đang chọn.
 */
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { AdminSelect } from '../src/views/pages/admin/ThanhPhanCoBanQuanTri'

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

it('closes an open option menu when pressing outside it', async () => {
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    callback(0)
    return 1
  })

  render(
    <div>
      <AdminSelect
        aria-label="Trạng thái đơn hàng"
        value="Chờ xác nhận"
        options={[
          { value: 'Chờ xác nhận', label: 'Chờ xác nhận' },
          { value: 'Đang giao', label: 'Đang giao' },
        ]}
      />
      <button type="button">Bên ngoài</button>
    </div>,
  )

  fireEvent.click(screen.getByRole('button', { name: 'Trạng thái đơn hàng' }))
  expect(await screen.findByRole('listbox')).toBeTruthy()

  fireEvent.pointerDown(screen.getByRole('button', { name: 'Bên ngoài' }))
  await waitFor(() => expect(screen.queryByRole('listbox')).toBeNull())
})

it('scrolls the selected option into view when opening a long menu', async () => {
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    callback(0)
    return 1
  })

  render(
    <AdminSelect
      aria-label="Danh mục sản phẩm"
      value="sanitary"
      options={[
        { value: 'all', label: 'Tất cả danh mục' },
        { value: 'doors', label: 'Cửa & Phụ kiện' },
        { value: 'stone', label: 'Đá tự nhiên' },
        { value: 'tiles', label: 'Gạch ốp lát' },
        { value: 'dining', label: 'Nội thất phòng ăn' },
        { value: 'living', label: 'Nội thất phòng khách' },
        { value: 'office', label: 'Nội thất văn phòng' },
        { value: 'sanitary', label: 'Thiết bị vệ sinh' },
      ]}
    />,
  )

  fireEvent.click(screen.getByRole('button', { name: 'Danh mục sản phẩm' }))

  const menu = await screen.findByRole('listbox')
  const selectedOption = screen.getByRole('option', { name: 'Thiết bị vệ sinh' })
  Object.defineProperties(menu, {
    clientHeight: { configurable: true, value: 140 },
  })
  Object.defineProperties(selectedOption, {
    offsetHeight: { configurable: true, value: 36 },
    offsetTop: { configurable: true, value: 280 },
  })

  fireEvent.resize(window)

  await waitFor(() => expect(menu.scrollTop).toBe(228))
})
