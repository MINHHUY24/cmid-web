import { apiFetch } from './api'
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
    categoryId: product.category?.id ?? null,
    brandId: product.brand?.id ?? null,
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
