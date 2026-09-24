import type { AuthenticatedUser } from '../../contexts/NguoiDungContext'
import type { AuthenticatedRole } from '../../services/auth.service'
import { hasPermission } from './admin-permissions'

export type AdminRole = AuthenticatedRole

export interface AdminSession {
  email: string
  name: string
  role: AdminRole
  permissions: string[]
}

export function isAdminUser(
  user: AuthenticatedUser | null,
): user is AuthenticatedUser & { role: AdminRole } {
  return Boolean(user && user.role !== 'CUSTOMER' && hasPermission(user.permissions, 'admin.access'))
}

export function toAdminSession(
  user: AuthenticatedUser & { role: AdminRole },
): AdminSession {
  return {
    email: user.email,
    name: user.name,
    role: user.role,
    permissions: user.permissions,
  }
}
