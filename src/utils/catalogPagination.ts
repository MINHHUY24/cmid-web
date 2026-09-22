export const DESKTOP_CATALOG_MEDIA_QUERY = '(min-width: 1025px)'

export function getCatalogProductsPerPage(isDesktop: boolean) {
  return isDesktop ? 20 : 12
}

export type CatalogPaginationItem = number | 'ellipsis'

export function getCatalogPaginationItems(
  totalPages: number,
  currentPage: number,
): CatalogPaginationItem[] {
  if (totalPages <= 4) {
    return Array.from({ length: totalPages }, (_, index) => index + 1)
  }

  const safeCurrentPage = Math.min(Math.max(currentPage, 1), totalPages)
  const pageNumbers = [...new Set([
    safeCurrentPage,
    Math.min(safeCurrentPage + 1, totalPages),
    totalPages - 1,
    totalPages,
  ])].sort((firstPage, secondPage) => firstPage - secondPage)

  return pageNumbers.flatMap((page, index) => {
    const previousPage = pageNumbers[index - 1]
    return previousPage !== undefined && page - previousPage > 1
      ? ['ellipsis', page]
      : [page]
  })
}
