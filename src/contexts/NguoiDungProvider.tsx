import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { AuthenticatedUser, CustomerProfile } from './NguoiDungContext'
import { UserContext } from './NguoiDungContext'
import {
  getCurrentAuthenticatedUser,
  loginWithGoogleCredential,
  logoutAuthSession,
  refreshAuthSession,
  type ServerAuthenticatedUser,
} from '../services/auth.service'
import {
  clearAccessToken,
  setAccessToken,
} from '../services/auth-token'

const LEGACY_USER_STORAGE_KEY = 'cmid-user'
const PROFILE_STORAGE_PREFIX = 'cmid-customer-profile:'
const GOOGLE_SCRIPT_URL = 'https://accounts.google.com/gsi/client'
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID

const EMPTY_CUSTOMER_PROFILE: CustomerProfile = {
  fullName: '',
  avatar: '',
  phone: '',
  birthDate: '',
  gender: '',
  city: '',
  district: '',
  ward: '',
  address: '',
}

interface GoogleCredentialResponse {
  credential?: string
}

interface GooglePromptMomentNotification {
  isNotDisplayed?: () => boolean
  isSkippedMoment?: () => boolean
}

interface GoogleIdentity {
  accounts: {
    id: {
      initialize: (config: {
        client_id: string
        callback: (response: GoogleCredentialResponse) => void
        auto_select?: boolean
        cancel_on_tap_outside?: boolean
      }) => void
      prompt: (listener?: (notification: GooglePromptMomentNotification) => void) => void
    }
  }
}

declare global {
  interface Window {
    google?: GoogleIdentity
  }
}

function getProfileStorageKey(userId: string) {
  return PROFILE_STORAGE_PREFIX + userId
}

function createEmptyProfile(): CustomerProfile {
  return { ...EMPTY_CUSTOMER_PROFILE }
}

function getSavedProfile(userId?: string): CustomerProfile {
  if (!userId) {
    return createEmptyProfile()
  }

  try {
    const savedProfile = window.localStorage.getItem(getProfileStorageKey(userId))
    if (!savedProfile) {
      return createEmptyProfile()
    }

    const profile = JSON.parse(savedProfile) as Partial<CustomerProfile>
    return {
      fullName: typeof profile.fullName === 'string' ? profile.fullName : '',
      avatar: typeof profile.avatar === 'string' ? profile.avatar : '',
      phone: typeof profile.phone === 'string' ? profile.phone : '',
      birthDate: typeof profile.birthDate === 'string' ? profile.birthDate : '',
      gender: profile.gender === 'male' || profile.gender === 'female' || profile.gender === 'other' ? profile.gender : '',
      city: typeof profile.city === 'string' ? profile.city : '',
      district: typeof profile.district === 'string' ? profile.district : '',
      ward: typeof profile.ward === 'string' ? profile.ward : '',
      address: typeof profile.address === 'string' ? profile.address : '',
    }
  } catch {
    window.localStorage.removeItem(getProfileStorageKey(userId))
    return createEmptyProfile()
  }
}

function normalizeProfile(profile: CustomerProfile): CustomerProfile {
  return {
    fullName: profile.fullName.trim(),
    avatar: profile.avatar,
    phone: profile.phone.trim(),
    birthDate: profile.birthDate,
    gender: profile.gender,
    city: profile.city.trim(),
    district: profile.district.trim(),
    ward: profile.ward.trim(),
    address: profile.address.trim(),
  }
}

function toAuthenticatedUser(user: ServerAuthenticatedUser): AuthenticatedUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    picture: user.picture,
    role: user.role,
    emailVerified: user.emailVerified,
  }
}

function loadGoogleIdentityScript(): Promise<void> {
  if (window.google?.accounts.id) {
    return Promise.resolve()
  }

  return new Promise((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>('script[data-google-identity]')

    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(), { once: true })
      existingScript.addEventListener('error', () => reject(new Error('Không thể tải Google Identity Services.')), { once: true })
      return
    }

    const script = document.createElement('script')
    script.src = GOOGLE_SCRIPT_URL
    script.async = true
    script.defer = true
    script.dataset.googleIdentity = 'true'
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Không thể tải Google Identity Services.'))
    document.head.append(script)
  })
}

