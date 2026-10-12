import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type { AuthenticatedUser, CustomerProfile } from './NguoiDungContext'
import { UserContext } from './NguoiDungContext'
import {
  loginWithGoogleCredential,
  logoutCustomerAuthSession,
  refreshCustomerAuthSession,
  type ServerAuthenticatedUser,
} from '../services/auth.service'
import {
  clearAccessToken,
  registerAccessTokenRefresher,
  setAccessToken,
} from '../services/auth-token'
import { ApiError } from '../services/api'
import {
  getCustomerProfile,
  updateCustomerProfile,
  type ServerCustomerProfile,
} from '../services/customer-profile.service'

const LEGACY_USER_STORAGE_KEY = 'cmid-user'
const PROFILE_STORAGE_PREFIX = 'cmid-customer-profile:'
const PROFILE_SYNC_STORAGE_PREFIX = 'cmid-customer-profile-synced:'
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
      prompt: (
        listener?: (notification: GooglePromptMomentNotification) => void,
      ) => void
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

function getProfileSyncStorageKey(userId: string) {
  return PROFILE_SYNC_STORAGE_PREFIX + userId
}

function createEmptyProfile(): CustomerProfile {
  return { ...EMPTY_CUSTOMER_PROFILE }
}

function hasSavedProfile(userId: string) {
  try {
    return window.localStorage.getItem(getProfileStorageKey(userId)) !== null
  } catch {
    return false
  }
}

function hasSyncedProfile(userId: string) {
  try {
    return (
      window.localStorage.getItem(getProfileSyncStorageKey(userId)) === 'true'
    )
  } catch {
    return false
  }
}

function markProfileAsSynced(userId: string) {
  try {
    window.localStorage.setItem(getProfileSyncStorageKey(userId), 'true')
  } catch {
    // The profile itself has already been saved on the API. A blocked storage
    // area only means it may be fetched again on the next page load.
  }
}

function markProfileAsPending(userId: string) {
  try {
    window.localStorage.removeItem(getProfileSyncStorageKey(userId))
  } catch {
    // Storage may be disabled; keep the in-memory profile usable regardless.
  }
}

function saveProfile(userId: string, profile: CustomerProfile) {
  try {
    window.localStorage.setItem(
      getProfileStorageKey(userId),
      JSON.stringify(profile),
    )
  } catch {
    // A large local avatar or privacy mode must not block checkout/profile use.
  }
}

