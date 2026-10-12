import { Clock, Star, UserCircle } from '@phosphor-icons/react'
import { useState, type DragEvent, type KeyboardEvent } from 'react'
import type { HelpdeskTicket, HelpdeskTicketPriority } from '../../services/helpdesk.service'
import {
  categoryLabel,
  formatRelativeTime,
  helpdeskPriorities,
  helpdeskStages,
  priorityLabel,
  priorityStars,
  slaLabel,
} from './helpdesk-utils'

interface HelpdeskBoardProps {
  tickets: HelpdeskTicket[]
  unreadTicketIds: ReadonlySet<string>
  canManage: boolean
  language: 'vi' | 'en'
  onOpen: (id: string) => void
  onMove: (ticket: HelpdeskTicket, nextStatus: HelpdeskTicket['status']) => void
  onPriorityChange: (ticket: HelpdeskTicket, priority: HelpdeskTicketPriority) => void
  onCreate: () => void
}

export function HelpdeskKanban({ tickets, unreadTicketIds, canManage, language, onOpen, onMove, onPriorityChange, onCreate }: HelpdeskBoardProps) {
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [dropStage, setDropStage] = useState<HelpdeskTicket['status'] | null>(null)
  const draggedTicket = tickets.find((ticket) => ticket.id === draggedId) ?? null

  function handleDrop(event: DragEvent<HTMLElement>, status: HelpdeskTicket['status']) {
    event.preventDefault()
    setDropStage(null)
    setDraggedId(null)
    if (!draggedTicket || draggedTicket.status === status) return
    onMove(draggedTicket, status)
  }

  return (
    <div className="admin-helpdesk-kanban" aria-label="Bảng xử lý yêu cầu hỗ trợ">
      {helpdeskStages.map((stage) => {
        const stageTickets = tickets.filter((ticket) => ticket.status === stage.value)
        const isDropTarget = canManage && dropStage === stage.value && draggedTicket?.status !== stage.value
        return (
          <section
            className={`admin-helpdesk-kanban__column is-${stage.value.toLocaleLowerCase('en-US').replaceAll('_', '-')}${isDropTarget ? ' is-drop-target' : ''}`}
            key={stage.value}
            onDragOver={(event) => {
              if (!canManage) return
              event.preventDefault()
              if (draggedTicket?.status !== stage.value) setDropStage(stage.value)
            }}
            onDragLeave={(event) => {
              if (event.currentTarget.contains(event.relatedTarget as Node)) return
              setDropStage((current) => current === stage.value ? null : current)
            }}
            onDrop={(event) => handleDrop(event, stage.value)}
          >
            <header>
              <h2>{stage.label}</h2>
              <span aria-label={`${stageTickets.length} yêu cầu`}>{stageTickets.length}</span>
            </header>
            <div className="admin-helpdesk-kanban__stack">
              {stageTickets.map((ticket) => (
                <HelpdeskTicketCard
                  canManage={canManage}
                  isDragging={draggedId === ticket.id}
                  isUnread={unreadTicketIds.has(ticket.id)}
                  key={ticket.id}
                  language={language}
                  ticket={ticket}
                  onDragEnd={() => { setDraggedId(null); setDropStage(null) }}
                  onDragStart={(event) => {
                    setDraggedId(ticket.id)
                    event.dataTransfer.effectAllowed = 'move'
                    event.dataTransfer.setData('text/plain', ticket.id)
                  }}
                  onOpen={onOpen}
                  onPriorityChange={(priority) => onPriorityChange(ticket, priority)}
                />
              ))}
              {stageTickets.length === 0 ? (
                <div className="admin-helpdesk-kanban__empty">Chưa có yêu cầu</div>
              ) : null}
              {tickets.length === 0 && stage.value === 'OPEN' ? (
                <button className="admin-helpdesk-kanban__create" type="button" onClick={onCreate}>+ Tạo yêu cầu</button>
              ) : null}
            </div>
          </section>
        )
      })}
    </div>
  )
}

export function HelpdeskList({ tickets, unreadTicketIds, language, onOpen }: Pick<HelpdeskBoardProps, 'tickets' | 'unreadTicketIds' | 'language' | 'onOpen'>) {
  if (!tickets.length) {
    return (
      <div className="admin-helpdesk-list-empty">
        <strong>Chưa có yêu cầu hỗ trợ.</strong>
        <p>Thử thay đổi bộ lọc hoặc tạo yêu cầu mới.</p>
      </div>
    )
  }

  return (
    <div className="admin-helpdesk-list" role="table" aria-label="Danh sách yêu cầu hỗ trợ">
      <div className="admin-helpdesk-list__head" role="row">
        <span role="columnheader">Ticket</span>
        <span role="columnheader">Tiêu đề</span>
        <span role="columnheader">Người yêu cầu</span>
        <span role="columnheader">Phụ trách</span>
        <span role="columnheader">Ưu tiên</span>
        <span role="columnheader">Giai đoạn</span>
        <span role="columnheader">SLA</span>
        <span role="columnheader">Cập nhật</span>
      </div>
      <div className="admin-helpdesk-list__body" role="rowgroup">
        {tickets.map((ticket) => {
          const isUnread = unreadTicketIds.has(ticket.id)
          return (
          <button aria-label={isUnread ? `${ticket.code}: có tin nhắn mới` : undefined} className={`admin-helpdesk-list__row${isUnread ? ' is-unread' : ''}`} type="button" role="row" key={ticket.id} onClick={() => onOpen(ticket.id)}>
            <span className="admin-helpdesk-list__code" role="cell">{isUnread ? <i aria-hidden="true" /> : null}{ticket.code}</span>
            <strong role="cell">{ticket.subject}</strong>
            <span role="cell">{ticket.requester.name}</span>
            <span role="cell">{ticket.assignee?.name ?? 'Chưa phân công'}</span>
            <span className={`admin-helpdesk-priority admin-helpdesk-priority--${ticket.priority.toLocaleLowerCase('en-US')}`} role="cell">
              <PriorityStars priority={ticket.priority} /> {priorityLabel(ticket.priority)}
            </span>
            <span className={`admin-helpdesk-stage admin-helpdesk-stage--${ticket.status.toLocaleLowerCase('en-US').replaceAll('_', '-')}`} role="cell">
              {helpdeskStages.find((stage) => stage.value === ticket.status)?.label ?? ticket.status}
            </span>
            <span className={`admin-helpdesk-sla${ticket.slaStatus ? ` is-${ticket.slaStatus.toLocaleLowerCase('en-US')}` : ''}`} role="cell">
              {slaLabel(ticket.slaStatus, ticket.slaDeadline, language)}
            </span>
            <time role="cell" dateTime={ticket.updatedAt}>{formatRelativeTime(ticket.updatedAt, language)}</time>
          </button>
          )
        })}
      </div>
    </div>
  )
}

