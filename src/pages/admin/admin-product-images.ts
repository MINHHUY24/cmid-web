import type { ProductImage } from '../../types/product'

export const PRODUCT_IMAGE_VIEWS = [
  { key: 'front', label: 'Mặt trước' },
  { key: 'left', label: 'Mặt trái' },
  { key: 'right', label: 'Mặt phải' },
  { key: 'back', label: 'Mặt sau' },
] as const

export interface ProductImageSlot {
  key: string
  imageUrl: string
  originalId?: number
}

export function createProductImageSlots(images: ProductImage[] = []): ProductImageSlot[] {
  const slots: ProductImageSlot[] = PRODUCT_IMAGE_VIEWS.map(({ key }) => ({ key, imageUrl: '' }))
  const sorted = [...images].sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary) || a.sortOrder - b.sortOrder)
  for (const image of sorted) {
    // New saves use explicit view labels so removing a side never shifts the others.
    const target = image.view
      ? slots.find((slot) => slot.key === image.view)
      : slots.find((slot) => !slot.imageUrl)
    if (target && !target.imageUrl) {
      target.imageUrl = image.imageUrl
      target.originalId = image.id
    } else {
      slots.push({ key: `extra-${image.id}`, imageUrl: image.imageUrl, originalId: image.id })
    }
  }
  return slots
}

export function toProductImages(slots: ProductImageSlot[], productId: number, name: string): ProductImage[] {
  return slots.flatMap((slot, index) => {
    if (!slot.imageUrl) return []
    const view = PRODUCT_IMAGE_VIEWS[index]
    return [{
      id: slot.originalId ?? productId + 100 + index,
      productId,
      imageUrl: slot.imageUrl,
      altText: `${name.trim()} – ${view?.label ?? `Ảnh bổ sung ${index - 3}`}`,
      isPrimary: index === 0,
      sortOrder: index,
      view: view?.key ?? 'extra',
    }]
  })
}
