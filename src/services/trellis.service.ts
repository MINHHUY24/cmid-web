export interface TrellisJob {
  id: string
  state: 'loading' | 'generating' | 'completed' | 'failed' | 'cancelled'
  message: string
  previewUrl: string | null
  savedUrl: string | null
  vertices?: number
  triangles?: number
}

export interface SavedTrellisModel {
  modelUrl: string
  fileName: string
  fileSize: number
}

export class TrellisApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

const remoteTrellisUrl = import.meta.env.VITE_TRELLIS_API_URL?.trim().replace(/\/$/, '')

function trellisUrl(path: string) {
  return remoteTrellisUrl ? `${remoteTrellisUrl}${path}` : `/trellis-api${path}`
}

function assetUrl(value: string | null) {
  if (!value || !remoteTrellisUrl || /^https?:\/\//.test(value)) return value
  return `${remoteTrellisUrl}${value.startsWith('/') ? '' : '/'}${value}`
}

function previewUrl(value: string | null) {
  if (!value || /^https?:\/\//.test(value)) return value
  // Older bridges include Vite's proxy prefix in the API response.
  const path = `/${value.replace(/^\/+/, '')}`.replace(/^\/trellis-api(?=\/)/, '')
  return trellisUrl(path)
}

function jobWithAssetUrls(job: TrellisJob): TrellisJob {
  return {
    ...job,
    previewUrl: previewUrl(job.previewUrl),
    savedUrl: assetUrl(job.savedUrl),
  }
}

async function trellisFetch<T>(path: string, options?: RequestInit): Promise<T> {
  let response: Response
  try {
    response = await fetch(trellisUrl(path), {
      ...options,
      signal: options?.signal ?? AbortSignal.timeout(30_000),
    })
  } catch (error) {
    if (options?.signal?.aborted) throw error
    throw new Error('Chưa kết nối được TRELLIS. Hãy kiểm tra dịch vụ và thử lại.', { cause: error })
  }
  if (!response.ok) {
    const payload = await response.json().catch(() => null) as { detail?: unknown } | null
    throw new TrellisApiError(typeof payload?.detail === 'string' ? payload.detail : 'TRELLIS chưa xử lý được yêu cầu. Vui lòng thử lại.', response.status)
  }
  return response.json() as Promise<T>
}

export function getTrellisHealth() {
  return trellisFetch<{ service: string; ready: boolean }>('/health')
}

export async function createTrellisJob(images: string[], steps: number, signal: AbortSignal) {
  const formData = new FormData()
  const views = ['front', 'left', 'right', 'back']
  await Promise.all(images.slice(0, 4).map(async (url, index) => {
    if (!url) return
    const response = await fetch(url, { signal })
    if (!response.ok) throw new Error(`Không đọc được ảnh ${index + 1}. Hãy tải lại ảnh này.`)
    const blob = await response.blob()
    if (!blob.type.startsWith('image/')) throw new Error(`Ảnh ${index + 1} không hợp lệ.`)
    formData.set(views[index], blob, `${views[index]}.png`)
  }))
  formData.set('steps', String(steps))
  return jobWithAssetUrls(await trellisFetch<TrellisJob>('/jobs', { method: 'POST', body: formData, signal }))
}

export function getTrellisJob(id: string, signal?: AbortSignal) {
  return trellisFetch<TrellisJob>(`/jobs/${encodeURIComponent(id)}`, { signal }).then(jobWithAssetUrls)
}

export function cancelTrellisJob(id: string) {
  return trellisFetch<TrellisJob>(`/jobs/${encodeURIComponent(id)}`, { method: 'DELETE' }).then(jobWithAssetUrls)
}

export async function saveTrellisModel(id: string) {
  const saved = await trellisFetch<SavedTrellisModel>(`/jobs/${encodeURIComponent(id)}/save`, { method: 'POST' })
  return { ...saved, modelUrl: assetUrl(saved.modelUrl) ?? saved.modelUrl }
}
