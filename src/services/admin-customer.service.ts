import { apiFetch } from './api'

export interface ManagedCustomer {
  id: string
  name: string
  email: string
  phone: string | null
  isActive: boolean
  lastLoginAt: string | null
  createdAt: string
  orderCount: number
  totalSpent: number
}

export function getManagedCustomers() {
  return apiFetch<{ customers: ManagedCustomer[] }>('/admin/access/customers', {
    authScope: 'admin',
  })
}

export function updateManagedCustomer(
  id: string,
  body: { fullName?: string; phone?: string; isActive?: boolean },
) {
  return apiFetch<{ customer: ManagedCustomer }>(`/admin/access/customers/${id}`, {
    method: 'PATCH',
    authScope: 'admin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}
