import { apiFetch } from './api'

export type HelpdeskTicketStatus = 'OPEN' | 'ACKNOWLEDGED' | 'IN_PROGRESS' | 'WAITING_FOR_EMPLOYEE' | 'RESOLVED' | 'CLOSED'
export type HelpdeskTicketPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'
export type HelpdeskTicketCategory = 'ACCOUNT' | 'ACCESS' | 'DEVICE' | 'SOFTWARE' | 'NETWORK' | 'OTHER'
export type HelpdeskMessageType = 'REPLY' | 'INTERNAL_NOTE'
export type HelpdeskSlaStatus = 'NORMAL' | 'WARNING' | 'OVERDUE' | 'ACHIEVED'

export interface HelpdeskPerson {
  id: string | null
  name: string
  email: string
  avatarUrl: string | null
  department?: string | null
}

export interface HelpdeskAttachment {
  id: string
  messageId: string | null
  fileName: string
  fileUrl: string
  fileType: string | null
  fileSize: number | null
  createdAt: string
}

export interface HelpdeskMessage {
  id: string
  senderId: string | null
  senderName: string
  type: HelpdeskMessageType
  content: string
  createdAt: string
  attachments: HelpdeskAttachment[]
}

export interface HelpdeskTag {
  id: string
  name: string
}

export interface HelpdeskTeam {
  id: string
  name: string
  description: string | null
}

export interface HelpdeskTicket {
  id: string
  code: string
  subject: string
  description: string | null
  category: HelpdeskTicketCategory
  tags: HelpdeskTag[]
  priority: HelpdeskTicketPriority
  status: HelpdeskTicketStatus
  requester: HelpdeskPerson
  assignee: HelpdeskPerson | null
  team: Pick<HelpdeskTeam, 'id' | 'name'> | null
  slaDeadline: string | null
  slaStatus: HelpdeskSlaStatus | null
  lastMessage: HelpdeskMessage | null
  lastMessageAt: string
  resolvedAt: string | null
  closedAt: string | null
  createdAt: string
  updatedAt: string
  attachments?: HelpdeskAttachment[]
  messages?: HelpdeskMessage[]
}

export interface HelpdeskAgent {
  id: string
  name: string
  email: string
  avatarUrl: string | null
}

export interface HelpdeskNotification {
  id: string
  ticketId: string
  ticketCode: string
  ticketSubject: string
  senderName: string
  title: string
  body: string
  readAt: string | null
  createdAt: string
}

export function getHelpdeskTickets() {
  return apiFetch<{ canManage: boolean; tickets: HelpdeskTicket[] }>('/admin/helpdesk/tickets', {
    authScope: 'admin',
  })
}

export function getHelpdeskNotifications() {
  return apiFetch<{ unreadCount: number; notifications: HelpdeskNotification[] }>('/admin/helpdesk/notifications', {
    authScope: 'admin',
  })
}

export function markHelpdeskNotificationsRead(ticketId?: string) {
  const suffix = ticketId ? `/${encodeURIComponent(ticketId)}` : ''
  return apiFetch<{ unreadCount: number }>(`/admin/helpdesk/notifications/read${suffix}`, {
    method: 'PATCH',
    authScope: 'admin',
  })
}

export function getHelpdeskTicket(id: string) {
  return apiFetch<{ canManage: boolean; ticket: HelpdeskTicket }>(`/admin/helpdesk/tickets/${id}`, {
    authScope: 'admin',
  })
}

export function createHelpdeskTicket(body: {
  subject: string
  category: HelpdeskTicketCategory
  priority: HelpdeskTicketPriority
  description: string
}) {
  return apiFetch<{ ticket: HelpdeskTicket }>('/admin/helpdesk/tickets', {
    method: 'POST',
    authScope: 'admin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export function sendHelpdeskMessage(id: string, content: string) {
  return sendMessage(id, '/messages', content)
}

export function sendHelpdeskInternalNote(id: string, content: string) {
  return sendMessage(id, '/internal-notes', content)
}

function sendMessage(id: string, path: string, content: string) {
  return apiFetch<{ ticket: HelpdeskTicket }>(`/admin/helpdesk/tickets/${id}${path}`, {
    method: 'POST',
    authScope: 'admin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  })
}

export function updateHelpdeskTicket(id: string, body: {
  status?: HelpdeskTicketStatus
  priority?: HelpdeskTicketPriority
  assigneeId?: number | null
  teamId?: string | null
  slaDeadline?: string | null
}) {
  return apiFetch<{ ticket: HelpdeskTicket }>(`/admin/helpdesk/tickets/${id}`, {
    method: 'PATCH',
    authScope: 'admin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export function deleteHelpdeskTicket(id: string) {
  return apiFetch<{ id: string }>(`/admin/helpdesk/tickets/${id}`, {
    method: 'DELETE',
    authScope: 'admin',
  })
}

export function getHelpdeskOptions() {
  return apiFetch<{ agents: HelpdeskAgent[]; teams: HelpdeskTeam[] }>('/admin/helpdesk/options', {
    authScope: 'admin',
  })
}
