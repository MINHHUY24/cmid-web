import { apiFetch } from './api'

export type MomoPaymentMethod = 'MOMO_WALLET' | 'MOMO_CARD'

export interface CreateMomoPaymentInput {
  paymentMethod: MomoPaymentMethod
  customer: {
    name: string
    email: string
    phone: string
  }
  address: string
  note?: string
  items: Array<{
    productId: number
    quantity: number
  }>
}

export interface CreateMomoPaymentResponse {
  orderId: string
  payUrl: string
  deeplink: string | null
  qrCodeUrl: string | null
}

export interface MomoPaymentStatus {
  orderId: string
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED'
  orderStatus: 'PENDING_PAYMENT' | 'PENDING_CONFIRMATION' | 'PAYMENT_FAILED' | 'CANCELLED'
  total: number
}

export function createMomoPayment(input: CreateMomoPaymentInput) {
  return apiFetch<CreateMomoPaymentResponse>('/payments/momo', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
}

export function getMomoPaymentStatus(orderId: string) {
  return apiFetch<MomoPaymentStatus>(`/payments/momo/${encodeURIComponent(orderId)}`)
}
