export type SaleType = 'DIRECT_ORDER' | 'REQUEST_QUOTE'

export type ProductStatus = 'ACTIVE' | 'INACTIVE' | 'DRAFT'

export interface ProductCategory {
  id: number
  name: string
  slug: string
}

export interface ProductBrand {
  id: number
  name: string
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
  slug: string
  description: string | null
  price: string | null
  unit: string | null
  saleType: SaleType
  status: ProductStatus
  category: ProductCategory | null
  brand: ProductBrand | null
  images: ProductImage[]
  models3D: ProductModel3D[]
}
