import {
  ArrowLeft,
  CircleNotch,
  Headset,
  MagnifyingGlass,
  PaperPlaneTilt,
  Plus,
  X,
} from '@phosphor-icons/react'
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { KhungXuong } from '../../components/common/KhungXuong'
import { useAdminAuth } from '../../contexts/useQuanTriAuth'
import {
  createHelpdeskTicket,
  getHelpdeskAgents,
  getHelpdeskTicket,
  getHelpdeskTickets,
  sendHelpdeskMessage,
  updateHelpdeskTicket,
  type HelpdeskAgent,
  type HelpdeskTicket,
  type HelpdeskTicketCategory,
  type HelpdeskTicketPriority,
  type HelpdeskTicketStatus,
} from '../../services/helpdesk.service'
import { getLocalizedAdminError } from './admin-error-message'
import { useAdminCopy } from './admin-language-context'
import { AdminPageHeading } from './AdminPrimitives'

type TicketScope = 'ALL' | 'OPEN' | 'MINE'

const statusOptions: Array<{ value: HelpdeskTicketStatus; label: string }> = [
  { value: 'OPEN', label: 'Mới' },
  { value: 'IN_PROGRESS', label: 'Đang xử lý' },
  { value: 'WAITING_FOR_EMPLOYEE', label: 'Chờ phản hồi' },
  { value: 'RESOLVED', label: 'Đã xử lý' },
  { value: 'CLOSED', label: 'Đã đóng' },
]

const priorityOptions: Array<{ value: HelpdeskTicketPriority; label: string }> = [
  { value: 'LOW', label: 'Thấp' },
  { value: 'NORMAL', label: 'Bình thường' },
  { value: 'HIGH', label: 'Cao' },
  { value: 'URGENT', label: 'Khẩn cấp' },
]

const categoryOptions: Array<{ value: HelpdeskTicketCategory; label: string }> = [
  { value: 'ACCOUNT', label: 'Tài khoản' },
  { value: 'ACCESS', label: 'Quyền truy cập' },
  { value: 'DEVICE', label: 'Thiết bị' },
  { value: 'SOFTWARE', label: 'Phần mềm' },
  { value: 'NETWORK', label: 'Mạng / kết nối' },
  { value: 'OTHER', label: 'Khác' },
]

