import {
  ArrowsCounterClockwise,
  Cube,
  MagnifyingGlass,
  SlidersHorizontal,
  X,
} from '@phosphor-icons/react'
import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useLanguage } from '../../contexts/NgonNguContext'

export interface ProductFilterOption {
  id: string
  label: string
  count: number
  slug?: string
}

interface ProductCatalogFiltersProps {
  isMobileOpen: boolean
  onMobileClose: () => void
  categories: ProductFilterOption[]
  brands: ProductFilterOption[]
  statuses: ProductFilterOption[]
  selectedCategories: string[]
  selectedBrands: string[]
  selectedSaleTypes: string[]
  selectedStatuses: string[]
  brandSearch: string
  only3D: boolean
  minPrice: number
  maxPrice: number
  priceFrom: number
  priceTo: number
  onToggleCategory: (id: string) => void
  onToggleBrand: (id: string) => void
  onToggleSaleType: (id: string) => void
  onToggleStatus: (id: string) => void
  onBrandSearchChange: (value: string) => void
  onOnly3DChange: (value: boolean) => void
  onPriceFromChange: (value: number) => void
  onPriceToChange: (value: number) => void
  onReset: () => void
}

interface FilterCheckItemProps {
  id: string
  label: string
  count?: number
  checked: boolean
  onChange: () => void
}

function FilterCheckItem({ id, label, count, checked, onChange }: FilterCheckItemProps) {
  return (
    <label className="catalog-filter__check" htmlFor={id}>
      <input id={id} type="checkbox" checked={checked} onChange={onChange} />
      <span className="catalog-filter__box" aria-hidden="true" />
      <span>{label}</span>
      {typeof count === 'number' ? <small>({count})</small> : null}
    </label>
  )
}

