import { apiFetch } from './api'

export type AuthenticatedRole = string

export interface ServerAuthenticatedUser {
  id: string
  name: string
  email: string
  picture?: string
  role: AuthenticatedRole
  permissions: string[]
  emailVerified: boolean
}

export interface AuthSessionResponse {
  accessToken: string
  accessTokenExpiresIn: number
  user: ServerAuthenticatedUser
}

let pendingCustomerRefresh: Promise<AuthSessionResponse> | null = null
let pendingAdminRefresh: Promise<AuthSessionResponse> | null = null

export function loginWithGoogleCredential(credential: string) {
  return apiFetch<AuthSessionResponse>('/auth/google', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ credential }),
    skipAuth: true,
  })
}

export function loginAdminWithPassword(username: string, password: string) {
  return apiFetch<AuthSessionResponse>('/auth/admin/login', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }), skipAuth: true,
  })
}

export function refreshCustomerAuthSession() {
  if (!pendingCustomerRefresh) {
    pendingCustomerRefresh = apiFetch<AuthSessionResponse>('/auth/refresh', {
      method: 'POST',
      skipAuth: true,
    }).finally(() => {
      pendingCustomerRefresh = null
    })
  }

  return pendingCustomerRefresh
}

export function refreshAdminAuthSession() {
  if (!pendingAdminRefresh) {
    pendingAdminRefresh = apiFetch<AuthSessionResponse>('/auth/admin/refresh', {
      method: 'POST',
      skipAuth: true,
    }).finally(() => {
      pendingAdminRefresh = null
    })
  }

  return pendingAdminRefresh
}

export function getCurrentAuthenticatedUser() {
  return apiFetch<{ user: ServerAuthenticatedUser }>('/auth/me')
}

export function getCurrentAdmin() {
  return apiFetch<{ user: ServerAuthenticatedUser }>('/auth/admin/me', { authScope: 'admin' })
}

export function logoutCustomerAuthSession() {
  return apiFetch<void>('/auth/logout', {
    method: 'POST',
    skipAuth: true,
  })
}

export function logoutAdminAuthSession() {
  return apiFetch<void>('/auth/admin/logout', {
    method: 'POST',
    skipAuth: true,
  })
}