function getSavedProfile(userId?: string): CustomerProfile {
  if (!userId) {
    return createEmptyProfile()
  }

  try {
    const savedProfile = window.localStorage.getItem(
      getProfileStorageKey(userId),
    )
    if (!savedProfile) {
      return createEmptyProfile()
    }

    const profile = JSON.parse(savedProfile) as Partial<CustomerProfile>
    return {
      fullName: typeof profile.fullName === 'string' ? profile.fullName : '',
      avatar: typeof profile.avatar === 'string' ? profile.avatar : '',
      phone: typeof profile.phone === 'string' ? profile.phone : '',
      birthDate: typeof profile.birthDate === 'string' ? profile.birthDate : '',
      gender:
        profile.gender === 'male' ||
        profile.gender === 'female' ||
        profile.gender === 'other'
          ? profile.gender
          : '',
      city: typeof profile.city === 'string' ? profile.city : '',
      district: typeof profile.district === 'string' ? profile.district : '',
      ward: typeof profile.ward === 'string' ? profile.ward : '',
      address: typeof profile.address === 'string' ? profile.address : '',
    }
  } catch {
    try {
      window.localStorage.removeItem(getProfileStorageKey(userId))
    } catch {
      // Ignore unavailable local storage.
    }
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

function toCustomerProfile(
  serverProfile: ServerCustomerProfile,
): CustomerProfile {
  return {
    fullName: serverProfile.fullName,
    avatar: serverProfile.avatar,
    phone: serverProfile.phone,
    birthDate: serverProfile.birthDate,
    gender: serverProfile.gender,
    city: serverProfile.city,
    district: serverProfile.district,
    ward: serverProfile.ward,
    address: serverProfile.address,
  }
}

function mergeServerProfile(
  serverProfile: CustomerProfile,
  localProfile: CustomerProfile,
  preferLocalProfile: boolean,
): CustomerProfile {
  const choose = (serverValue: string, localValue: string) =>
    preferLocalProfile && localValue ? localValue : serverValue || localValue

  return {
    fullName: choose(serverProfile.fullName, localProfile.fullName),
    // Uploaded data-URL avatars remain browser-local until media storage is
    // introduced. Do not overwrite one with the Google avatar on hydration.
    avatar: localProfile.avatar || serverProfile.avatar,
    phone: choose(serverProfile.phone, localProfile.phone),
    birthDate: choose(serverProfile.birthDate, localProfile.birthDate),
    gender: choose(
      serverProfile.gender,
      localProfile.gender,
    ) as CustomerProfile['gender'],
    city: choose(serverProfile.city, localProfile.city),
    district: choose(serverProfile.district, localProfile.district),
    ward: choose(serverProfile.ward, localProfile.ward),
    address: choose(serverProfile.address, localProfile.address),
  }
}

function hasServerPersistableProfileData(profile: CustomerProfile) {
  return Boolean(
    profile.fullName ||
      profile.phone ||
      profile.birthDate ||
      profile.gender ||
      profile.city ||
      profile.district ||
      profile.ward ||
      profile.address,
  )
}

function toCustomerProfileUpdate(profile: CustomerProfile) {
  return {
    fullName: profile.fullName,
    phone: profile.phone,
    birthDate: profile.birthDate,
    gender: profile.gender,
    city: profile.city,
    district: profile.district,
    ward: profile.ward,
    address: profile.address,
  }
}

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

function loadGoogleIdentityScript(): Promise<void> {
  if (window.google?.accounts.id) {
    return Promise.resolve()
  }

  return new Promise((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[data-google-identity]',
    )

    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(), { once: true })
      existingScript.addEventListener(
        'error',
        () => reject(new Error('Không thể tải Google Identity Services.')),
        { once: true },
      )
      return
    }

    const script = document.createElement('script')
    script.src = GOOGLE_SCRIPT_URL
    script.async = true
    script.defer = true
    script.dataset.googleIdentity = 'true'
    script.onload = () => resolve()
    script.onerror = () =>
      reject(new Error('Không thể tải Google Identity Services.'))
    document.head.append(script)
  })
}

