import { apiFetch } from './api'

export type ServerCustomerGender = '' | 'male' | 'female' | 'other'

export interface ServerCustomerProfile {
  fullName: string
  avatar: string
  phone: string
  birthDate: string
  gender: ServerCustomerGender
  city: string
  district: string
  ward: string
  address: string
}

export type CustomerProfileUpdate = Omit<ServerCustomerProfile, 'avatar'>

type CustomerProfileResponse = {
  profile: ServerCustomerProfile
}

export function getCustomerProfile() {
  return apiFetch<CustomerProfileResponse>('/auth/profile')
}

/**
 * The avatar is intentionally not sent here. The account screen currently
 * allows a local data-URL avatar, which can be much larger than a normal API
 * profile update and is not a delivery-profile field.
 */
export function updateCustomerProfile(profile: CustomerProfileUpdate) {
  return apiFetch<CustomerProfileResponse>('/auth/profile', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fullName: profile.fullName,
      phone: profile.phone || null,
      birthDate: profile.birthDate || null,
      gender: profile.gender || null,
      city: profile.city || null,
      district: profile.district || null,
      ward: profile.ward || null,
      address: profile.address || null,
    }),
  })
}
