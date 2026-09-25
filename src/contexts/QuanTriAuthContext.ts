import { createContext } from 'react'
import type { AuthenticatedUser } from './NguoiDungContext'

export interface AdminAuthContextValue {
  adminUser: AuthenticatedUser | null
  isAdminAuthLoading: boolean
  isAdminSigningIn: boolean
  signInAdminWithPassword: (username: string, password: string) => Promise<AuthenticatedUser>
  signOutAdmin: () => Promise<void>
}

export const AdminAuthContext = createContext<AdminAuthContextValue | null>(null)
