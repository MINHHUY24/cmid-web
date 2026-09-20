import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { AdminProductsListView } from '../src/pages/admin/AdminCommerceViews'
import type { Product } from '../src/types/product'

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

afterEach(cleanup)

it('hides the toolbar count and asks for confirmation before deleting a product', async () => {
  const onDelete = vi.fn().mockResolvedValue(undefined)
  render(
    <AdminProductsListView
      products={[product]}
      isLoading={false}
      errorMessage={null}
      onRetry={() => {}}
      onCreate={() => {}}
      onEdit={() => {}}
      onDelete={onDelete}
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
