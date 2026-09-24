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

let pendingRefresh: Promise<AuthSessionResponse> | null = null

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

export function refreshAuthSession() {
  if (!pendingRefresh) {
    pendingRefresh = apiFetch<AuthSessionResponse>('/auth/refresh', {
      method: 'POST',
      skipAuth: true,
    }).finally(() => {
      pendingRefresh = null
    })
  }

  return pendingRefresh
}

export function getCurrentAuthenticatedUser() {
  return apiFetch<{ user: ServerAuthenticatedUser }>('/auth/me')
}

export function getCurrentAdmin() {
  return apiFetch<{ user: ServerAuthenticatedUser }>('/auth/admin/me')
}

export function logoutAuthSession() {
  return apiFetch<void>('/auth/logout', {
    method: 'POST',
    skipAuth: true,
  })
}