export function AdminHelpdeskView({ onToast }: { onToast: (message: string) => void }) {
  const { adminUser } = useAdminAuth()
  const { language, t } = useAdminCopy()
  const [tickets, setTickets] = useState<HelpdeskTicket[]>([])
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null)
  const [activeTicket, setActiveTicket] = useState<HelpdeskTicket | null>(null)
  const [agents, setAgents] = useState<HelpdeskAgent[]>([])
  const [canManage, setCanManage] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingTicket, setIsLoadingTicket] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [listError, setListError] = useState<string | null>(null)
  const [detailError, setDetailError] = useState<string | null>(null)
  const [createError, setCreateError] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [search, setSearch] = useState('')
  const [scope, setScope] = useState<TicketScope>('ALL')
  const requestSequence = useRef(0)
  const messageListRef = useRef<HTMLDivElement>(null)

  const loadTicket = useCallback(async (id: string, silent = false) => {
    const sequence = ++requestSequence.current
    if (!silent) {
      setIsLoadingTicket(true)
      setDetailError(null)
      setActiveTicket(null)
    }
    try {
      const result = await getHelpdeskTicket(id)
      if (sequence !== requestSequence.current) return
      setCanManage(result.canManage)
      setDetailError(null)
      setActiveTicket(result.ticket)
      setTickets((current) => replaceTicketInList(current, result.ticket))
    } catch (error) {
      if (sequence !== requestSequence.current || silent) return
      setDetailError(getLocalizedAdminError(error, language, 'Không thể tải trao đổi hỗ trợ.'))
    } finally {
      if (sequence === requestSequence.current && !silent) setIsLoadingTicket(false)
    }
  }, [language])

  const reloadTickets = useCallback(async (silent = false) => {
    if (!silent) {
      setIsLoading(true)
      setListError(null)
    }
    try {
      const result = await getHelpdeskTickets()
      setCanManage(result.canManage)
      setListError(null)
      setTickets(result.tickets.map(toTicketSummary))
      setActiveTicketId((current) => (
        current && result.tickets.some((ticket) => ticket.id === current)
          ? current
          : result.tickets[0]?.id ?? null
      ))
    } catch (error) {
      if (!silent) setListError(getLocalizedAdminError(error, language, 'Không thể tải yêu cầu hỗ trợ.'))
    } finally {
      if (!silent) setIsLoading(false)
    }
  }, [language])

  useEffect(() => {
    const initialLoad = window.setTimeout(() => { void reloadTickets() }, 0)
    return () => window.clearTimeout(initialLoad)
  }, [reloadTickets])

  useEffect(() => {
    if (!activeTicketId) return
    const initialTicketLoad = window.setTimeout(() => { void loadTicket(activeTicketId) }, 0)
    return () => window.clearTimeout(initialTicketLoad)
  }, [activeTicketId, loadTicket])

  useEffect(() => {
    if (!activeTicketId) return undefined
    const interval = window.setInterval(() => {
      void loadTicket(activeTicketId, true)
    }, 20_000)
    return () => window.clearInterval(interval)
  }, [activeTicketId, loadTicket])

  useEffect(() => {
    const interval = window.setInterval(() => {
      void reloadTickets(true)
    }, 20_000)
    return () => window.clearInterval(interval)
  }, [reloadTickets])

  useEffect(() => {
    const messageList = messageListRef.current
    if (!messageList) return
    messageList.scrollTop = messageList.scrollHeight
  }, [activeTicket?.id, activeTicket?.messages?.length])

  useEffect(() => {
    if (!canManage) {
      return undefined
    }
    let isCurrent = true
    void getHelpdeskAgents()
      .then((result) => {
        if (isCurrent) setAgents(result.agents)
      })
      .catch(() => {
        if (isCurrent) setAgents([])
      })
    return () => { isCurrent = false }
  }, [canManage])

  const filteredTickets = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase('vi')
    return tickets.filter((ticket) => {
      if (scope === 'OPEN' && ['RESOLVED', 'CLOSED'].includes(ticket.status)) return false
      if (scope === 'MINE') {
        const ownId = String(adminUser?.id ?? '')
        if (canManage ? ticket.assignee?.id !== ownId : ticket.requester.id !== ownId) return false
      }
      if (!normalizedSearch) return true
      return [ticket.code, ticket.subject, ticket.requester.name, ticket.assignee?.name ?? '']
        .some((value) => value.toLocaleLowerCase('vi').includes(normalizedSearch))
    })
  }, [adminUser?.id, canManage, scope, search, tickets])

  const openTicket = (id: string) => {
    if (id === activeTicketId && activeTicket) return
    setActiveTicketId(id)
  }

  const replaceTicket = useCallback((ticket: HelpdeskTicket) => {
    setActiveTicketId(ticket.id)
    setActiveTicket(ticket)
    setTickets((current) => replaceTicketInList(current, ticket))
  }, [])

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const formData = new FormData(form)
    const subject = String(formData.get('subject') ?? '').trim()
    const category = String(formData.get('category') ?? 'OTHER') as HelpdeskTicketCategory
    const priority = String(formData.get('priority') ?? 'NORMAL') as HelpdeskTicketPriority
    const initialMessage = String(formData.get('message') ?? '').trim()
    if (!subject || !initialMessage) return

    setIsCreating(true)
    setCreateError(null)
    try {
      const result = await createHelpdeskTicket({ subject, category, priority, message: initialMessage })
      replaceTicket(result.ticket)
      setIsCreateOpen(false)
      onToast(t('Đã gửi yêu cầu hỗ trợ cho bộ phận IT.'))
    } catch (error) {
      setCreateError(getLocalizedAdminError(error, language, 'Không thể gửi yêu cầu hỗ trợ.'))
    } finally {
      setIsCreating(false)
    }
  }

  async function handleSend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const content = message.trim()
    if (!activeTicket || !content) return
    setIsSending(true)
    setDetailError(null)
    try {
      const result = await sendHelpdeskMessage(activeTicket.id, content)
      replaceTicket(result.ticket)
      setMessage('')
    } catch (error) {
      setDetailError(getLocalizedAdminError(error, language, 'Không thể gửi tin nhắn.'))
    } finally {
      setIsSending(false)
    }
  }

  async function updateTicket(patch: {
    status?: HelpdeskTicketStatus
    priority?: HelpdeskTicketPriority
    assigneeId?: number | null
  }) {
    if (!activeTicket) return
    setIsUpdating(true)
    setDetailError(null)
    try {
      const result = await updateHelpdeskTicket(activeTicket.id, patch)
      replaceTicket(result.ticket)
      onToast(t('Đã cập nhật xử lý yêu cầu hỗ trợ.'))
    } catch (error) {
      setDetailError(getLocalizedAdminError(error, language, 'Không thể cập nhật yêu cầu hỗ trợ.'))
    } finally {
      setIsUpdating(false)
    }
  }

  const visibleScopeCount = (nextScope: TicketScope) => tickets.filter((ticket) => {
    if (nextScope === 'ALL') return true
    if (nextScope === 'OPEN') return !['RESOLVED', 'CLOSED'].includes(ticket.status)
    const ownId = String(adminUser?.id ?? '')
    return canManage ? ticket.assignee?.id === ownId : ticket.requester.id === ownId
  }).length

  if (isLoading) return <HelpdeskSkeleton />

  if (listError) {
    return (
      <section className="admin-helpdesk__state admin-helpdesk__state--error" role="alert">
        <WarningState />
        <div><h1>{t('Không thể tải Hỗ trợ IT')}</h1><p>{listError}</p></div>
        <button className="admin-button admin-button--primary" type="button" onClick={() => void reloadTickets()}>{t('Thử lại')}</button>
      </section>
    )
  }

  return (
    <section className={`admin-helpdesk${activeTicketId ? ' has-selection' : ''}${canManage ? ' can-manage' : ''}`}>
      <AdminPageHeading
        title="Hỗ trợ IT"
        description="Gửi yêu cầu nội bộ và trao đổi với bộ phận IT trong một luồng theo dõi rõ ràng."
        action={(
          <button className="admin-button admin-button--primary" type="button" onClick={() => { setCreateError(null); setIsCreateOpen(true) }}>
            <Plus size={17} weight="bold" aria-hidden="true" />{t('Tạo yêu cầu hỗ trợ')}
          </button>
        )}
      />

      <div className="admin-helpdesk__workspace">
        <aside className="admin-helpdesk__queue" aria-label={t('Danh sách yêu cầu hỗ trợ')}>
          <header className="admin-helpdesk__queue-header">
            <div>
              <span>{t(canManage ? 'Hộp thư hỗ trợ' : 'Yêu cầu của tôi')}</span>
              <strong>{tickets.length} {t('yêu cầu')}</strong>
            </div>
            <span className="admin-helpdesk__presence"><i />{t(canManage ? 'IT đang trực' : 'Kênh nội bộ')}</span>
          </header>
          <label className="admin-helpdesk__search">
            <MagnifyingGlass size={17} aria-hidden="true" />
            <span className="sr-only">{t('Tìm kiếm yêu cầu hỗ trợ')}</span>
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t('Tìm theo mã hoặc nội dung...')} />
          </label>
          <div className="admin-helpdesk__filters" aria-label={t('Bộ lọc yêu cầu')}>
            {([
              ['ALL', 'Tất cả'],
              ['OPEN', 'Đang mở'],
              ['MINE', canManage ? 'Được giao tôi' : 'Của tôi'],
            ] as Array<[TicketScope, string]>).map(([value, label]) => (
              <button key={value} className={scope === value ? 'is-active' : ''} type="button" aria-pressed={scope === value} onClick={() => setScope(value)}>
                {t(label)} <b>{visibleScopeCount(value)}</b>
              </button>
            ))}
          </div>
          <div className="admin-helpdesk__ticket-list">
            {filteredTickets.map((ticket) => (
              <button
                className={`admin-helpdesk__ticket${ticket.id === activeTicketId ? ' is-active' : ''}`}
                type="button"
                key={ticket.id}
                onClick={() => openTicket(ticket.id)}
              >
                <div className="admin-helpdesk__ticket-topline">
                  <span>{ticket.code}</span><time>{formatRelativeTime(ticket.lastMessageAt, language)}</time>
                </div>
                <strong>{ticket.subject}</strong>
                <p>{ticket.lastMessage?.content ?? t('Chưa có nội dung trao đổi.')}</p>
                <footer>
                  <TicketStatusPill status={ticket.status} label={t(statusLabel(ticket.status))} />
                  <span>{t(priorityLabel(ticket.priority))}</span>
                  {canManage && ticket.assignee ? <small>{ticket.assignee.name}</small> : null}
                </footer>
              </button>
            ))}
            {filteredTickets.length === 0 ? (
              <div className="admin-helpdesk__queue-empty">
                <Headset size={27} weight="thin" aria-hidden="true" />
                <strong>{t(search || scope !== 'ALL' ? 'Không có yêu cầu phù hợp' : 'Chưa có yêu cầu hỗ trợ')}</strong>
                <p>{t(search || scope !== 'ALL' ? 'Thử thay đổi từ khóa hoặc bộ lọc.' : 'Khi cần hỗ trợ, hãy gửi yêu cầu để bộ phận IT tiếp nhận.')}</p>
              </div>
            ) : null}
          </div>
        </aside>

        <main className="admin-helpdesk__conversation" aria-live="polite">
          {isLoadingTicket ? <ConversationSkeleton /> : null}
          {!isLoadingTicket && detailError ? (
            <div className="admin-helpdesk__conversation-state" role="alert">
              <WarningState /><strong>{t('Không thể tải cuộc trao đổi')}</strong><p>{detailError}</p>
              <button className="admin-button" type="button" onClick={() => activeTicketId && void loadTicket(activeTicketId)}>{t('Thử lại')}</button>
            </div>
          ) : null}
          {!isLoadingTicket && !detailError && !activeTicket ? (
            <div className="admin-helpdesk__conversation-state">
              <Headset size={42} weight="thin" aria-hidden="true" />
              <strong>{t('Chọn một yêu cầu để trao đổi')}</strong>
              <p>{t('Mọi phản hồi sẽ được lưu trong luồng hỗ trợ này.')}</p>
              <button className="admin-button admin-button--primary" type="button" onClick={() => setIsCreateOpen(true)}><Plus size={16} />{t('Tạo yêu cầu hỗ trợ')}</button>
            </div>
          ) : null}
          {!isLoadingTicket && !detailError && activeTicket ? (
            <>
              <header className="admin-helpdesk__conversation-header">
                <button className="admin-helpdesk__back" type="button" onClick={() => setActiveTicketId(null)} aria-label={t('Quay lại danh sách yêu cầu')}>
                  <ArrowLeft size={20} aria-hidden="true" />
                </button>
                <div>
                  <span>{activeTicket.code}</span>
                  <h2>{activeTicket.subject}</h2>
                  <p>{t('Người gửi')}: <strong>{activeTicket.requester.name}</strong> · {formatDateTime(activeTicket.createdAt, language)}</p>
                </div>
                <TicketStatusPill status={activeTicket.status} label={t(statusLabel(activeTicket.status))} />
              </header>
              <div className="admin-helpdesk__messages" aria-label={t('Trao đổi hỗ trợ')} ref={messageListRef}>
                {activeTicket.messages?.map((item) => {
                  const isMine = item.senderId === String(adminUser?.id ?? '')
                  return (
                    <article className={`admin-helpdesk__message${isMine ? ' is-mine' : ''}`} key={item.id}>
                      <span className="admin-helpdesk__message-avatar" aria-hidden="true">{initials(item.senderName)}</span>
                      <div>
                        <header><strong>{isMine ? t('Bạn') : item.senderName}</strong><time>{formatMessageTime(item.createdAt, language)}</time></header>
                        <p>{item.content}</p>
                      </div>
                    </article>
                  )
                })}
              </div>
              <form className="admin-helpdesk__composer" onSubmit={handleSend}>
                <label>
                  <span className="sr-only">{t('Nội dung phản hồi')}</span>
                  <textarea rows={2} value={message} onChange={(event) => setMessage(event.target.value)} placeholder={t('Viết phản hồi cho luồng hỗ trợ này...')} />
                </label>
                <button type="submit" disabled={!message.trim() || isSending} aria-label={t('Gửi phản hồi')}>
                  {isSending ? <CircleNotch className="is-spinning" size={20} aria-hidden="true" /> : <PaperPlaneTilt size={20} weight="fill" aria-hidden="true" />}
                </button>
              </form>
            </>
          ) : null}
        </main>

        {canManage && activeTicket ? (
          <aside className="admin-helpdesk__detail" aria-label={t('Thông tin xử lý')}>
            <header><span>{t('Thông tin xử lý')}</span><strong>{t('Cập nhật trực tiếp')}</strong></header>
            <label>
              <span>{t('Trạng thái')}</span>
              <select value={activeTicket.status} disabled={isUpdating} onChange={(event) => void updateTicket({ status: event.target.value as HelpdeskTicketStatus })}>
                {statusOptions.map((option) => <option key={option.value} value={option.value}>{t(option.label)}</option>)}
              </select>
            </label>
            <label>
              <span>{t('Mức độ ưu tiên')}</span>
              <select value={activeTicket.priority} disabled={isUpdating} onChange={(event) => void updateTicket({ priority: event.target.value as HelpdeskTicketPriority })}>
                {priorityOptions.map((option) => <option key={option.value} value={option.value}>{t(option.label)}</option>)}
              </select>
            </label>
            <label>
              <span>{t('Người phụ trách')}</span>
              <select value={activeTicket.assignee?.id ?? ''} disabled={isUpdating} onChange={(event) => void updateTicket({ assigneeId: event.target.value ? Number(event.target.value) : null })}>
                <option value="">{t('Chưa phân công')}</option>
                {agents.map((agent) => <option key={agent.id} value={agent.id}>{agent.name}</option>)}
              </select>
            </label>
            <dl>
              <div><dt>{t('Danh mục')}</dt><dd>{t(categoryLabel(activeTicket.category))}</dd></div>
              <div><dt>{t('Người gửi')}</dt><dd>{activeTicket.requester.name}<small>{activeTicket.requester.email}</small></dd></div>
              <div><dt>{t('Cập nhật gần nhất')}</dt><dd>{formatDateTime(activeTicket.updatedAt, language)}</dd></div>
            </dl>
          </aside>
        ) : null}
      </div>

      {isCreateOpen ? (
        <div className="admin-dialog-backdrop" role="presentation">
          <section className="admin-dialog admin-dialog--helpdesk" role="dialog" aria-modal="true" aria-labelledby="helpdesk-create-title">
            <header>
              <div><h2 id="helpdesk-create-title">{t('Tạo yêu cầu hỗ trợ')}</h2><p>{t('Mô tả rõ tình huống để IT có thể hỗ trợ nhanh hơn.')}</p></div>
              <button type="button" onClick={() => !isCreating && setIsCreateOpen(false)} aria-label={t('Đóng')}><X size={21} /></button>
            </header>
            <form onSubmit={handleCreate}>
              <div className="admin-dialog__body admin-helpdesk__create-form">
                {createError ? <p className="admin-form-error" role="alert">{createError}</p> : null}
                <label><span>{t('Tiêu đề yêu cầu')} <b>*</b></span><input name="subject" required minLength={4} maxLength={180} placeholder={t('Ví dụ: Không truy cập được email công ty')} /></label>
                <div className="admin-helpdesk__create-grid">
                  <label><span>{t('Danh mục')} <b>*</b></span><select name="category" defaultValue="OTHER">{categoryOptions.map((option) => <option value={option.value} key={option.value}>{t(option.label)}</option>)}</select></label>
                  <label><span>{t('Mức độ ưu tiên')} <b>*</b></span><select name="priority" defaultValue="NORMAL">{priorityOptions.map((option) => <option value={option.value} key={option.value}>{t(option.label)}</option>)}</select></label>
                </div>
                <label><span>{t('Mô tả tình huống')} <b>*</b></span><textarea name="message" required minLength={4} maxLength={8000} rows={6} placeholder={t('Bạn gặp vấn đề gì, từ khi nào và đã thử cách nào?')} /></label>
              </div>
              <footer>
                <button className="admin-button" type="button" disabled={isCreating} onClick={() => setIsCreateOpen(false)}>{t('Hủy')}</button>
                <button className="admin-button admin-button--primary" type="submit" disabled={isCreating}>
                  {isCreating ? <CircleNotch className="is-spinning" size={18} /> : <PaperPlaneTilt size={17} weight="fill" />}{t(isCreating ? 'Đang gửi...' : 'Gửi yêu cầu')}
                </button>
              </footer>
            </form>
          </section>
        </div>
      ) : null}
    </section>
  )
}

