export const AUTH_TAB_HEADER_NAME = 'X-CMID-Auth-Tab'

const AUTH_TAB_STORAGE_KEY = 'cmid.auth.tab-id.v1'
let inMemoryTabId: string | null = null

function createTabId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`
}

/**
 * Each browser tab gets a stable ID for its lifetime. The ID only selects an
 * HttpOnly cookie on the server; it is not an authentication credential.
 */
export function getAuthTabId() {
  if (inMemoryTabId) return inMemoryTabId

  try {
    const savedTabId = window.sessionStorage.getItem(AUTH_TAB_STORAGE_KEY)
    if (savedTabId) {
      inMemoryTabId = savedTabId
      return savedTabId
    }

    const nextTabId = createTabId()
    window.sessionStorage.setItem(AUTH_TAB_STORAGE_KEY, nextTabId)
    inMemoryTabId = nextTabId
    return nextTabId
  } catch {
    inMemoryTabId = createTabId()
    return inMemoryTabId
  }
}

export function getAuthTabHeaders() {
  return { [AUTH_TAB_HEADER_NAME]: getAuthTabId() }
}
