import type { AdminDatabase } from '../pages/admin/CoSoDuLieuQuanTri'
import { apiFetch } from './api'

type AdminWorkspaceResponse = {
  data: AdminDatabase | null
  updatedAt: string | null
}

export function getAdminWorkspace() {
  return apiFetch<AdminWorkspaceResponse>('/admin-workspace', {
    authScope: 'admin',
  })
}

export function replaceAdminWorkspace(data: AdminDatabase) {
  return apiFetch<AdminWorkspaceResponse>('/admin-workspace', {
    method: 'PUT',
    authScope: 'admin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data }),
  })
}
