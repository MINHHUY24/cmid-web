import { apiFetch } from './api'

export type InquiryStatus = 'NEW' | 'IN_PROGRESS' | 'RESPONDED' | 'CLOSED'
export type InquirySource = 'CONTACT' | 'SHOWROOM' | 'QUOTE'

export interface ContactInquiry {
  id: string
  name: string
  email: string
  phone: string
  subject: string
  message: string
  source: InquirySource
  status: InquiryStatus
  createdAt: string
  updatedAt: string
}

export function createContactInquiry(body: {
  name: string
  email: string
  phone: string
  subject: string
  message: string
  consent: boolean
}) {
  return apiFetch<{ inquiry: ContactInquiry }>('/inquiries', {
    method: 'POST',
    skipAuth: true,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export function getManagedInquiries() {
  return apiFetch<{ inquiries: ContactInquiry[] }>('/inquiries/admin', {
    authScope: 'admin',
  })
}

export function updateManagedInquiry(id: string, status: InquiryStatus) {
  return apiFetch<{ inquiry: ContactInquiry }>(`/inquiries/admin/${id}`, {
    method: 'PATCH',
    authScope: 'admin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  })
}

export function deleteManagedInquiry(id: string) {
  return apiFetch<void>(`/inquiries/admin/${id}`, {
    method: 'DELETE',
    authScope: 'admin',
  })
}