export function ProductCatalogFilters({
  isMobileOpen,
  onMobileClose,
  categories,
  brands,
  statuses,
  selectedCategories,
  selectedBrands,
  selectedSaleTypes,
  selectedStatuses,
  brandSearch,
  only3D,
  minPrice,
  maxPrice,
  priceFrom,
  priceTo,
  onToggleCategory,
  onToggleBrand,
  onToggleSaleType,
  onToggleStatus,
  onBrandSearchChange,
  onOnly3DChange,
  onPriceFromChange,
  onPriceToChange,
  onReset,
}: ProductCatalogFiltersProps) {
  const { content } = useLanguage()
  const { filter } = content.product
  const hasActiveFilters =
    selectedCategories.length > 0 ||
    selectedBrands.length > 0 ||
    selectedSaleTypes.length > 0 ||
    selectedStatuses.length > 0 ||
    only3D ||
    priceFrom !== minPrice ||
    priceTo !== maxPrice

  useEffect(() => {
    if (!isMobileOpen) return undefined

    const mobileQuery = window.matchMedia('(max-width: 1024px)')
    if (!mobileQuery.matches) {
      onMobileClose()
      return undefined
    }

    const previousOverflow = document.body.style.overflow
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onMobileClose()
    }
    const closeAfterResize = (event: MediaQueryListEvent) => {
      if (!event.matches) onMobileClose()
    }

    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', closeOnEscape)
    mobileQuery.addEventListener('change', closeAfterResize)

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', closeOnEscape)
      mobileQuery.removeEventListener('change', closeAfterResize)
    }
  }, [isMobileOpen, onMobileClose])

  const filterPanel = (
    <>
      <button
        className={`catalog-filters__backdrop${isMobileOpen ? ' catalog-filters__backdrop--open' : ''}`}
        type="button"
        tabIndex={isMobileOpen ? 0 : -1}
        aria-label={filter.close}
        onClick={onMobileClose}
      />
      <aside
        id="catalog-product-filters"
        className={`catalog-filters${isMobileOpen ? ' catalog-filters--open' : ''}`}
        aria-label={filter.title}
        role={isMobileOpen ? 'dialog' : undefined}
        aria-modal={isMobileOpen ? true : undefined}
      >
        <div className="catalog-filters__mobile-heading">
          <span className="catalog-filters__mobile-title">
            <SlidersHorizontal size={18} aria-hidden="true" />
            <span>{filter.title}</span>
          </span>
          <button
            className="catalog-filters__mobile-close"
            type="button"
            autoFocus={isMobileOpen}
            aria-label={filter.close}
            onClick={onMobileClose}
          >
            <X size={20} weight="bold" aria-hidden="true" />
          </button>
        </div>

        <div className="catalog-filters__body">
          <section className="catalog-filter">
            <h2>{filter.category}</h2>
            <div className="catalog-filter__list">
              {categories.map((category) => (
                <FilterCheckItem
                  key={category.id}
                  id={`category-${category.id}`}
                  label={category.label}
                  count={category.count}
                  checked={selectedCategories.includes(category.id)}
                  onChange={() => onToggleCategory(category.id)}
                />
              ))}
            </div>
          </section>

          <section className="catalog-filter">
            <h2>{filter.brand}</h2>
            <label className="catalog-filter__search">
              <MagnifyingGlass size={15} aria-hidden="true" />
              <input
                type="search"
                value={brandSearch}
                placeholder={filter.searchBrand}
                aria-label={filter.searchBrand}
                onChange={(event) => onBrandSearchChange(event.target.value)}
              />
            </label>
            <div className="catalog-filter__list">
              {brands.map((brand) => (
                <FilterCheckItem
                  key={brand.id}
                  id={`brand-${brand.id}`}
                  label={brand.label}
                  count={brand.count}
                  checked={selectedBrands.includes(brand.id)}
                  onChange={() => onToggleBrand(brand.id)}
                />
              ))}
            </div>
          </section>

          <section className="catalog-filter">
            <h2>{filter.price}</h2>
            <div className="catalog-filter__range" aria-hidden="true">
              <span
                style={{
                  left: `${((priceFrom - minPrice) / Math.max(maxPrice - minPrice, 1)) * 100}%`,
                  right: `${100 - ((priceTo - minPrice) / Math.max(maxPrice - minPrice, 1)) * 100}%`,
                }}
              />
            </div>
            <div className="catalog-filter__range-inputs">
              <input
                type="number"
                value={priceFrom}
                min={minPrice}
                max={priceTo}
                aria-label={filter.lowestPrice}
                onChange={(event) => onPriceFromChange(Number(event.target.value))}
              />
              <span>-</span>
              <input
                type="number"
                value={priceTo}
                min={priceFrom}
                max={maxPrice}
                aria-label={filter.highestPrice}
                onChange={(event) => onPriceToChange(Number(event.target.value))}
              />
            </div>
          </section>

          <section className="catalog-filter">
            <h2>{filter.saleType}</h2>
            <div className="catalog-filter__list">
              <FilterCheckItem
                id="sale-direct"
                label={content.product.directOrder}
                checked={selectedSaleTypes.includes('DIRECT_ORDER')}
                onChange={() => onToggleSaleType('DIRECT_ORDER')}
              />
              <FilterCheckItem
                id="sale-quote"
                label={content.product.quote}
                checked={selectedSaleTypes.includes('REQUEST_QUOTE')}
                onChange={() => onToggleSaleType('REQUEST_QUOTE')}
              />
            </div>
          </section>

          <section className="catalog-filter">
            <h2>
              3D
              <Cube size={16} weight="duotone" aria-hidden="true" />
            </h2>
            <FilterCheckItem
              id="has-3d-model"
              label={filter.hasModel3D}
              checked={only3D}
              onChange={() => onOnly3DChange(!only3D)}
            />
          </section>

          <section className="catalog-filter">
            <h2>{filter.status}</h2>
            <div className="catalog-filter__list">
              {statuses.map((status) => (
                <FilterCheckItem
                  key={status.id}
                  id={`status-${status.id}`}
                  label={status.label}
                  count={status.count}
                  checked={selectedStatuses.includes(status.id)}
                  onChange={() => onToggleStatus(status.id)}
                />
              ))}
            </div>
          </section>

          <button
            className="catalog-filters__reset"
            type="button"
            disabled={!hasActiveFilters}
            onClick={onReset}
          >
            <ArrowsCounterClockwise size={16} aria-hidden="true" />
            {filter.reset}
          </button>
        </div>

        <div className="catalog-filters__footer">
          <button
            className="catalog-filters__mobile-done"
            type="button"
            onClick={onMobileClose}
          >
            {filter.showResults}
          </button>
        </div>
      </aside>
    </>
  )

  const modalRoot = typeof document === 'undefined'
    ? null
    : document.getElementById('site-modal-root')

  return isMobileOpen && modalRoot
    ? createPortal(filterPanel, modalRoot)
    : filterPanel
}
