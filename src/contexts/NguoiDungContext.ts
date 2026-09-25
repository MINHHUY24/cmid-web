import { createContext, useContext } from 'react'
import type { AuthenticatedRole } from '../services/auth.service'

export interface AuthenticatedUser {
  id: string
  name: string
  email: string
  picture?: string
  role: AuthenticatedRole
  permissions: string[]
  emailVerified: boolean
}

export type CustomerGender = '' | 'male' | 'female' | 'other'

export interface CustomerProfile {
  fullName: string
  avatar: string
  phone: string
  birthDate: string
  gender: CustomerGender
  city: string
  district: string
  ward: string
  address: string
}

export interface UserContextValue {
  user: AuthenticatedUser | null
  profile: CustomerProfile
  isAuthLoading: boolean
  isSigningIn: boolean
  signInWithGoogle: () => Promise<AuthenticatedUser>
  updateProfile: (profile: CustomerProfile) => void
  signOut: () => Promise<void>
}

export const UserContext = createContext<UserContextValue | null>(null)

export function useUser(): UserContextValue {
  const context = useContext(UserContext)

  if (!context) {
    throw new Error('useUser must be used inside UserProvider')
  }

  return context
}
