import { getAdminDataMode } from './admin.service'
import { apiFetch } from './api'

interface MaintenanceModeResponse {
  maintenanceMode: boolean
}

export function usesSharedMaintenanceMode() {
  return getAdminDataMode() === 'backend'
}

export async function getSharedMaintenanceMode() {
  const response = await apiFetch<MaintenanceModeResponse>('/site-settings/maintenance', {
    skipAuth: true,
  })
  return response.maintenanceMode
}

export async function updateSharedMaintenanceMode(maintenanceMode: boolean) {
  const response = await apiFetch<MaintenanceModeResponse>('/site-settings/maintenance', {
    method: 'PATCH',
    authScope: 'admin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ maintenanceMode }),
  })
  return response.maintenanceMode
}
