import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { AdminSelect } from '../src/pages/admin/AdminPrimitives'

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
