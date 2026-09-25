import { apiFetch } from './api'

export interface ManagedAdminUser {
  id: string
  name: string
  email: string
  username: string
  roleCode: string
  roleName: string
  isActive: boolean
  lastLoginAt: string | null
}

export interface ManagedRole {
  id: string
  code: string
  name: string
  description: string | null
  isSystem: boolean
  userCount: number
  permissions: string[]
}

export function getManagedUsers() {
  return apiFetch<{ users: ManagedAdminUser[] }>('/admin/access/users', { authScope: 'admin' })
}

export function createManagedUser(body: { fullName: string; username: string; password: string; roleCode: string; isActive: boolean }) {
  return apiFetch<{ user: ManagedAdminUser }>('/admin/access/users', { method: 'POST', authScope: 'admin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
}

export function updateManagedUser(id: string, body: { fullName?: string; roleCode?: string; isActive?: boolean }) {
  return apiFetch<{ user: ManagedAdminUser }>(`/admin/access/users/${id}`, { method: 'PATCH', authScope: 'admin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
}

export function deleteManagedUser(id: string) {
  return apiFetch<void>(`/admin/access/users/${id}`, { method: 'DELETE', authScope: 'admin' })
}

export function resetManagedUserPassword(id: string, password: string) {
  return apiFetch<{ ok: true }>(`/admin/access/users/${id}/reset-password`, { method: 'POST', authScope: 'admin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }) })
}

export function getManagedRoles() {
  return apiFetch<{ roles: ManagedRole[] }>('/admin/access/roles', { authScope: 'admin' })
}

export function createManagedRole(body: { code: string; name: string; description?: string; permissionCodes: string[] }) {
  return apiFetch<{ role: ManagedRole }>('/admin/access/roles', { method: 'POST', authScope: 'admin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
}

export function updateManagedRole(id: string, body: { name?: string; description?: string; permissionCodes?: string[] }) {
  return apiFetch<{ role: ManagedRole }>(`/admin/access/roles/${id}`, { method: 'PATCH', authScope: 'admin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
}

export function deleteManagedRole(id: string) {
  return apiFetch<void>(`/admin/access/roles/${id}`, { method: 'DELETE', authScope: 'admin' })
}
