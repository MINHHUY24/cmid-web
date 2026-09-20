import { ApiError, apiFetch } from './api'
import type { Product } from '../types/product'

export function getProducts(): Promise<Product[]> {
  return apiFetch<Product[]>('/products')
}

export function getProductById(id: number): Promise<Product> {
  return apiFetch<Product>(`/products/${id}`)
}

export function saveProduct(product: Product, useDemoAccess = false): Promise<Product> {
  return apiFetch<Product>(useDemoAccess ? '/products/demo' : '/products', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(useDemoAccess ? { 'X-CMID-Demo-Admin': 'true' } : {}),
    },
    body: JSON.stringify(toProductPayload(product)),
  })
}

export async function deleteProduct(productId: number, useDemoAccess = false): Promise<void> {
  // Older browser-only products used Date.now() as their ID. They have no
  // matching PostgreSQL row and exceed the database's signed Int range.
  if (!isDatabaseProductId(productId)) return

  try {
    await apiFetch<void>(useDemoAccess ? `/products/demo/${productId}` : `/products/${productId}`, {
      method: 'DELETE',
      headers: useDemoAccess ? { 'X-CMID-Demo-Admin': 'true' } : undefined,
    })
  } catch (error) {
    // DELETE is idempotent: a stale browser cache should still be removable
    // when its server-side record has already disappeared.
    if (error instanceof ApiError && error.status === 404) return
    throw error
  }
}

function isDatabaseProductId(productId: number) {
  return Number.isInteger(productId) && productId > 0 && productId <= 2_147_483_647
}

function toProductPayload(product: Product) {
  return {
    ...(product.id > 0 && product.id <= 2_147_483_647 ? { id: product.id } : {}),
    sku: product.sku,
    name: product.name,
    nameEn: product.nameEn ?? null,
    slug: product.slug,
    description: product.description,
    descriptionEn: product.descriptionEn ?? null,
    descriptionHighlights: product.descriptionHighlights ?? [],
    technicalSpecifications: product.technicalSpecifications ?? [],
    usageGuide: product.usageGuide ?? null,
    usageGuidePoints: product.usageGuidePoints ?? [],
    salesPolicy: product.salesPolicy ?? null,
    salesPolicyPoints: product.salesPolicyPoints ?? [],
    price: product.price,
    unit: product.unit,
    saleType: product.saleType,
    status: product.status,
    stock: product.stock ?? null,
    isFeatured: product.isFeatured ?? false,
    materialIds: product.materialIds ?? [],
    supplierId: product.supplierId ?? null,
    // The admin catalogue uses stable slugs while PostgreSQL owns the numeric
    // relation IDs. Sending a locally generated numeric ID (for example
    // `cat-8` -> `8`) can point at a different record or no record at all.
    categorySlug: product.category?.slug ?? null,
    brandSlug: product.brand?.slug ?? null,
    images: product.images.map((image) => ({
      imageUrl: image.imageUrl,
      altText: image.altText,
      isPrimary: image.isPrimary,
      sortOrder: image.sortOrder,
      view: image.view,
    })),
    models3D: product.models3D.map((model) => ({
      modelUrl: model.modelUrl,
      posterUrl: model.posterUrl,
      format: model.format,
      version: model.version,
      lodLevel: model.lodLevel,
      mobileReady: model.mobileReady,
      isActive: model.isActive,
    })),
  }
}
