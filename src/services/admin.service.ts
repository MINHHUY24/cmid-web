import { apiFetch } from './api'

export type AdminDataMode = 'backend' | 'local'

interface AdminImageUploadResponse {
  url?: unknown
  imageUrl?: unknown
}

export function getAdminDataMode(): AdminDataMode {
  return import.meta.env.VITE_ADMIN_API_ENABLED === 'true' ? 'backend' : 'local'
}

export async function uploadAdminImage(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Tệp đã chọn không phải là hình ảnh hợp lệ.')
  }

  if (getAdminDataMode() === 'local') {
    return optimizeLocalImage(file)
  }

  const formData = new FormData()
  formData.append('file', file)

  const response = await apiFetch<unknown>('/admin/uploads/images', {
    method: 'POST',
    body: formData,
  })
  const imageUrl = getUploadedImageUrl(response)

  if (!imageUrl) {
    throw new Error('Máy chủ không trả về đường dẫn ảnh hợp lệ.')
  }

  return imageUrl
}

function getUploadedImageUrl(response: unknown): string | null {
  if (typeof response !== 'object' || response === null) return null

  const payload = response as AdminImageUploadResponse
  const candidate = [payload.imageUrl, payload.url].find(
    (value): value is string => typeof value === 'string' && Boolean(value.trim()),
  )

  return candidate?.trim() ?? null
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => {
      if (typeof reader.result === 'string' && reader.result.startsWith('data:image/')) {
        resolve(reader.result)
        return
      }

      reject(new Error('Không thể tạo bản xem trước cho hình ảnh.'))
    }
    reader.onerror = () => reject(new Error('Không thể đọc tệp hình ảnh đã chọn.'))
    reader.readAsDataURL(file)
  })
}

async function optimizeLocalImage(file: File): Promise<string> {
  const source = await readFileAsDataUrl(file)
  if (file.size <= 420_000 || typeof document === 'undefined') return source

  try {
    const image = await loadImage(source)
    const maximumSide = 1800
    const scale = Math.min(1, maximumSide / Math.max(image.naturalWidth, image.naturalHeight))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale))
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale))
    const context = canvas.getContext('2d')
    if (!context) return source

    context.drawImage(image, 0, 0, canvas.width, canvas.height)
    let optimized = canvas.toDataURL('image/webp', 0.82)
    if (optimized.length > 1_200_000) optimized = canvas.toDataURL('image/webp', 0.68)
    return optimized
  } catch {
    return source
  }
}

function loadImage(source: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Không thể tối ưu hình ảnh.'))
    image.src = source
  })
}
