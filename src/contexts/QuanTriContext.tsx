import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { AuthenticatedUser } from './NguoiDungContext'
import { AdminAuthContext } from './QuanTriAuthContext'
import {
  loginAdminWithPassword,
  logoutAdminAuthSession,
  refreshAdminAuthSession,
  type ServerAuthenticatedUser,
} from '../services/auth.service'
import { clearAccessToken, registerAccessTokenRefresher, setAccessToken } from '../services/auth-token'

function toAuthenticatedUser(user: ServerAuthenticatedUser): AuthenticatedUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    picture: user.picture,
    role: user.role,
    roleName: user.roleName,
    permissions: user.permissions,
    emailVerified: user.emailVerified,
  }
}

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [adminUser, setAdminUser] = useState<AuthenticatedUser | null>(null)
  const [isAdminAuthLoading, setIsAdminAuthLoading] = useState(true)
  const [isAdminSigningIn, setIsAdminSigningIn] = useState(false)

  useEffect(() => {
    let isCurrent = true

    void refreshAdminAuthSession()
      .then((session) => {
        if (!isCurrent) return
        setAccessToken(session.accessToken, 'admin')
        setAdminUser(toAuthenticatedUser(session.user))
      })
      .catch(() => {
        if (!isCurrent) return
        clearAccessToken('admin')
        setAdminUser(null)
      })
      .finally(() => {
        if (isCurrent) setIsAdminAuthLoading(false)
      })

    return () => {
      isCurrent = false
      clearAccessToken('admin')
    }
  }, [])

  useEffect(
    () => registerAccessTokenRefresher('admin', async () => {
      try {
        const session = await refreshAdminAuthSession()
        setAccessToken(session.accessToken, 'admin')
        setAdminUser(toAuthenticatedUser(session.user))
        return session.accessToken
      } catch {
        clearAccessToken('admin')
        setAdminUser(null)
        return null
      }
    }),
    [],
  )

  const signInAdminWithPassword = useCallback(
    async (username: string, password: string) => {
      setIsAdminSigningIn(true)
      try {
        const session = await loginAdminWithPassword(username, password)
        const authenticatedUser = toAuthenticatedUser(session.user)
        setAccessToken(session.accessToken, 'admin')
        setAdminUser(authenticatedUser)
        return authenticatedUser
      } finally {
        setIsAdminSigningIn(false)
      }
    },
    [],
  )

  const signOutAdmin = useCallback(async () => {
    clearAccessToken('admin')
    setAdminUser(null)

    try {
      await logoutAdminAuthSession()
    } catch {
      // The admin UI must still lock even if the network is unavailable.
    }
  }, [])

  const value = useMemo(
    () => ({
      adminUser,
      isAdminAuthLoading,
      isAdminSigningIn,
      signInAdminWithPassword,
      signOutAdmin,
    }),
    [
      adminUser,
      isAdminAuthLoading,
      isAdminSigningIn,
      signInAdminWithPassword,
      signOutAdmin,
    ],
  )

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  )
}
