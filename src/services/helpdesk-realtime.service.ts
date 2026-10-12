import { getAuthTabId } from './auth-tab'
import type { HelpdeskNotification, HelpdeskTicket } from './helpdesk.service'

const apiUrl = import.meta.env.VITE_API_URL

type TicketEventPayload = {
  ticket?: HelpdeskTicket
  ticketId?: string
}

type NotificationEventPayload = {
  notification?: HelpdeskNotification
}

export type HelpdeskRealtimeEvent = {
  type: 'ticket.created' | 'ticket.updated' | 'ticket.deleted' | 'notification.created'
  ticket?: HelpdeskTicket
  ticketId?: string
  notification?: HelpdeskNotification
}

/**
 * Opens a credentialed Server-Sent Events stream for the current browser tab.
 * The URL only carries a non-secret tab selector; the actual authentication is
 * the tab-scoped HttpOnly cookie sent automatically by the browser.
 */
export function subscribeToHelpdeskEvents(onEvent: (event: HelpdeskRealtimeEvent) => void) {
  if (!apiUrl || typeof window === 'undefined' || typeof EventSource === 'undefined') {
    return () => undefined
  }

  const baseUrl = apiUrl.replace(/\/$/, '')
  const url = new URL(`${baseUrl}/admin/helpdesk/events`, window.location.origin)
  url.searchParams.set('tab', getAuthTabId())

  const source = new EventSource(url.toString(), { withCredentials: true })
  const handleTicket = (event: Event) => {
    if (!(event instanceof MessageEvent)) return

    try {
      const payload = JSON.parse(String(event.data)) as TicketEventPayload
      if (payload.ticket?.id) onEvent({ type: event.type as HelpdeskRealtimeEvent['type'], ticket: payload.ticket })
    } catch {
      // Ignore malformed events. EventSource will reconnect automatically.
    }
  }

  source.addEventListener('ticket.created', handleTicket)
  source.addEventListener('ticket.updated', handleTicket)
  const handleDeletedTicket = (event: Event) => {
    if (!(event instanceof MessageEvent)) return

    try {
      const payload = JSON.parse(String(event.data)) as TicketEventPayload
      if (payload.ticketId) onEvent({ type: 'ticket.deleted', ticketId: payload.ticketId })
    } catch {
      // Ignore malformed events. EventSource will reconnect automatically.
    }
  }
  source.addEventListener('ticket.deleted', handleDeletedTicket)
  const handleNotification = (event: Event) => {
    if (!(event instanceof MessageEvent)) return

    try {
      const payload = JSON.parse(String(event.data)) as NotificationEventPayload
      if (payload.notification?.id) onEvent({ type: 'notification.created', notification: payload.notification })
    } catch {
      // Ignore malformed events. EventSource will reconnect automatically.
    }
  }
  source.addEventListener('notification.created', handleNotification)

  return () => {
    source.removeEventListener('ticket.created', handleTicket)
    source.removeEventListener('ticket.updated', handleTicket)
    source.removeEventListener('ticket.deleted', handleDeletedTicket)
    source.removeEventListener('notification.created', handleNotification)
    source.close()
  }
}
