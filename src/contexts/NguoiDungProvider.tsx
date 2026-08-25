import { useCallback, useMemo, useState, type ReactNode } from 'react'
import type { AuthenticatedUser, CustomerProfile } from './NguoiDungContext'
import { UserContext } from './NguoiDungContext'

const USER_STORAGE_KEY = 'cmid-user'
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

interface GoogleTokenResponse {
  access_token?: string
  error?: string
  error_description?: string
}

interface GoogleTokenClient {
  requestAccessToken: (options?: { prompt?: string }) => void
}

interface GoogleIdentity {
  accounts: {
    oauth2: {
      initTokenClient: (config: {
        client_id: string
        scope: string
        callback: (response: GoogleTokenResponse) => void
      }) => GoogleTokenClient
    }
  }
}

declare global {
  interface Window {
    google?: GoogleIdentity
  }
}

interface GoogleProfile {
  sub: string
  name: string
  email: string
  picture?: string
}

function getSavedUser(): AuthenticatedUser | null {
  try {
    const savedUser = window.localStorage.getItem(USER_STORAGE_KEY)
    return savedUser ? (JSON.parse(savedUser) as AuthenticatedUser) : null
  } catch {
    window.localStorage.removeItem(USER_STORAGE_KEY)
    return null
  }
}

function getProfileStorageKey(userId: string) {
  return `${PROFILE_STORAGE_PREFIX}${userId}`
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

function loadGoogleIdentityScript(): Promise<void> {
  if (window.google?.accounts.oauth2) {
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

async function requestGoogleProfile(): Promise<GoogleProfile> {
  if (!GOOGLE_CLIENT_ID) {
    throw new Error('Google đăng nhập chưa được cấu hình. Thêm VITE_GOOGLE_CLIENT_ID vào file .env.')
  }

  await loadGoogleIdentityScript()

  if (!window.google?.accounts.oauth2) {
    throw new Error('Google Identity Services chưa sẵn sàng. Vui lòng thử lại.')
  }

  const accessToken = await new Promise<string>((resolve, reject) => {
    const tokenClient = window.google?.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: 'openid email profile',
      callback: (response) => {
        if (response.error || !response.access_token) {
          reject(new Error(response.error_description ?? response.error ?? 'Không thể đăng nhập với Google.'))
          return
        }

        resolve(response.access_token)
      },
    })

    tokenClient?.requestAccessToken({ prompt: 'select_account' })
  })

  const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!response.ok) {
    throw new Error('Không thể lấy thông tin tài khoản Google. Vui lòng thử lại.')
  }

  return (await response.json()) as GoogleProfile
}

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthenticatedUser | null>(getSavedUser)
  const [profile, setProfile] = useState<CustomerProfile>(() => getSavedProfile(getSavedUser()?.id))
  const [isSigningIn, setIsSigningIn] = useState(false)

  const signInWithGoogle = useCallback(async () => {
    setIsSigningIn(true)

    try {
      const profile = await requestGoogleProfile()
      const authenticatedUser: AuthenticatedUser = {
        id: profile.sub,
        name: profile.name || profile.email,
        email: profile.email,
        picture: profile.picture,
      }

      window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(authenticatedUser))
      setUser(authenticatedUser)
      setProfile(getSavedProfile(authenticatedUser.id))
      return authenticatedUser
    } finally {
      setIsSigningIn(false)
    }
  }, [])

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

  const signOut = useCallback(() => {
    window.localStorage.removeItem(USER_STORAGE_KEY)
    setUser(null)
    setProfile(createEmptyProfile())
  }, [])

  const value = useMemo(
    () => ({ user, profile, isSigningIn, signInWithGoogle, updateProfile, signOut }),
    [isSigningIn, profile, signInWithGoogle, signOut, updateProfile, user],
  )

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>
}
