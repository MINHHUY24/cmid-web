const apiUrl = import.meta.env.VITE_API_URL

export class ApiError extends Error {
  public readonly status?: number

  constructor(message: string, status?: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

function getApiUrl(path: string): string {
  if (!apiUrl) {
    throw new ApiError('Thiếu biến môi trường VITE_API_URL.')
  }

  const baseUrl = apiUrl.replace(/\/$/, '')
  const normalizedPath = path.startsWith('/') ? path : `/${path}`

  return `${baseUrl}${normalizedPath}`
}

function getErrorMessage(payload: unknown, status: number): string {
  if (typeof payload === 'object' && payload !== null && 'message' in payload) {
    const { message } = payload

    if (typeof message === 'string') {
      return message
    }

    if (Array.isArray(message) && message.every((item) => typeof item === 'string')) {
      return message.join(', ')
    }
  }

  return `Yêu cầu API thất bại (${status}).`
}

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  let response: Response

  try {
    response = await fetch(getApiUrl(path), {
      ...options,
      headers: {
        Accept: 'application/json',
        ...options?.headers,
      },
    })
  } catch {
    throw new ApiError('Không thể kết nối đến máy chủ API.')
  }

  if (!response.ok) {
    let payload: unknown = null

    try {
      payload = await response.json()
    } catch {
      // A non-JSON error response still receives a useful status-based message.
    }

    throw new ApiError(getErrorMessage(payload, response.status), response.status)
  }

  return (await response.json()) as T
}