async function requestGoogleCredential(): Promise<string> {
  if (!GOOGLE_CLIENT_ID) {
    throw new Error(
      'Google đăng nhập chưa được cấu hình. Thêm VITE_GOOGLE_CLIENT_ID vào file .env.',
    )
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
        rejectOnce(
          'Không thể mở hộp thoại Google. Vui lòng kiểm tra cấu hình Google Login.',
        )
      }
    })
  })
}

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthenticatedUser | null>(null)
  const [profile, setProfile] = useState<CustomerProfile>(createEmptyProfile)
  const [isAuthLoading, setIsAuthLoading] = useState(true)
  const [isSigningIn, setIsSigningIn] = useState(false)
  const [nextSessionRefreshAt, setNextSessionRefreshAt] = useState<
    number | null
  >(null)
  const authGenerationRef = useRef(0)
  const profileRevisionRef = useRef(0)

  const applyAuthenticatedUser = useCallback((nextUser: AuthenticatedUser) => {
    setUser(nextUser)
    setProfile(getSavedProfile(nextUser.id))
  }, [])

  const clearCustomerSession = useCallback(() => {
    clearAccessToken()
    setUser(null)
    setProfile(createEmptyProfile())
    setNextSessionRefreshAt(null)
  }, [])

  const applyAuthenticatedSession = useCallback(
    (session: Awaited<ReturnType<typeof refreshCustomerAuthSession>>) => {
      setAccessToken(session.accessToken)
      setNextSessionRefreshAt(Date.now() + session.accessTokenExpiresIn * 1_000)

      const authenticatedUser = toAuthenticatedUser(session.user)
      applyAuthenticatedUser(authenticatedUser)
      return authenticatedUser
    },
    [applyAuthenticatedUser],
  )

  const hydrateCustomerProfile = useCallback(
    (nextUser: AuthenticatedUser, authGeneration: number) => {
      const localProfile = getSavedProfile(nextUser.id)
      const shouldMigrateLocalProfile =
        hasSavedProfile(nextUser.id) &&
        !hasSyncedProfile(nextUser.id) &&
        hasServerPersistableProfileData(localProfile)
      const profileRevision = profileRevisionRef.current

      void getCustomerProfile()
        .then(({ profile: serverProfile }) => {
          if (
            authGenerationRef.current !== authGeneration ||
            profileRevisionRef.current !== profileRevision
          ) {
            return
          }

          const mergedProfile = normalizeProfile(
            mergeServerProfile(
              toCustomerProfile(serverProfile),
              localProfile,
              shouldMigrateLocalProfile,
            ),
          )
          setProfile(mergedProfile)
          saveProfile(nextUser.id, mergedProfile)

          if (!shouldMigrateLocalProfile) {
            markProfileAsSynced(nextUser.id)
            return
          }

          // Before this API existed, profiles lived solely in localStorage.
          // Move that legacy data to the server once without overwriting a newer
          // server profile on later visits.
          void updateCustomerProfile(toCustomerProfileUpdate(mergedProfile))
            .then(({ profile: savedProfile }) => {
              if (
                authGenerationRef.current !== authGeneration ||
                profileRevisionRef.current !== profileRevision
              ) {
                return
              }

              const canonicalProfile = normalizeProfile(
                mergeServerProfile(
                  toCustomerProfile(savedProfile),
                  mergedProfile,
                  false,
                ),
              )
              setProfile(canonicalProfile)
              saveProfile(nextUser.id, canonicalProfile)
              markProfileAsSynced(nextUser.id)
              setUser((currentUser) =>
                currentUser?.id === nextUser.id && canonicalProfile.fullName
                  ? { ...currentUser, name: canonicalProfile.fullName }
                  : currentUser,
              )
            })
            .catch(() => {
              // Keep the local profile and retry it on the next authenticated
              // bootstrap instead of making a completed checkout look failed.
              markProfileAsPending(nextUser.id)
            })
        })
        .catch(() => {
          // The cached profile remains usable when the API is temporarily down.
          // It is intentionally left unsynced so the next session can retry.
        })
    },
    [],
  )

  useEffect(() => {
    let isCurrent = true
    const authGeneration = ++authGenerationRef.current

    try {
      window.localStorage.removeItem(LEGACY_USER_STORAGE_KEY)
    } catch {
      // Browsing remains available when local storage is unavailable.
    }

    void refreshCustomerAuthSession()
      .then((session) => {
        if (!isCurrent || authGenerationRef.current !== authGeneration) return

        const authenticatedUser = applyAuthenticatedSession(session)
        hydrateCustomerProfile(authenticatedUser, authGeneration)
      })
      .catch(() => {
        if (!isCurrent || authGenerationRef.current !== authGeneration) return
        clearCustomerSession()
      })
      .finally(() => {
        if (isCurrent && authGenerationRef.current === authGeneration) {
          setIsAuthLoading(false)
        }
      })

    return () => {
      isCurrent = false
    }
  }, [applyAuthenticatedSession, clearCustomerSession, hydrateCustomerProfile])

  useEffect(() => {
    if (!user || nextSessionRefreshAt === null) return undefined

    const authGeneration = authGenerationRef.current
    const refreshDelay = Math.max(
      5_000,
      nextSessionRefreshAt - Date.now() - 60_000,
    )
    const refreshTimer = window.setTimeout(() => {
      void refreshCustomerAuthSession()
        .then((session) => {
          if (authGenerationRef.current !== authGeneration) return

          const authenticatedUser = applyAuthenticatedSession(session)
          hydrateCustomerProfile(authenticatedUser, authGeneration)
        })
        .catch(() => {
          if (authGenerationRef.current !== authGeneration) return

          // A transient offline error should not immediately look like a
          // logout. Retry shortly; an actual expired/revoked session will be
          // handled by the next request or a page bootstrap.
          setNextSessionRefreshAt(Date.now() + 30_000)
        })
    }, refreshDelay)

    return () => window.clearTimeout(refreshTimer)
  }, [
    applyAuthenticatedSession,
    hydrateCustomerProfile,
    nextSessionRefreshAt,
    user,
  ])

  useEffect(
    () =>
      registerAccessTokenRefresher('customer', async () => {
        const authGeneration = authGenerationRef.current

        try {
          const session = await refreshCustomerAuthSession()
          if (authGenerationRef.current !== authGeneration) return null

          const authenticatedUser = applyAuthenticatedSession(session)
          hydrateCustomerProfile(authenticatedUser, authGeneration)
          return session.accessToken
        } catch (error) {
          if (
            authGenerationRef.current === authGeneration &&
            error instanceof ApiError &&
            error.status === 401
          ) {
            clearCustomerSession()
          }
          return null
        }
      }),
    [applyAuthenticatedSession, clearCustomerSession, hydrateCustomerProfile],
  )

  const signInWithGoogle = useCallback(async () => {
    setIsSigningIn(true)

    try {
      const credential = await requestGoogleCredential()
      const session = await loginWithGoogleCredential(credential)
      const authGeneration = ++authGenerationRef.current
      const authenticatedUser = applyAuthenticatedSession(session)
      hydrateCustomerProfile(authenticatedUser, authGeneration)
      setIsAuthLoading(false)
      return authenticatedUser
    } finally {
      setIsSigningIn(false)
    }
  }, [applyAuthenticatedSession, hydrateCustomerProfile])

  const updateProfile = useCallback(
    async (nextProfile: CustomerProfile) => {
      if (!user) {
        return
      }

      const normalizedProfile = normalizeProfile(nextProfile)
      const authGeneration = authGenerationRef.current
      const profileRevision = ++profileRevisionRef.current
      saveProfile(user.id, normalizedProfile)
      markProfileAsPending(user.id)
      setProfile(normalizedProfile)

      try {
        const { profile: savedProfile } = await updateCustomerProfile(
          toCustomerProfileUpdate(normalizedProfile),
        )
        if (
          authGenerationRef.current !== authGeneration ||
          profileRevisionRef.current !== profileRevision
        ) {
          return
        }

        const canonicalProfile = normalizeProfile(
          mergeServerProfile(
            toCustomerProfile(savedProfile),
            normalizedProfile,
            false,
          ),
        )
        setProfile(canonicalProfile)
        saveProfile(user.id, canonicalProfile)
        markProfileAsSynced(user.id)
        setUser((currentUser) =>
          currentUser?.id === user.id && canonicalProfile.fullName
            ? { ...currentUser, name: canonicalProfile.fullName }
            : currentUser,
        )
      } catch {
        // Local state is retained and retried after the next session restore.
        // An order that was already accepted must never be shown as failed just
        // because this secondary profile save was temporarily unavailable.
        markProfileAsPending(user.id)
      }
    },
    [user],
  )

  const signOut = useCallback(async () => {
    ++authGenerationRef.current
    clearCustomerSession()

    try {
      await logoutCustomerAuthSession()
    } catch {
      // The browser state is cleared even if the network is unavailable.
    }
  }, [clearCustomerSession])

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
    [
      isAuthLoading,
      isSigningIn,
      profile,
      signInWithGoogle,
      signOut,
      updateProfile,
      user,
    ],
  )

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>
}
