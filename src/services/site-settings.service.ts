import { apiFetch } from './api'

export type PublicSiteSettings = {
  businessName: string
  email: string
  phone: string
  address: string
  weekdayHours: string
  weekendHours: string
  paymentQrTimeoutSeconds: number
  maintenanceMode: boolean
}

export type AdminSiteSettings = PublicSiteSettings & {
  freeShippingThreshold: number
  defaultVatPercent: number
  orderNotificationEmail: string
  updatedAt: string
}

export type SiteSettingsUpdate = Partial<Omit<AdminSiteSettings, 'updatedAt'>>

export const defaultSiteSettings: AdminSiteSettings = {
  businessName: 'CMID Stone & Interior',
  email: 'info@cmid.vn',
  phone: '1800 6868',
  address: '123 Lê Duẩn, Quận 1, TP. Hồ Chí Minh',
  weekdayHours: '08:00 - 17:30',
  weekendHours: '08:00 - 17:00',
  paymentQrTimeoutSeconds: 300,
  freeShippingThreshold: 5_000_000,
  defaultVatPercent: 10,
  orderNotificationEmail: 'sales@cmid.vn',
  maintenanceMode: false,
  updatedAt: '',
}

export function getPublicSiteSettings() {
  return apiFetch<PublicSiteSettings>('/site-settings', { skipAuth: true })
}

export function getAdminSiteSettings() {
  return apiFetch<AdminSiteSettings>('/site-settings/admin', { authScope: 'admin' })
}

export function updateSiteSettings(input: SiteSettingsUpdate) {
  return apiFetch<AdminSiteSettings>('/site-settings', {
    method: 'PATCH',
    authScope: 'admin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
}