function HelpdeskSkeleton() {
  return (
    <section className="admin-helpdesk admin-helpdesk--skeleton" role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">Đang tải Hỗ trợ IT</span>
      <header className="admin-helpdesk__skeleton-heading"><div><KhungXuong /><KhungXuong /></div><KhungXuong /></header>
      <div className="admin-helpdesk__workspace">
        <aside className="admin-helpdesk__queue"><KhungXuong className="admin-helpdesk__skeleton-search" />{Array.from({ length: 5 }, (_, index) => <div className="admin-helpdesk__skeleton-ticket" key={index}><KhungXuong /><KhungXuong /><KhungXuong /></div>)}</aside>
        <main className="admin-helpdesk__conversation"><ConversationSkeleton /></main>
        <aside className="admin-helpdesk__detail"><KhungXuong />{Array.from({ length: 4 }, (_, index) => <KhungXuong key={index} />)}</aside>
      </div>
    </section>
  )
}

function ConversationSkeleton() {
  return (
    <div className="admin-helpdesk__conversation-skeleton" aria-hidden="true">
      <header><KhungXuong /><KhungXuong /></header>
      <div><KhungXuong /><KhungXuong /><KhungXuong /><KhungXuong /></div>
      <KhungXuong />
    </div>
  )
}

function TicketStatusPill({ status, label }: { status: HelpdeskTicketStatus; label: string }) {
  return <span className={`admin-helpdesk__status admin-helpdesk__status--${status.toLocaleLowerCase('en-US').replaceAll('_', '-')}`}>{label}</span>
}

