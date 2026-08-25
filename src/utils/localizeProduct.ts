import type { AppLanguage } from '../content/site-content'
import type { Product, ProductBrand, ProductCategory } from '../types/product'

interface LocalizedName {
  name: string
  nameEn?: string | null
}

function localizeName(value: LocalizedName | null | undefined, language: AppLanguage): string | undefined {
  if (!value) return undefined
  return language === 'en' ? value.nameEn || value.name : value.name
}

export function getProductName(product: Product, language: AppLanguage): string {
  return localizeName(product, language) ?? product.name
}

export function getProductDescription(product: Product, language: AppLanguage): string | null {
  if (language === 'en') return product.descriptionEn || product.description
  return product.description
}

export function getCategoryName(category: ProductCategory | null, language: AppLanguage): string | undefined {
  return localizeName(category, language)
}

export function getBrandName(brand: ProductBrand | null, language: AppLanguage): string | undefined {
  return localizeName(brand, language)
}