function HelpdeskTicketCard({
  ticket,
  canManage,
  isDragging,
  isUnread,
  language,
  onOpen,
  onPriorityChange,
  onDragStart,
  onDragEnd,
}: {
  ticket: HelpdeskTicket
  canManage: boolean
  isDragging: boolean
  isUnread: boolean
  language: 'vi' | 'en'
  onOpen: (id: string) => void
  onPriorityChange: (priority: HelpdeskTicketPriority) => void
  onDragStart: (event: DragEvent<HTMLElement>) => void
  onDragEnd: () => void
}) {
  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.target !== event.currentTarget) return
    if (event.key === 'Enter' || event.key === ' ') onOpen(ticket.id)
  }

  return (
    <article
      aria-label={`${isUnread ? 'Có tin nhắn mới. ' : ''}Mở ${ticket.code}: ${ticket.subject}`}
      className={`admin-helpdesk-card${isDragging ? ' is-dragging' : ''}${isUnread ? ' is-unread' : ''}`}
      draggable={canManage}
      onClick={() => onOpen(ticket.id)}
      onDragEnd={onDragEnd}
      onDragStart={onDragStart}
      onKeyDown={handleKeyDown}
      role="group"
      tabIndex={0}
    >
      <header>
        <span>{isUnread ? <i aria-hidden="true" /> : null}{ticket.code}</span>
        <CardPriorityPicker canManage={canManage} onChange={onPriorityChange} priority={ticket.priority} />
      </header>
      <strong>{ticket.subject}</strong>
      <div className="admin-helpdesk-card__tags">
        <span>{categoryLabel(ticket.category)}</span>
        {ticket.tags.map((tag) => <span key={tag.id}>{tag.name}</span>)}
      </div>
      <footer>
        <span className="admin-helpdesk-card__requester">{ticket.requester.name}</span>
        <span className="admin-helpdesk-card__assignment">
          {ticket.assignee?.avatarUrl ? <img alt="" src={ticket.assignee.avatarUrl} /> : <UserCircle size={17} weight="regular" aria-hidden="true" />}
          <b>{ticket.assignee?.name ?? 'Chưa phân công'}</b>
        </span>
        <span className={`admin-helpdesk-sla${ticket.slaStatus ? ` is-${ticket.slaStatus.toLocaleLowerCase('en-US')}` : ''}`}>
          <Clock size={13} aria-hidden="true" />{slaLabel(ticket.slaStatus, ticket.slaDeadline, language)}
        </span>
      </footer>
      <time dateTime={ticket.updatedAt}>{formatRelativeTime(ticket.updatedAt, language)}</time>
    </article>
  )
}

function CardPriorityPicker({
  priority,
  canManage,
  onChange,
}: {
  priority: HelpdeskTicketPriority
  canManage: boolean
  onChange: (priority: HelpdeskTicketPriority) => void
}) {
  const [hoveredStars, setHoveredStars] = useState<number | null>(null)
  const selectedStars = priorityStars(priority)
  const shownStars = hoveredStars ?? selectedStars
  const shownPriority = helpdeskPriorities.find((item) => item.stars === shownStars)?.value ?? priority

  return (
    <div
      className={`admin-helpdesk-card__priority-picker is-${shownPriority.toLocaleLowerCase('en-US')}`}
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
      onMouseLeave={() => setHoveredStars(null)}
      title={priorityLabel(shownPriority)}
    >
      {[1, 2, 3].map((value) => {
        const nextPriority = helpdeskPriorities.find((item) => item.stars === value)?.value
        return (
          <button
            aria-label={`Đặt mức ưu tiên ${nextPriority ? priorityLabel(nextPriority) : ''} (${value} sao)`}
            aria-pressed={selectedStars === value}
            disabled={!canManage || !nextPriority}
            key={value}
            onBlur={() => setHoveredStars(null)}
            onClick={() => nextPriority && onChange(nextPriority)}
            onFocus={() => setHoveredStars(value)}
            onMouseEnter={() => setHoveredStars(value)}
            type="button"
          >
            <Star size={17} weight={value <= shownStars ? 'fill' : 'regular'} aria-hidden="true" />
          </button>
        )
      })}
    </div>
  )
}

function PriorityStars({ priority }: { priority: HelpdeskTicket['priority'] }) {
  const count = priorityStars(priority)
  return (
    <span className="admin-helpdesk-priority__stars" aria-label={priorityLabel(priority)}>
      {[1, 2, 3].map((value) => <Star key={value} size={12} weight={value <= count ? 'fill' : 'regular'} aria-hidden="true" />)}
    </span>
  )
}
