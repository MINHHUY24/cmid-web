import { describe, expect, it } from 'vitest'
import {
  getCatalogPaginationItems,
  getCatalogProductsPerPage,
} from '../src/utils/catalogPagination'

describe('catalog pagination', () => {
  it('shows 20 products on desktop and 12 below the desktop breakpoint', () => {
    expect(getCatalogProductsPerPage(true)).toBe(20)
    expect(getCatalogProductsPerPage(false)).toBe(12)
  })

  it('shortens page numbers while keeping the current page at the start', () => {
    expect(getCatalogPaginationItems(6, 1)).toEqual([1, 2, 'ellipsis', 5, 6])
    expect(getCatalogPaginationItems(6, 2)).toEqual([2, 3, 'ellipsis', 5, 6])
  })

  it('does not show an ellipsis when the remaining page range is continuous', () => {
    expect(getCatalogPaginationItems(6, 4)).toEqual([4, 5, 6])
    expect(getCatalogPaginationItems(4, 1)).toEqual([1, 2, 3, 4])
  })
})
