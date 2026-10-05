export type AuthTokenScope = 'customer' | 'admin'

type AccessTokenRefresher = () => Promise<string | null>

const accessTokens: Record<AuthTokenScope, string | null> = {
  customer: null,
  admin: null,
}

const accessTokenRefreshers: Partial<Record<AuthTokenScope, AccessTokenRefresher>> = {}

export function getAccessToken(scope: AuthTokenScope = 'customer') {
  return accessTokens[scope]
}

export function setAccessToken(nextAccessToken: string, scope: AuthTokenScope = 'customer') {
  accessTokens[scope] = nextAccessToken
}

export function clearAccessToken(scope: AuthTokenScope = 'customer') {
  accessTokens[scope] = null
}

/**
 * Lets the active auth provider exchange its HttpOnly refresh cookie after a
 * request discovers that the in-memory access token has expired. Keeping this
 * callback here avoids a circular dependency between api.ts and auth.service.
 */
export function registerAccessTokenRefresher(scope: AuthTokenScope, refresher: AccessTokenRefresher) {
  accessTokenRefreshers[scope] = refresher

  return () => {
    if (accessTokenRefreshers[scope] === refresher) {
      delete accessTokenRefreshers[scope]
    }
  }
}

export function refreshAccessToken(scope: AuthTokenScope) {
  return accessTokenRefreshers[scope]?.() ?? Promise.resolve(null)
}
