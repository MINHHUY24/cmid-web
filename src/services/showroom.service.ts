import { apiFetch } from './api'

export type ShowroomStatus = 'ACTIVE' | 'INACTIVE'

export interface Showroom {
  id: string
  name: string
  address: string
  phone: string | null
  email: string | null
  hours: string | null
  mapUrl: string | null
  image: string | null
  status: ShowroomStatus
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export type ShowroomInput = {
  id?: string
  name: string
  address: string
  phone?: string
  email?: string
  hours?: string
  mapUrl?: string
  image?: string
  status: ShowroomStatus
}

export function getPublishedShowrooms() {
  return apiFetch<Showroom[]>('/showrooms', { skipAuth: true })
}

export function getAdminShowrooms() {
  return apiFetch<Showroom[]>('/showrooms/admin', { authScope: 'admin' })
}

export function saveShowroom(input: ShowroomInput) {
  return apiFetch<Showroom>('/showrooms', {
    method: 'POST',
    authScope: 'admin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
}

export function deleteShowroom(id: string) {
  return apiFetch<void>(`/showrooms/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    authScope: 'admin',
  })
}
