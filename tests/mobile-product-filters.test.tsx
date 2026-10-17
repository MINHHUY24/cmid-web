/*
 * Vai trò: Filter catalogue ở giao diện mobile.
 */
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ProductCatalogFilters } from '../src/views/components/product/BoLocSanPham'
import { LanguageProvider } from '../src/controllers/state/NgonNguProvider'

const closeFilters = vi.fn()
const noop = vi.fn()

function renderFilters(isMobileOpen: boolean) {
  return render(
    <LanguageProvider>
      <ProductCatalogFilters
        isMobileOpen={isMobileOpen}
        onMobileClose={closeFilters}
        categories={[{ id: 'living-room', label: 'Nội thất phòng khách', count: 3 }]}
        brands={[{ id: 'cmid', label: 'CMID', count: 2 }]}
        statuses={[{ id: 'ACTIVE', label: 'Đang bán', count: 4 }]}
        selectedCategories={[]}
        selectedBrands={[]}
        selectedSaleTypes={[]}
        selectedStatuses={[]}
        brandSearch=""
        only3D={false}
        minPrice={0}
        maxPrice={10_000_000}
        priceFrom={0}
        priceTo={10_000_000}
        onToggleCategory={noop}
        onToggleBrand={noop}
        onToggleSaleType={noop}
        onToggleStatus={noop}
        onBrandSearchChange={noop}
        onOnly3DChange={noop}
        onPriceFromChange={noop}
        onPriceToChange={noop}
        onReset={noop}
      />
    </LanguageProvider>,
  )
}

beforeEach(() => {
  closeFilters.mockClear()
  noop.mockClear()
  window.localStorage.setItem('cmid-language', 'vi')
  window.sessionStorage.setItem('cmid-language-welcome-complete', 'true')

  document.body.innerHTML = '<div id="site-modal-root"></div>'
  vi.stubGlobal('matchMedia', vi.fn().mockImplementation(() => ({
    matches: true,
    media: '(max-width: 1024px)',
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })))
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  window.localStorage.clear()
  window.sessionStorage.clear()
  document.body.style.overflow = ''
})

describe('mobile product filters', () => {
  it('opens in the modal root, locks scrolling, and closes from its controls', () => {
    renderFilters(true)

    expect(window.matchMedia).toHaveBeenCalledWith('(max-width: 1024px)')
    const dialog = screen.getByRole('dialog', { name: 'Bộ lọc sản phẩm' })
    expect(dialog.parentElement?.id).toBe('site-modal-root')
    expect(dialog.querySelector('.catalog-filters__body')).toBeTruthy()
    expect(dialog.querySelector('.catalog-filters__footer')?.contains(
      within(dialog).getByRole('button', { name: 'Xem sản phẩm' }),
    )).toBe(true)
    expect(document.body.style.overflow).toBe('hidden')

    fireEvent.click(within(dialog).getByRole('button', { name: 'Đóng bộ lọc' }))
    expect(closeFilters).toHaveBeenCalledTimes(1)

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(closeFilters).toHaveBeenCalledTimes(2)

    fireEvent.click(within(dialog).getByRole('button', { name: 'Xem sản phẩm' }))
    expect(closeFilters).toHaveBeenCalledTimes(3)
  })
})