function WarningState() {
  return <span className="admin-helpdesk__warning" aria-hidden="true">!</span>
}

function replaceTicketInList(current: HelpdeskTicket[], ticket: HelpdeskTicket) {
  return [toTicketSummary(ticket), ...current.filter((item) => item.id !== ticket.id)]
    .sort((first, second) => Date.parse(second.lastMessageAt) - Date.parse(first.lastMessageAt))
}

function toTicketSummary(ticket: HelpdeskTicket) {
  const summary = { ...ticket }
  delete summary.messages
  return summary
}

function statusLabel(status: HelpdeskTicketStatus) {
  return statusOptions.find((option) => option.value === status)?.label ?? status
}

function priorityLabel(priority: HelpdeskTicketPriority) {
  return priorityOptions.find((option) => option.value === priority)?.label ?? priority
}

function categoryLabel(category: HelpdeskTicketCategory) {
  return categoryOptions.find((option) => option.value === category)?.label ?? category
}

function formatRelativeTime(value: string, language: 'vi' | 'en') {
  const minutes = Math.max(0, Math.round((Date.now() - Date.parse(value)) / 60_000))
  if (minutes < 1) return language === 'vi' ? 'Vừa xong' : 'Just now'
  if (minutes < 60) return language === 'vi' ? `${minutes} phút` : `${minutes} min`
  if (minutes < 1_440) return language === 'vi' ? `${Math.round(minutes / 60)} giờ` : `${Math.round(minutes / 60)} hr`
  return new Date(value).toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-GB', { day: '2-digit', month: '2-digit' })
}

function formatDateTime(value: string, language: 'vi' | 'en') {
  return new Date(value).toLocaleString(language === 'vi' ? 'vi-VN' : 'en-GB', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

function formatMessageTime(value: string, language: 'vi' | 'en') {
  return new Date(value).toLocaleTimeString(language === 'vi' ? 'vi-VN' : 'en-GB', {
    hour: '2-digit', minute: '2-digit',
  })
}

function initials(value: string) {
  return value.trim().split(/\s+/).slice(-2).map((part) => part[0]).join('').toLocaleUpperCase('vi') || '?'
}
