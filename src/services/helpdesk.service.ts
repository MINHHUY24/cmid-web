import { apiFetch } from './api'

export type HelpdeskTicketStatus = 'OPEN' | 'IN_PROGRESS' | 'WAITING_FOR_EMPLOYEE' | 'RESOLVED' | 'CLOSED'
export type HelpdeskTicketPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'
export type HelpdeskTicketCategory = 'ACCOUNT' | 'ACCESS' | 'DEVICE' | 'SOFTWARE' | 'NETWORK' | 'OTHER'

export interface HelpdeskPerson {
  id: string | null
  name: string
  email: string
}

export interface HelpdeskMessage {
  id: string
  senderId: string | null
  senderName: string
  content: string
  createdAt: string
}

export interface HelpdeskTicket {
  id: string
  code: string
  subject: string
  category: HelpdeskTicketCategory
  priority: HelpdeskTicketPriority
  status: HelpdeskTicketStatus
  requester: HelpdeskPerson
  assignee: HelpdeskPerson | null
  lastMessage: HelpdeskMessage | null
  lastMessageAt: string
  resolvedAt: string | null
  createdAt: string
  updatedAt: string
  messages?: HelpdeskMessage[]
}

export interface HelpdeskAgent {
  id: string
  name: string
  email: string
}

export function getHelpdeskTickets() {
  return apiFetch<{ canManage: boolean; tickets: HelpdeskTicket[] }>('/admin/helpdesk/tickets', {
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
  message: string
}) {
  return apiFetch<{ ticket: HelpdeskTicket }>('/admin/helpdesk/tickets', {
    method: 'POST',
    authScope: 'admin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export function sendHelpdeskMessage(id: string, content: string) {
  return apiFetch<{ ticket: HelpdeskTicket }>(`/admin/helpdesk/tickets/${id}/messages`, {
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
}) {
  return apiFetch<{ ticket: HelpdeskTicket }>(`/admin/helpdesk/tickets/${id}`, {
    method: 'PATCH',
    authScope: 'admin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export function getHelpdeskAgents() {
  return apiFetch<{ agents: HelpdeskAgent[] }>('/admin/helpdesk/agents', {
    authScope: 'admin',
  })
}