async function requestGoogleCredential(): Promise<string> {
  if (!GOOGLE_CLIENT_ID) {
    throw new Error('Google đăng nhập chưa được cấu hình. Thêm VITE_GOOGLE_CLIENT_ID vào file .env.')
  }

  await loadGoogleIdentityScript()

  const googleIdentity = window.google?.accounts.id

  if (!googleIdentity) {
    throw new Error('Google Identity Services chưa sẵn sàng. Vui lòng thử lại.')
  }

  return new Promise((resolve, reject) => {
    let isSettled = false
    const timeout = window.setTimeout(() => {
      if (!isSettled) {
        isSettled = true
        reject(new Error('Đăng nhập Google đã hết thời gian chờ.'))
      }
    }, 60_000)

    const rejectOnce = (message: string) => {
      if (isSettled) return
      isSettled = true
      window.clearTimeout(timeout)
      reject(new Error(message))
    }

    const resolveOnce = (credential: string) => {
      if (isSettled) return
      isSettled = true
      window.clearTimeout(timeout)
      resolve(credential)
    }

    googleIdentity.initialize({
      client_id: GOOGLE_CLIENT_ID,
      auto_select: false,
      cancel_on_tap_outside: true,
      callback: (response) => {
        if (!response.credential) {
          rejectOnce('Google không trả về credential hợp lệ.')
          return
        }

        resolveOnce(response.credential)
      },
    })

    googleIdentity.prompt((notification) => {
      if (notification.isNotDisplayed?.() || notification.isSkippedMoment?.()) {
        rejectOnce('Không thể mở hộp thoại Google. Vui lòng kiểm tra cấu hình Google Login.')
      }
    })
  })
}

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthenticatedUser | null>(null)
  const [profile, setProfile] = useState<CustomerProfile>(createEmptyProfile)
  const [isAuthLoading, setIsAuthLoading] = useState(true)
  const [isSigningIn, setIsSigningIn] = useState(false)

  const applyAuthenticatedUser = useCallback((nextUser: AuthenticatedUser) => {
    setUser(nextUser)
    setProfile(getSavedProfile(nextUser.id))
  }, [])

  useEffect(() => {
    let isCurrent = true

    window.localStorage.removeItem(LEGACY_USER_STORAGE_KEY)

    void refreshAuthSession()
      .then(async (session) => {
        setAccessToken(session.accessToken)
        const response = await getCurrentAuthenticatedUser()

        if (isCurrent) {
          applyAuthenticatedUser(toAuthenticatedUser(response.user))
        }
      })
      .catch(() => {
        clearAccessToken()

        if (isCurrent) {
          setUser(null)
          setProfile(createEmptyProfile())
        }
      })
      .finally(() => {
        if (isCurrent) {
          setIsAuthLoading(false)
        }
      })

    return () => {
      isCurrent = false
    }
  }, [applyAuthenticatedUser])

  const signInWithGoogle = useCallback(async () => {
    setIsSigningIn(true)

    try {
      const credential = await requestGoogleCredential()
      const session = await loginWithGoogleCredential(credential)
      setAccessToken(session.accessToken)
      const authenticatedUser = toAuthenticatedUser(session.user)
      applyAuthenticatedUser(authenticatedUser)
      return authenticatedUser
    } finally {
      setIsSigningIn(false)
    }
  }, [applyAuthenticatedUser])

  const updateProfile = useCallback(
    (nextProfile: CustomerProfile) => {
      if (!user) {
        return
      }

      const normalizedProfile = normalizeProfile(nextProfile)
      window.localStorage.setItem(getProfileStorageKey(user.id), JSON.stringify(normalizedProfile))
      setProfile(normalizedProfile)
    },
    [user],
  )

  const signOut = useCallback(async () => {
    clearAccessToken()
    setUser(null)
    setProfile(createEmptyProfile())

    try {
      await logoutAuthSession()
    } catch {
      // The browser state is cleared even if the network is unavailable.
    }
  }, [])

  const value = useMemo(
    () => ({
      user,
      profile,
      isAuthLoading,
      isSigningIn,
      signInWithGoogle,
      updateProfile,
      signOut,
    }),
    [isAuthLoading, isSigningIn, profile, signInWithGoogle, signOut, updateProfile, user],
  )

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>
}
