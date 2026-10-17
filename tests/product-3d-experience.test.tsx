/*
 * Vai trò: Trải nghiệm 3D/AR, bottom sheet và responsive mobile.
 */
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { LanguageProvider } from '../src/controllers/state/NgonNguProvider'
import { TrangTraiNghiem3D } from '../src/views/pages/TrangTraiNghiem3D'
import type { Product } from '../src/models/product'

const useProductController = vi.fn()

vi.mock('../src/controllers/catalog/useProductController', () => ({
  useProductController: () => useProductController(),
}))
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
  vi.stubGlobal('requestAnimationFrame', vi.fn((callback: FrameRequestCallback) => {
    callback(performance.now())
    return 1
  }))
  vi.stubGlobal('cancelAnimationFrame', vi.fn())
  vi.stubGlobal('matchMedia', vi.fn().mockImplementation((query: string) => ({
    matches: query === '(max-width: 820px)',
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })))
  useProductController.mockReturnValue({ product, isLoading: false, errorMessage: null, retry: vi.fn() })
})
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

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
    expect(screen.getByRole('button', { name: 'Xem trong không gian' })).toBeTruthy()
  })

  it('keeps the mobile content, handle, and AR action in one bottom-sheet tree', async () => {
    page()
    await waitFor(() => expect(document.querySelector('model-viewer')).not.toBeNull())

    const sheet = document.querySelector<HTMLElement>('.product-3d-experience__story')
    const content = document.querySelector<HTMLElement>('#product-stage-story-content')
    const footer = sheet?.querySelector<HTMLElement>('.product-3d-experience__story-footer') ?? null
    expect(sheet).not.toBeNull()
    expect(content).not.toBeNull()
    expect(footer).not.toBeNull()

    const handle = within(sheet as HTMLElement).getByRole('button', { name: 'Thu gọn thông tin sản phẩm' })
    const arAction = within(footer as HTMLElement).getByRole('button', { name: 'Xem trong không gian' })
    expect(handle.getAttribute('aria-controls')).toBe('product-stage-story-content')
    expect(sheet?.contains(content)).toBe(true)
    expect(sheet?.contains(footer)).toBe(true)
    expect(footer?.contains(arAction)).toBe(true)
    expect(document.querySelector('.product-3d-experience__mobile-ar-dock')).toBeNull()
    expect(document.querySelectorAll('.product-3d-experience__story-ar')).toHaveLength(1)
    expect(within(footer as HTMLElement).getByText('Kéo để xoay · Cuộn để thu phóng')).toBeTruthy()
    expect(document.querySelector('.product-3d-experience__title')?.textContent).toContain('Sofa thử nghiệm')

    fireEvent.click(handle)
    expect(screen.getByRole('button', { name: 'Mở thông tin sản phẩm' }).getAttribute('aria-expanded')).toBe('false')
    expect(document.querySelector('#product-stage-story-content')).toBe(content)
    expect(footer?.contains(screen.getByRole('button', { name: 'Xem trong không gian' }))).toBe(true)
  })

  it('updates the unified sheet height continuously while its handle is dragged', async () => {
    page()
    await waitFor(() => expect(document.querySelector('model-viewer')).not.toBeNull())

    const stage = document.querySelector<HTMLElement>('.product-3d-experience__stage') as HTMLElement
    const sheet = document.querySelector<HTMLElement>('.product-3d-experience__story') as HTMLElement
    const content = sheet.querySelector<HTMLElement>('#product-stage-story-content') as HTMLElement
    const contentBody = sheet.querySelector<HTMLElement>('.product-3d-experience__story-content-body') as HTMLElement
    const footer = sheet.querySelector<HTMLElement>('.product-3d-experience__story-footer') as HTMLElement
    const handle = within(sheet).getByRole('button', { name: 'Thu gọn thông tin sản phẩm' })
    Object.defineProperty(stage, 'clientHeight', { configurable: true, value: 800 })
    content.style.paddingBottom = '14px'
    Object.defineProperty(contentBody, 'scrollHeight', { configurable: true, value: 420 })
    Object.defineProperty(footer, 'offsetHeight', { configurable: true, value: 60 })
    Object.defineProperty(handle, 'offsetHeight', { configurable: true, value: 30 })
    fireEvent.resize(window)

    fireEvent.pointerDown(handle, { clientY: 100, isPrimary: true, pointerId: 1 })
    fireEvent.pointerMove(handle, { clientY: 160, isPrimary: true, pointerId: 1 })

    await waitFor(() => expect(sheet.style.getPropertyValue('--product-stage-sheet-current-height')).toBe('466px'))
    expect(sheet.hasAttribute('data-sheet-dragging')).toBe(true)
    expect(sheet.querySelector('#product-stage-story-content')).not.toBeNull()
  })

  it('shows a clear empty state when a product has no 3D model', () => {
    useProductController.mockReturnValue({ product: { ...product, models3D: [] }, isLoading: false, errorMessage: null, retry: vi.fn() })
    page()
    expect(screen.getByText('Sản phẩm chưa có mô hình 3D')).toBeTruthy()
    expect(document.querySelector('model-viewer')).toBeNull()
  })

  it('explains when the current browser cannot start an AR session', async () => {
    page()
    await screen.findByRole('button', { name: 'Xem trong không gian' })
    fireEvent.click(screen.getByRole('button', { name: 'Xem trong không gian' }))
    expect(screen.getAllByText('Thiết bị này chưa sẵn sàng để mở AR.').length).toBeGreaterThan(0)
  })
})
