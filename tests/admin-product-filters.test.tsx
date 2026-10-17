/*
 * Vai trò: Giữ filter catalogue Admin khi mở rồi quay lại editor.
 */
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { afterEach, expect, it, vi } from 'vitest'
import { AdminProductsListView, type AdminProductListFilters } from '../src/views/pages/admin/GiaoDienThuongMaiQuanTri'
import type { Product } from '../src/models/product'

const product: Product = {
  id: 8,
  sku: 'CMID-CHAIR-01',
  name: 'Ghế thư giãn CMID',
  slug: 'ghe-thu-gian-cmid',
  description: null,
  price: '4500000',
  unit: 'chiếc',
  saleType: 'REQUEST_QUOTE',
  status: 'ACTIVE',
  category: {
    id: 4,
    name: 'Nội thất phòng khách',
    slug: 'noi-that-phong-khach',
  },
  brand: null,
  images: [],
  models3D: [],
}

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

it('keeps category and sale type filters after returning from a product editor', () => {
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    callback(0)
    return 1
  })

  render(<ProductListFlow />)

  fireEvent.click(screen.getByRole('button', { name: 'Lọc danh mục' }))
  fireEvent.click(screen.getByRole('option', { name: 'Nội thất phòng khách' }))
  fireEvent.click(screen.getByRole('button', { name: 'Lọc loại bán' }))
  fireEvent.click(screen.getByRole('option', { name: 'Liên hệ báo giá' }))

  fireEvent.click(screen.getByRole('button', { name: `Chỉnh sửa ${product.name}` }))
  fireEvent.click(screen.getByRole('button', { name: 'Quay lại danh sách' }))

  expect(screen.getByRole('button', { name: 'Lọc danh mục' }).textContent).toContain('Nội thất phòng khách')
  expect(screen.getByRole('button', { name: 'Lọc loại bán' }).textContent).toContain('Liên hệ báo giá')
})

function ProductListFlow() {
  const [filters, setFilters] = useState<AdminProductListFilters>({
    search: '',
    category: 'ALL',
    status: 'ALL',
    saleType: 'ALL',
  })
  const [isEditing, setIsEditing] = useState(false)

  if (isEditing) {
    return <button type="button" onClick={() => setIsEditing(false)}>Quay lại danh sách</button>
  }

  return (
    <AdminProductsListView
      products={[product]}
      filters={filters}
      isLoading={false}
      errorMessage={null}
      onRetry={() => {}}
      onFiltersChange={setFilters}
      onCreate={() => {}}
      onEdit={() => setIsEditing(true)}
      onDelete={async () => {}}
      onStatusChange={async () => {}}
      canChangeStatus
    />
  )
}
