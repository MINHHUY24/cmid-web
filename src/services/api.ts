import { getAccessToken, refreshAccessToken, type AuthTokenScope } from './auth-token'

const apiUrl = import.meta.env.VITE_API_URL

export class ApiError extends Error {
  public readonly status?: number

  constructor(message: string, status?: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

type ApiFetchOptions = RequestInit & {
  skipAuth?: boolean
  authScope?: AuthTokenScope
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
  if (status === 413) {
    return 'Dữ liệu gửi lên vượt giới hạn máy chủ. Hãy giảm dung lượng ảnh hoặc số ảnh rồi thử lại.'
  }

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

export async function apiFetch<T>(path: string, options?: ApiFetchOptions): Promise<T> {
  let response: Response

  const { skipAuth = false, authScope = 'customer', ...requestOptions } = options ?? {}
  const accessToken = skipAuth ? null : getAccessToken(authScope)
  const requestUrl = getApiUrl(path)

  const sendRequest = async (token: string | null) => {
    // Keep a plain object for fetch so existing callers/tests can inspect the
    // request headers, while still respecting explicitly supplied auth headers.
    const providedHeaders = toHeaderRecord(requestOptions.headers)
    const headerNames = new Set(Object.keys(providedHeaders).map((name) => name.toLocaleLowerCase('en-US')))
    const headers = {
      ...(headerNames.has('accept') ? {} : { Accept: 'application/json' }),
      ...(token && !headerNames.has('authorization') ? { Authorization: 'Bearer ' + token } : {}),
      ...providedHeaders,
    }

    return fetch(requestUrl, {
      ...requestOptions,
      credentials: requestOptions.credentials ?? 'include',
      headers,
    })
  }

  try {
    response = await sendRequest(accessToken)

    // Access tokens are intentionally memory-only and short-lived. Refresh
    // once through the HttpOnly cookie, then retry the original request with
    // the new token so a tab left open for over 15 minutes stays usable.
    if (response.status === 401 && !skipAuth && accessToken) {
      const refreshedAccessToken = await refreshAccessToken(authScope).catch(() => null)
      if (refreshedAccessToken) {
        response = await sendRequest(refreshedAccessToken)
      }
    }
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

  if (response.status === 204 || response.headers.get('content-length') === '0') {
    return undefined as T
  }

  const contentType = response.headers.get('content-type') ?? ''

  if (!contentType.includes('application/json')) {
    return undefined as T
  }

  return (await response.json()) as T
}

function toHeaderRecord(headers: HeadersInit | undefined): Record<string, string> {
  if (!headers) return {}
  if (Array.isArray(headers)) return Object.fromEntries(headers)
  if (headers instanceof Headers) return Object.fromEntries(headers.entries())
  return { ...headers }
}
