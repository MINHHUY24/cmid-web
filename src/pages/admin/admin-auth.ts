export interface AdminSession {
  email: string
  name: string
  role: 'SUPER_ADMIN'
  signedInAt: string
}

const ADMIN_SESSION_KEY = 'cmid-admin-session'
const ADMIN_EMAIL = 'admincmid@gmail.com'
const ADMIN_PASSWORD = 'cmid12345@'

function getStorage(remember: boolean) {
  return remember ? window.localStorage : window.sessionStorage
}

function parseSession(value: string | null): AdminSession | null {
  if (!value) return null

  try {
    const session = JSON.parse(value) as Partial<AdminSession>
    if (
      session.email === ADMIN_EMAIL &&
      session.role === 'SUPER_ADMIN' &&
      typeof session.signedInAt === 'string'
    ) {
      return session as AdminSession
    }
  } catch {
    return null
  }

  return null
}

export function getAdminSession(): AdminSession | null {
  if (typeof window === 'undefined') return null

  return (
    parseSession(window.sessionStorage.getItem(ADMIN_SESSION_KEY)) ??
    parseSession(window.localStorage.getItem(ADMIN_SESSION_KEY))
  )
}

export function signInAdmin(
  email: string,
  password: string,
  remember: boolean,
): AdminSession | null {
  if (
    email.trim().toLocaleLowerCase('vi') !== ADMIN_EMAIL ||
    password !== ADMIN_PASSWORD
  ) {
    return null
  }

  const session: AdminSession = {
    email: ADMIN_EMAIL,
    name: 'CMID Admin',
    role: 'SUPER_ADMIN',
    signedInAt: new Date().toISOString(),
  }

  window.sessionStorage.removeItem(ADMIN_SESSION_KEY)
  window.localStorage.removeItem(ADMIN_SESSION_KEY)
  getStorage(remember).setItem(ADMIN_SESSION_KEY, JSON.stringify(session))
  return session
}

export function signOutAdmin() {
  if (typeof window === 'undefined') return
  window.sessionStorage.removeItem(ADMIN_SESSION_KEY)
  window.localStorage.removeItem(ADMIN_SESSION_KEY)
}

export const adminDemoCredentials = {
  email: ADMIN_EMAIL,
  password: ADMIN_PASSWORD,
}
