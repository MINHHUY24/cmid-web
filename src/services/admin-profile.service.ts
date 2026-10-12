import { apiFetch } from './api'

export interface AdminOwnProfile {
  fullName: string
  email: string
  avatarUrl: string
  phone: string
  workEmail: string
  employeeCode: string
  department: string
  directManager: string
  joinedAt: string
  workBranch: string
  bankName: string
  bankAccountNumber: string
  bankAccountHolder: string
  bankBranch: string
  roleName: string
  isActive: boolean
  lastLoginAt: string
  passwordConfigured: boolean
  permissions: string[]
}

export function getAdminOwnProfile() {
  return apiFetch<{ profile: AdminOwnProfile }>('/auth/admin/profile', {
    authScope: 'admin',
  })
}

export function updateAdminOwnProfile(input: {
  fullName?: string
  phone?: string
  workEmail?: string
  bankName?: string
  bankAccountNumber?: string
  bankAccountHolder?: string
  bankBranch?: string
}) {
  return apiFetch<{ profile: AdminOwnProfile }>('/auth/admin/profile', {
    method: 'PATCH',
    authScope: 'admin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
}

export function changeAdminOwnPassword(input: {
  currentPassword: string
  newPassword: string
}) {
  return apiFetch<{ ok: true }>('/auth/admin/profile/password', {
    method: 'PATCH',
    authScope: 'admin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
}
