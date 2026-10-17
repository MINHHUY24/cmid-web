/*
 * Vai trò: Xác nhận xóa sản phẩm và skeleton trong lúc request xóa chờ.
 */
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { AdminProductsListView, type AdminProductListFilters } from '../src/views/pages/admin/GiaoDienThuongMaiQuanTri'
import type { Product } from '../src/models/product'

const product: Product = {
  id: 5,
  sku: 'SOFA-ITALIA-3S',
  name: 'Sofa da cao cấp Italia',
  slug: 'sofa-da-cao-cap-italia',
  description: null,
  price: '28900000',
  unit: 'bộ',
  saleType: 'REQUEST_QUOTE',
  status: 'ACTIVE',
  category: {
    id: 5,
    name: 'Nội thất phòng khách',
    slug: 'noi-that-phong-khach',
  },
  brand: null,
  images: [],
  models3D: [],
}

const filters: AdminProductListFilters = {
  search: '',
  category: 'ALL',
  status: 'ALL',
  saleType: 'ALL',
}

afterEach(cleanup)

it('hides the toolbar count and asks for confirmation before deleting a product', async () => {
  const onDelete = vi.fn().mockResolvedValue(undefined)
  render(
    <AdminProductsListView
      products={[product]}
      filters={filters}
      isLoading={false}
      errorMessage={null}
      onRetry={() => {}}
      onFiltersChange={() => {}}
      onCreate={() => {}}
      onEdit={() => {}}
      onDelete={onDelete}
      onStatusChange={async () => {}}
      canChangeStatus
    />,
  )

  expect(screen.queryByText('1 sản phẩm')).toBeNull()
  fireEvent.click(screen.getByRole('button', { name: `Xóa ${product.name}` }))

  expect(screen.getByRole('alertdialog')).toBeTruthy()
  expect(screen.getByText(/Thao tác này không thể hoàn tác/)).toBeTruthy()
  expect(onDelete).not.toHaveBeenCalled()

  fireEvent.click(screen.getByRole('button', { name: 'Xóa sản phẩm' }))
  await waitFor(() => expect(onDelete).toHaveBeenCalledWith(product))
  await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull())
})

it('keeps a skeleton in the product row while the deletion request is pending', async () => {
  let finishDelete: (() => void) | undefined
  const onDelete = vi.fn().mockImplementation(() => new Promise<void>((resolve) => {
    finishDelete = resolve
  }))
  const { container } = render(
    <AdminProductsListView
      products={[product]}
      filters={filters}
      isLoading={false}
      errorMessage={null}
      onRetry={() => {}}
      onFiltersChange={() => {}}
      onCreate={() => {}}
      onEdit={() => {}}
      onDelete={onDelete}
      onStatusChange={async () => {}}
      canChangeStatus
    />,
  )

  fireEvent.click(screen.getByRole('button', { name: `Xóa ${product.name}` }))
  fireEvent.click(screen.getByRole('button', { name: 'Xóa sản phẩm' }))

  await waitFor(() => expect(onDelete).toHaveBeenCalledWith(product))
  expect(container.querySelector('.admin-product-row--deleting')).toBeTruthy()
  expect(screen.queryByRole('alertdialog')).toBeNull()

  finishDelete?.()
  await waitFor(() => expect(container.querySelector('.admin-product-row--deleting')).toBeNull())
})
