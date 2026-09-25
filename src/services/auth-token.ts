export type AuthTokenScope = 'customer' | 'admin'

const accessTokens: Record<AuthTokenScope, string | null> = {
  customer: null,
  admin: null,
}

export function getAccessToken(scope: AuthTokenScope = 'customer') {
  return accessTokens[scope]
}

export function setAccessToken(nextAccessToken: string, scope: AuthTokenScope = 'customer') {
  accessTokens[scope] = nextAccessToken
}

export function clearAccessToken(scope: AuthTokenScope = 'customer') {
  accessTokens[scope] = null
}
