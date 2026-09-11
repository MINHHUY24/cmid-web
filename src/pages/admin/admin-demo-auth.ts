import { getAdminDataMode } from '../../services/admin.service'
import type { AdminSession } from './admin-auth'

const DEMO_SESSION_KEY = 'cmid-admin-demo-session'

export const isAdminDemoEnabled = import.meta.env.DEV && getAdminDataMode() === 'local'

export const adminDemoCredentials = {
  email: 'admincmid@gmail.com',
  password: 'cmid12345@',
}

const demoSession: AdminSession = {
  email: adminDemoCredentials.email,
  name: 'CMID Admin (Test)',
  role: 'SUPER_ADMIN',
}

export function getAdminDemoSession(): AdminSession | null {
  if (!isAdminDemoEnabled) return null

  try {
    return window.sessionStorage.getItem(DEMO_SESSION_KEY) === 'active' ? demoSession : null
  } catch {
    return null
  }
}

export function signInAdminDemo(): AdminSession {
  if (!isAdminDemoEnabled) throw new Error('Đăng nhập mẫu chỉ dùng trong môi trường test cục bộ.')

  try {
    window.sessionStorage.setItem(DEMO_SESSION_KEY, 'active')
  } catch {
    // The current page can still use the demo when browser storage is unavailable.
  }

  return demoSession
}

export function signOutAdminDemo() {
  try {
    window.sessionStorage.removeItem(DEMO_SESSION_KEY)
  } catch {
    // The caller also clears the in-memory demo session.
  }
}
