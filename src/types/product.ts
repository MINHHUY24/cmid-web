export type SaleType = 'DIRECT_ORDER' | 'REQUEST_QUOTE'

export type ProductStatus = 'ACTIVE' | 'INACTIVE' | 'DRAFT'

export interface ProductCategory {
  id: number
  name: string
  nameEn?: string | null
  slug: string
}

export interface ProductBrand {
  id: number
  name: string
  nameEn?: string | null
  slug: string
}

export interface ProductImage {
  id: number
  productId: number
  imageUrl: string
  altText: string | null
  isPrimary: boolean
  sortOrder: number
}

export interface ProductModel3D {
  id: number
  productId: number
  modelUrl: string
  posterUrl: string | null
  format: string | null
  version: string | null
  lodLevel: string | null
  mobileReady: boolean
  isActive: boolean
}

export interface Product {
  id: number
  sku: string
  name: string
  nameEn?: string | null
  slug: string
  description: string | null
  descriptionEn?: string | null
  price: string | null
  unit: string | null
  saleType: SaleType
  status: ProductStatus
  stock?: number | null
  isFeatured?: boolean
  materialIds?: string[]
  supplierId?: string | null
  category: ProductCategory | null
  brand: ProductBrand | null
  images: ProductImage[]
  models3D: ProductModel3D[]
}
