import type { AuthenticatedUser } from '../../contexts/NguoiDungContext'
import type { AuthenticatedRole } from '../../services/auth.service'

export type AdminRole = Exclude<AuthenticatedRole, 'CUSTOMER'>

export interface AdminSession {
  email: string
  name: string
  role: AdminRole
}

const ADMIN_ROLES: AdminRole[] = ['SALES', 'CONTENT_ADMIN', 'SUPER_ADMIN']

export function isAdminUser(
  user: AuthenticatedUser | null,
): user is AuthenticatedUser & { role: AdminRole } {
  return Boolean(user && ADMIN_ROLES.includes(user.role as AdminRole))
}

export function toAdminSession(
  user: AuthenticatedUser & { role: AdminRole },
): AdminSession {
  return {
    email: user.email,
    name: user.name,
    role: user.role,
  }
}
