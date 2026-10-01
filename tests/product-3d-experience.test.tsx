import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { LanguageProvider } from '../src/contexts/NgonNguProvider'
import { TrangTraiNghiem3D } from '../src/pages/TrangTraiNghiem3D'
import type { Product } from '../src/types/product'

const useProduct = vi.fn()

vi.mock('../src/hooks/useProduct', () => ({ useProduct: () => useProduct() }))
vi.mock('@google/model-viewer', () => ({}))

const product: Product = {
  id: 8, name: 'Sofa thử nghiệm', sku: 'SOFA-TEST', slug: 'sofa-thu-nghiem',
  description: null, price: '100000', unit: 'bộ', saleType: 'DIRECT_ORDER', status: 'ACTIVE',
  category: null, brand: null, images: [],
  models3D: [{
    id: 81, productId: 8, modelUrl: '/models/sofa.glb', posterUrl: '/sofa.png',
    format: 'GLB', version: null, lodLevel: null, mobileReady: true, isActive: true,
  }],
}

function page() {
  return render(
    <LanguageProvider>
      <MemoryRouter initialEntries={['/products/8/3d']}>
        <Routes><Route path="/products/:id/3d" element={<TrangTraiNghiem3D />} /></Routes>
      </MemoryRouter>
    </LanguageProvider>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  useProduct.mockReturnValue({ product, isLoading: false, errorMessage: null, retry: vi.fn() })
})
afterEach(cleanup)

describe('dedicated 3D experience', () => {
  it('renders a standalone AR-capable model viewer and return path', async () => {
    page()
    await waitFor(() => expect(document.querySelector('model-viewer')).not.toBeNull())
    const viewer = document.querySelector('model-viewer') as HTMLElement
    expect(viewer.getAttribute('src')).toBe('/models/sofa.glb')
    expect(viewer.hasAttribute('ar')).toBe(true)
    expect(viewer.getAttribute('ar-modes')).toBe('webxr scene-viewer quick-look')
    expect(viewer.getAttribute('ar-scale')).toBe('auto')
    expect(viewer.getAttribute('min-camera-orbit')).toBe('auto auto 25%')
    expect(viewer.getAttribute('max-camera-orbit')).toBe('auto auto 500%')
    expect(viewer.getAttribute('min-field-of-view')).toBe('5deg')
    expect(viewer.getAttribute('max-field-of-view')).toBe('90deg')
    expect(screen.getByRole('link', { name: 'Quay lại Sofa thử nghiệm' }).getAttribute('href')).toBe('/products/8')
    expect(screen.getByRole('button', { name: 'Đặt thử bằng AR' })).toBeTruthy()
  })

  it('shows a clear empty state when a product has no 3D model', () => {
    useProduct.mockReturnValue({ product: { ...product, models3D: [] }, isLoading: false, errorMessage: null, retry: vi.fn() })
    page()
    expect(screen.getByText('Sản phẩm chưa có mô hình 3D')).toBeTruthy()
    expect(document.querySelector('model-viewer')).toBeNull()
  })

  it('explains when the current browser cannot start an AR session', async () => {
    page()
    await screen.findByRole('button', { name: 'Đặt thử bằng AR' })
    fireEvent.click(screen.getByRole('button', { name: 'Đặt thử bằng AR' }))
    expect(screen.getByText('Thiết bị này chưa sẵn sàng để mở AR.')).toBeTruthy()
  })
})
