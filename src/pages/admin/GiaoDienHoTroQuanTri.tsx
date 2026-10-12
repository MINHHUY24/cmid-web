import {
  BookOpenText,
  CircleNotch,
  CheckCircle,
  Columns,
  CaretRight,
  ClipboardText,
  Clock,
  Eye,
  FunnelSimple,
  Headset,
  ListBullets,
  MagnifyingGlass,
  Plus,
  Star,
  WarningCircle,
  X,
} from '@phosphor-icons/react'
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { KhungXuong } from '../../components/common/KhungXuong'
import { useAdminAuth } from '../../contexts/useQuanTriAuth'
import {
  createHelpdeskTicket,
  deleteHelpdeskTicket,
  getHelpdeskOptions,
  getHelpdeskTicket,
  getHelpdeskTickets,
  sendHelpdeskInternalNote,
  sendHelpdeskMessage,
  updateHelpdeskTicket,
  type HelpdeskAgent,
  type HelpdeskMessage,
  type HelpdeskMessageType,
  type HelpdeskTeam,
  type HelpdeskTicket,
  type HelpdeskTicketCategory,
  type HelpdeskTicketPriority,
  type HelpdeskTicketStatus,
} from '../../services/helpdesk.service'
import { subscribeToHelpdeskEvents } from '../../services/helpdesk-realtime.service'
import { getLocalizedAdminError } from './ThongBaoLoiQuanTri'
import { HelpdeskKanban, HelpdeskList } from './HelpdeskBoardQuanTri'
import { HelpdeskTicketDetail } from './ChiTietHelpdeskQuanTri'
import { AdminDropdown } from './DropdownQuanTri'
import {
  categoryLabel,
  formatRelativeTime,
  helpdeskCategories,
  helpdeskPriorities,
  helpdeskStages,
  priorityLabel,
  priorityStars,
  stageLabel,
} from './helpdesk-utils'
import { useAdminCopy } from './NguCanhNgonNguQuanTri'
import { AdminModalPortal, AdminPageHeading } from './ThanhPhanCoBanQuanTri'
import { useHelpdeskNotifications } from './BoCucQuanTri'

type TicketScope = 'ALL' | 'MINE' | 'UNASSIGNED' | 'OVERDUE'
type HelpdeskViewMode = 'KANBAN' | 'LIST'

const quickGuideItems = [
  {
    id: 'software',
    label: 'Cài đặt hoặc lỗi phần mềm',
    description: 'Ghi rõ tên phần mềm, thông báo lỗi và thời điểm xảy ra để IT kiểm tra nhanh hơn.',
    steps: ['Thử đóng và mở lại phần mềm.', 'Chụp ảnh màn hình thông báo lỗi.', 'Tạo yêu cầu với danh mục “Phần mềm” và đính kèm ảnh nếu có.'],
  },
  {
    id: 'network',
    label: 'Kết nối mạng và thiết bị',
    description: 'Kiểm tra nhanh kết nối vật lý và thử lại trước khi gửi yêu cầu hỗ trợ.',
    steps: ['Kiểm tra Wi-Fi, dây mạng hoặc nguồn điện của thiết bị.', 'Thử kết nối bằng một trang web hay thiết bị khác.', 'Gửi yêu cầu thuộc danh mục “Mạng / kết nối” hoặc “Thiết bị”.'],
  },
  {
    id: 'account',
    label: 'Email, tài khoản và quyền truy cập',
    description: 'IT sẽ hỗ trợ khôi phục truy cập, phân quyền hoặc xử lý lỗi đăng nhập.',
    steps: ['Nêu địa chỉ email hoặc tên hệ thống cần truy cập.', 'Mô tả thao tác dẫn tới lỗi và nội dung thông báo.', 'Không gửi mật khẩu hoặc mã xác thực trong yêu cầu.'],
  },
  {
    id: 'follow-up',
    label: 'Theo dõi phản hồi trong yêu cầu',
    description: 'Mọi trao đổi với IT đều nằm trong chi tiết của từng yêu cầu.',
    steps: ['Theo dõi chấm thông báo trên ticket và số tại menu Hỗ trợ IT.', 'Mở ticket để xem phản hồi mới của IT.', 'Trả lời trong mục “Trao đổi” nếu cần bổ sung thông tin.'],
  },
] as const

export function AdminHelpdeskView({ onToast }: { onToast: (message: string) => void }) {
  const { adminUser } = useAdminAuth()
  const { language } = useAdminCopy()
  const { unreadTicketIds, markTicketAsRead } = useHelpdeskNotifications()
  const [tickets, setTickets] = useState<HelpdeskTicket[]>([])
  const [activeTicketId, setActiveTicketId] = useState<string | null>(() => getTicketIdFromUrl())
  const [activeTicket, setActiveTicket] = useState<HelpdeskTicket | null>(null)
  const [agents, setAgents] = useState<HelpdeskAgent[]>([])
  const [teams, setTeams] = useState<HelpdeskTeam[]>([])
  const [canManage, setCanManage] = useState(false)
  const [viewMode, setViewMode] = useState<HelpdeskViewMode>(() => (
    typeof window !== 'undefined' && window.matchMedia('(max-width: 720px)').matches ? 'LIST' : 'KANBAN'
  ))
  const [scope, setScope] = useState<TicketScope>('ALL')
  const [search, setSearch] = useState('')
  const [stageFilter, setStageFilter] = useState<HelpdeskTicketStatus | 'ALL'>('ALL')
  const [priorityFilter, setPriorityFilter] = useState<HelpdeskTicketPriority | 'ALL'>('ALL')
  const [categoryFilter, setCategoryFilter] = useState<HelpdeskTicketCategory | 'ALL'>('ALL')
  const [createdDateFilter, setCreatedDateFilter] = useState('')
  const [assigneeFilter, setAssigneeFilter] = useState<'ALL' | 'UNASSIGNED' | string>('ALL')
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingTicket, setIsLoadingTicket] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [isDeletingTicket, setIsDeletingTicket] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [listError, setListError] = useState<string | null>(null)
  const [detailError, setDetailError] = useState<string | null>(null)
  const [createError, setCreateError] = useState<string | null>(null)
  const requestSequence = useRef(0)
  const loadingTicketSequence = useRef(0)
  const filterPopoverRef = useRef<HTMLDivElement>(null)
  const unreadTicketIdSet = useMemo(() => new Set(unreadTicketIds), [unreadTicketIds])

  const loadTickets = useCallback(async () => {
    setIsLoading(true)
    setListError(null)
    try {
      const result = await getHelpdeskTickets()
      setCanManage(result.canManage)
      setTickets(result.tickets.map(toTicketSummary))
    } catch (error) {
      setListError(getLocalizedAdminError(error, language, 'Không thể tải yêu cầu hỗ trợ.'))
    } finally {
      setIsLoading(false)
    }
  }, [language])

  const loadTicket = useCallback(async (id: string, { silent = false }: { silent?: boolean } = {}) => {
    const sequence = ++requestSequence.current
    if (!silent) {
      loadingTicketSequence.current = sequence
      setIsLoadingTicket(true)
      setDetailError(null)
      setActiveTicket(null)
    }
    try {
      const result = await getHelpdeskTicket(id)
      if (sequence !== requestSequence.current) return
      setCanManage(result.canManage)
      setActiveTicket(result.ticket)
      setTickets((current) => replaceTicketInList(current, result.ticket))
    } catch (error) {
      if (!silent && sequence === requestSequence.current) setDetailError(getLocalizedAdminError(error, language, 'Không thể tải chi tiết yêu cầu hỗ trợ.'))
    } finally {
      if (!silent && loadingTicketSequence.current === sequence) setIsLoadingTicket(false)
    }
  }, [language])

  useEffect(() => {
    const request = window.setTimeout(() => { void loadTickets() }, 0)
    return () => window.clearTimeout(request)
  }, [loadTickets])

  useEffect(() => {
    if (!isFilterOpen) return

    const closeWhenClickingOutside = (event: PointerEvent) => {
      if (!filterPopoverRef.current?.contains(event.target as Node)) setIsFilterOpen(false)
    }

    document.addEventListener('pointerdown', closeWhenClickingOutside)
    return () => document.removeEventListener('pointerdown', closeWhenClickingOutside)
  }, [isFilterOpen])

  useEffect(() => {
    if (!activeTicketId) return
    const request = window.setTimeout(() => { void loadTicket(activeTicketId) }, 0)
    return () => window.clearTimeout(request)
  }, [activeTicketId, loadTicket])

  useEffect(() => {
    if (!adminUser) return

    return subscribeToHelpdeskEvents((event) => {
      if (event.type === 'ticket.deleted' && event.ticketId) {
        setTickets((current) => current.filter((ticket) => ticket.id !== event.ticketId))
        if (activeTicketId === event.ticketId) {
          requestSequence.current += 1
          setActiveTicketId(null)
          setActiveTicket(null)
          setDetailError(null)
          updateTicketUrl(null, 'replace')
        }
        return
      }

      const ticket = event.ticket
      if (!ticket) return
      setTickets((current) => replaceTicketInList(current, ticket))

      // A board update intentionally contains only a safe summary. If this is
      // the ticket currently open, get its latest permitted conversation and
      // details through the normal authenticated endpoint.
      if (activeTicketId === ticket.id) void loadTicket(ticket.id, { silent: true })
    })
  }, [activeTicketId, adminUser, loadTicket])

  useEffect(() => {
    if (!canManage) return
    let isCurrent = true
    void getHelpdeskOptions()
      .then((options) => {
        if (!isCurrent) return
        setAgents(options.agents)
        setTeams(options.teams)
      })
      .catch(() => {
        if (!isCurrent) return
        setAgents([])
        setTeams([])
      })
    return () => { isCurrent = false }
  }, [canManage])

  useEffect(() => {
    const media = window.matchMedia('(max-width: 720px)')
    const setMobileDefault = (event: MediaQueryListEvent) => {
      if (event.matches) setViewMode('LIST')
    }
    media.addEventListener('change', setMobileDefault)
    return () => media.removeEventListener('change', setMobileDefault)
  }, [])

  useEffect(() => {
    const syncSelectedTicket = () => setActiveTicketId(getTicketIdFromUrl())
    window.addEventListener('popstate', syncSelectedTicket)
    return () => window.removeEventListener('popstate', syncSelectedTicket)
  }, [])

  useEffect(() => {
    if (!activeTicketId && !isCreateOpen) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = previousOverflow }
  }, [activeTicketId, isCreateOpen])

  const filteredTickets = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('vi')
    const currentUserId = String(adminUser?.id ?? '')
    return tickets.filter((ticket) => {
      if (scope === 'MINE') {
        const relatedUser = canManage ? ticket.assignee?.id : ticket.requester.id
        if (relatedUser !== currentUserId) return false
      }
      if (scope === 'UNASSIGNED' && ticket.assignee) return false
      if (scope === 'OVERDUE' && ticket.slaStatus !== 'OVERDUE') return false
      if (stageFilter !== 'ALL' && ticket.status !== stageFilter) return false
      if (priorityFilter !== 'ALL' && ticket.priority !== priorityFilter) return false
      if (categoryFilter !== 'ALL' && ticket.category !== categoryFilter) return false
      if (createdDateFilter && ticket.createdAt.slice(0, 10) !== createdDateFilter) return false
      if (assigneeFilter === 'UNASSIGNED' && ticket.assignee) return false
      if (assigneeFilter !== 'ALL' && assigneeFilter !== 'UNASSIGNED' && ticket.assignee?.id !== assigneeFilter) return false
      if (!query) return true
      return [ticket.code, ticket.subject, ticket.requester.name, ticket.assignee?.name ?? '']
        .some((value) => value.toLocaleLowerCase('vi').includes(query))
    })
  }, [adminUser?.id, assigneeFilter, canManage, categoryFilter, createdDateFilter, priorityFilter, scope, search, stageFilter, tickets])

  const scopeCounts = useMemo(() => {
    const currentUserId = String(adminUser?.id ?? '')
    return {
      ALL: tickets.length,
      MINE: tickets.filter((ticket) => (canManage ? ticket.assignee?.id : ticket.requester.id) === currentUserId).length,
      UNASSIGNED: tickets.filter((ticket) => !ticket.assignee).length,
      OVERDUE: tickets.filter((ticket) => ticket.slaStatus === 'OVERDUE').length,
    } satisfies Record<TicketScope, number>
  }, [adminUser?.id, canManage, tickets])

  const replaceTicket = useCallback((ticket: HelpdeskTicket) => {
    setActiveTicket(ticket)
    setTickets((current) => replaceTicketInList(current, ticket))
  }, [])

  async function handleCreate(input: {
    subject: string
    category: HelpdeskTicketCategory
    priority: HelpdeskTicketPriority
    description: string
  }) {
    setIsCreating(true)
    setCreateError(null)
    try {
      const result = await createHelpdeskTicket(input)
      replaceTicket(result.ticket)
      setIsCreateOpen(false)
      onToast('Đã tạo yêu cầu hỗ trợ.')
      return true
    } catch (error) {
      setCreateError(getLocalizedAdminError(error, language, 'Không thể tạo yêu cầu hỗ trợ.'))
      return false
    } finally {
      setIsCreating(false)
    }
  }

  async function handleTicketUpdate(ticket: HelpdeskTicket, patch: {
    status?: HelpdeskTicketStatus
    priority?: HelpdeskTicketPriority
    assigneeId?: number | null
    teamId?: string | null
  }, optimistic = false) {
    const previousTicket = ticket
    const provisional = optimistic ? {
      ...ticket,
      ...patch,
      updatedAt: new Date().toISOString(),
      assignee: patch.assigneeId === undefined ? ticket.assignee : agents.find((agent) => agent.id === String(patch.assigneeId)) ?? null,
      team: patch.teamId === undefined ? ticket.team : teams.find((team) => team.id === patch.teamId) ?? null,
    } : null

    if (provisional) {
      setTickets((current) => replaceTicketInList(current, provisional))
      if (activeTicket?.id === ticket.id) setActiveTicket(provisional)
    }

    setIsUpdating(true)
    setDetailError(null)
    try {
      const result = await updateHelpdeskTicket(ticket.id, patch)
      replaceTicket(result.ticket)
      return true
    } catch (error) {
      if (provisional) {
        setTickets((current) => replaceTicketInList(current, previousTicket))
        if (activeTicket?.id === ticket.id) setActiveTicket(previousTicket)
      }
      const message = getLocalizedAdminError(error, language, 'Không thể cập nhật yêu cầu hỗ trợ.')
      setDetailError(message)
      onToast(message)
      return false
    } finally {
      setIsUpdating(false)
    }
  }

  async function handleDetailUpdate(patch: {
    status?: HelpdeskTicketStatus
    priority?: HelpdeskTicketPriority
    assigneeId?: number | null
    teamId?: string | null
  }) {
    if (!activeTicket) return
    await handleTicketUpdate(activeTicket, patch, true)
  }

  async function handleDeleteTicket(): Promise<boolean> {
    if (!activeTicket) return false
    setIsDeletingTicket(true)
    setDetailError(null)
    try {
      await deleteHelpdeskTicket(activeTicket.id)
      setTickets((current) => current.filter((ticket) => ticket.id !== activeTicket.id))
      closeDetail()
      onToast(`Đã xóa yêu cầu ${activeTicket.code}.`)
      return true
    } catch (error) {
      const message = getLocalizedAdminError(error, language, 'Không thể xóa yêu cầu hỗ trợ.')
      setDetailError(message)
      onToast(message)
      return false
    } finally {
      setIsDeletingTicket(false)
    }
  }

  async function handleSend(type: HelpdeskMessageType, content: string) {
    if (!activeTicket) return false
    const previousTicket = activeTicket
    const createdAt = new Date().toISOString()
    const provisionalMessage: HelpdeskMessage = {
      id: `local-${Date.now()}`,
      senderId: adminUser?.id ?? null,
      senderName: adminUser?.name ?? activeTicket.requester.name,
      type,
      content,
      createdAt,
      attachments: [],
    }
    const provisionalTicket: HelpdeskTicket = {
      ...activeTicket,
      messages: [...(activeTicket.messages ?? []), provisionalMessage],
      lastMessage: provisionalMessage,
      lastMessageAt: createdAt,
      updatedAt: createdAt,
    }

    // Render the sender's message immediately. The server response replaces
    // this local item with the persisted record, while the SSE event refreshes
    // other viewers quietly in the background.
    setActiveTicket(provisionalTicket)
    setTickets((current) => replaceTicketInList(current, provisionalTicket))
    setIsSending(true)
    setDetailError(null)
    try {
      const result = type === 'INTERNAL_NOTE'
        ? await sendHelpdeskInternalNote(activeTicket.id, content)
        : await sendHelpdeskMessage(activeTicket.id, content)
      replaceTicket(result.ticket)
      return true
    } catch (error) {
      setActiveTicket(previousTicket)
      setTickets((current) => replaceTicketInList(current, previousTicket))
      setDetailError(getLocalizedAdminError(error, language, 'Không thể gửi phản hồi.'))
      return false
    } finally {
      setIsSending(false)
    }
  }

  function closeDetail() {
    requestSequence.current += 1
    setActiveTicketId(null)
    setActiveTicket(null)
    setDetailError(null)
    updateTicketUrl(null, 'replace')
  }

  function openDetail(ticketId: string) {
    markTicketAsRead(ticketId)
    setActiveTicketId(ticketId)
    updateTicketUrl(ticketId)
  }

  function clearFilters() {
    setStageFilter('ALL')
    setPriorityFilter('ALL')
    setCategoryFilter('ALL')
    setCreatedDateFilter('')
    setAssigneeFilter('ALL')
  }

  if (isLoading) return <HelpdeskSkeleton />

  if (listError) {
    return (
      <section className="admin-helpdesk-state" role="alert">
        <Headset size={30} weight="thin" aria-hidden="true" />
        <div><h1>Không thể tải Hỗ trợ IT</h1><p>{listError}</p></div>
        <button className="admin-button admin-button--primary" type="button" onClick={() => void loadTickets()}>Thử lại</button>
      </section>
    )
  }

  const scopeOptions: Array<{ value: TicketScope; label: string }> = canManage
    ? [
        { value: 'ALL', label: 'Tất cả' },
        { value: 'MINE', label: 'Của tôi' },
        { value: 'UNASSIGNED', label: 'Chưa phân công' },
        { value: 'OVERDUE', label: 'Quá hạn' },
      ]
    : [
        { value: 'ALL', label: 'Tất cả' },
        { value: 'MINE', label: 'Của tôi' },
        { value: 'OVERDUE', label: 'Quá hạn' },
      ]

  return (
    <section className="admin-helpdesk-workspace">
      <AdminPageHeading
        title="Hỗ trợ IT"
        description={canManage ? 'Quản lý, phân công và theo dõi các yêu cầu hỗ trợ nội bộ.' : 'Gửi yêu cầu hỗ trợ và theo dõi trạng thái xử lý của bạn.'}
        action={canManage ? (
          <button className="admin-button admin-button--primary" type="button" onClick={() => { setCreateError(null); setIsCreateOpen(true) }}>
            <Plus size={17} weight="bold" /> Tạo yêu cầu
          </button>
        ) : undefined}
      />

      {canManage ? (
        <section className="admin-helpdesk-searchable-workspace" aria-label="Danh sách yêu cầu hỗ trợ">
          <div className="admin-helpdesk-toolbar">
            <div className="admin-helpdesk-toolbar__scopes" role="group" aria-label="Phạm vi yêu cầu">
              {scopeOptions.map((item) => (
                <button aria-pressed={scope === item.value} className={scope === item.value ? 'is-active' : ''} key={item.value} onClick={() => setScope(item.value)} type="button">
                  {item.label} <b>{scopeCounts[item.value]}</b>
                </button>
              ))}
            </div>
            <label className="admin-helpdesk-toolbar__search">
              <MagnifyingGlass size={17} aria-hidden="true" />
              <span className="sr-only">Tìm kiếm yêu cầu hỗ trợ</span>
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm mã, tiêu đề hoặc nhân sự" />
            </label>
            <HelpdeskFilter
              agents={agents}
              assigneeFilter={assigneeFilter}
              canManage={canManage}
              categoryFilter={categoryFilter}
              clearFilters={clearFilters}
              createdDateFilter={createdDateFilter}
              filterPopoverRef={filterPopoverRef}
              isFilterOpen={isFilterOpen}
              onAssigneeChange={setAssigneeFilter}
              onCategoryChange={setCategoryFilter}
              onCreatedDateChange={setCreatedDateFilter}
              onPriorityChange={setPriorityFilter}
              onStageChange={setStageFilter}
              onToggle={() => setIsFilterOpen((current) => !current)}
              priorityFilter={priorityFilter}
              stageFilter={stageFilter}
            />
            <div className="admin-helpdesk-toolbar__views" role="group" aria-label="Chế độ hiển thị">
              <button aria-pressed={viewMode === 'KANBAN'} className={viewMode === 'KANBAN' ? 'is-active' : ''} onClick={() => setViewMode('KANBAN')} type="button"><Columns size={17} /> Cột</button>
              <button aria-pressed={viewMode === 'LIST'} className={viewMode === 'LIST' ? 'is-active' : ''} onClick={() => setViewMode('LIST')} type="button"><ListBullets size={17} /> Danh sách</button>
            </div>
          </div>

          {viewMode === 'KANBAN' ? (
            <HelpdeskKanban
              canManage={canManage}
              language={language}
              onCreate={() => setIsCreateOpen(true)}
              onMove={(ticket, status) => void handleTicketUpdate(ticket, { status }, true)}
              onOpen={openDetail}
              onPriorityChange={(ticket, priority) => void handleTicketUpdate(ticket, { priority }, true)}
              tickets={filteredTickets}
              unreadTicketIds={unreadTicketIdSet}
            />
          ) : <HelpdeskList language={language} onOpen={openDetail} tickets={filteredTickets} unreadTicketIds={unreadTicketIdSet} />}
        </section>
      ) : (
        <EmployeeHelpdeskDashboard
          categoryFilter={categoryFilter}
          clearFilters={clearFilters}
          createdDateFilter={createdDateFilter}
          filterPopoverRef={filterPopoverRef}
          filteredTickets={filteredTickets}
          isFilterOpen={isFilterOpen}
          language={language}
          onCategoryChange={setCategoryFilter}
          onCreatedDateChange={setCreatedDateFilter}
          onCreate={() => { setCreateError(null); setIsCreateOpen(true) }}
          onOpen={openDetail}
          onPriorityChange={setPriorityFilter}
          onStageChange={setStageFilter}
          onToggleFilter={() => setIsFilterOpen((current) => !current)}
          priorityFilter={priorityFilter}
          search={search}
          stageFilter={stageFilter}
          tickets={tickets}
          unreadTicketIds={unreadTicketIdSet}
          onSearchChange={setSearch}
        />
      )}

      {activeTicketId ? (
        <AdminModalPortal>
          <div className="admin-helpdesk-detail-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) closeDetail() }}>
            {isLoadingTicket ? <HelpdeskDetailSkeleton /> : null}
            {!isLoadingTicket && activeTicket ? (
              <HelpdeskTicketDetail
                agents={agents}
                canManage={canManage}
                currentUserId={adminUser?.id ?? null}
                error={detailError}
                isDeleting={isDeletingTicket}
                isSending={isSending}
                isUpdating={isUpdating}
                key={activeTicket.id}
                language={language}
                onClose={closeDetail}
                onDelete={handleDeleteTicket}
                onSend={handleSend}
                onUpdate={handleDetailUpdate}
                teams={teams}
                ticket={activeTicket}
              />
            ) : null}
            {!isLoadingTicket && !activeTicket ? (
              <section className="admin-helpdesk-detail-error" role="alert">
                <Headset size={29} weight="thin" /><strong>Không thể tải chi tiết yêu cầu</strong><p>{detailError ?? 'Vui lòng thử lại.'}</p>
                <button className="admin-button" type="button" onClick={() => void loadTicket(activeTicketId)}>Thử lại</button>
              </section>
            ) : null}
          </div>
        </AdminModalPortal>
      ) : null}

      {isCreateOpen ? (
        <CreateTicketDialog
          error={createError}
          isCreating={isCreating}
          onClose={() => !isCreating && setIsCreateOpen(false)}
          onCreate={handleCreate}
        />
      ) : null}
    </section>
  )
}

type HelpdeskFilterProps = {
  agents: HelpdeskAgent[]
  assigneeFilter: 'ALL' | 'UNASSIGNED' | string
  canManage: boolean
  categoryFilter: HelpdeskTicketCategory | 'ALL'
  clearFilters: () => void
  createdDateFilter: string
  filterPopoverRef: { current: HTMLDivElement | null }
  isFilterOpen: boolean
  onAssigneeChange: (value: 'ALL' | 'UNASSIGNED' | string) => void
  onCategoryChange: (value: HelpdeskTicketCategory | 'ALL') => void
  onCreatedDateChange: (value: string) => void
  onPriorityChange: (value: HelpdeskTicketPriority | 'ALL') => void
  onStageChange: (value: HelpdeskTicketStatus | 'ALL') => void
  onToggle: () => void
  priorityFilter: HelpdeskTicketPriority | 'ALL'
  stageFilter: HelpdeskTicketStatus | 'ALL'
}

function HelpdeskFilter({
  agents,
  assigneeFilter,
  canManage,
  categoryFilter,
  clearFilters,
  createdDateFilter,
  filterPopoverRef,
  isFilterOpen,
  onAssigneeChange,
  onCategoryChange,
  onCreatedDateChange,
  onPriorityChange,
  onStageChange,
  onToggle,
  priorityFilter,
  stageFilter,
}: HelpdeskFilterProps) {
  return (
    <div className="admin-helpdesk-toolbar__filter-wrap" ref={filterPopoverRef}>
      <button aria-expanded={isFilterOpen} className={`admin-helpdesk-toolbar__filter${isFilterOpen ? ' is-active' : ''}`} onClick={onToggle} type="button">
        <FunnelSimple size={17} /> Lọc
      </button>
      {isFilterOpen ? (
        <div className="admin-helpdesk-filter-popover">
          <label><span>Giai đoạn</span><AdminDropdown ariaLabel="Lọc theo giai đoạn" onChange={(value) => onStageChange(value as HelpdeskTicketStatus | 'ALL')} options={[{ value: 'ALL', label: 'Tất cả' }, ...helpdeskStages]} value={stageFilter} /></label>
          <label><span>Ưu tiên</span><AdminDropdown ariaLabel="Lọc theo ưu tiên" onChange={(value) => onPriorityChange(value as HelpdeskTicketPriority | 'ALL')} options={[{ value: 'ALL', label: 'Tất cả' }, ...helpdeskPriorities]} value={priorityFilter} /></label>
          <label><span>Danh mục</span><AdminDropdown ariaLabel="Lọc theo danh mục" onChange={(value) => onCategoryChange(value as HelpdeskTicketCategory | 'ALL')} options={[{ value: 'ALL', label: 'Tất cả' }, ...helpdeskCategories.map((category) => ({ value: category.value, label: categoryLabel(category.value) }))]} value={categoryFilter} /></label>
          {canManage ? <label><span>Người phụ trách</span><AdminDropdown ariaLabel="Lọc theo người phụ trách" onChange={onAssigneeChange} options={[{ value: 'ALL', label: 'Tất cả' }, { value: 'UNASSIGNED', label: 'Chưa phân công' }, ...agents.map((agent) => ({ value: agent.id, label: agent.name }))]} value={assigneeFilter} /></label> : null}
          <label><span>Ngày tạo</span><input type="date" value={createdDateFilter} onChange={(event) => onCreatedDateChange(event.target.value)} /></label>
          <button type="button" onClick={clearFilters}>Xóa bộ lọc</button>
        </div>
      ) : null}
    </div>
  )
}

function EmployeeHelpdeskDashboard({
  categoryFilter,
  clearFilters,
  createdDateFilter,
  filterPopoverRef,
  filteredTickets,
  isFilterOpen,
  language,
  onCategoryChange,
  onCreatedDateChange,
  onCreate,
  onOpen,
  onPriorityChange,
  onSearchChange,
  onStageChange,
  onToggleFilter,
  priorityFilter,
  search,
  stageFilter,
  tickets,
  unreadTicketIds,
}: {
  categoryFilter: HelpdeskTicketCategory | 'ALL'
  clearFilters: () => void
  createdDateFilter: string
  filterPopoverRef: { current: HTMLDivElement | null }
  filteredTickets: HelpdeskTicket[]
  isFilterOpen: boolean
  language: 'vi' | 'en'
  onCategoryChange: (value: HelpdeskTicketCategory | 'ALL') => void
  onCreatedDateChange: (value: string) => void
  onCreate: () => void
  onOpen: (id: string) => void
  onPriorityChange: (value: HelpdeskTicketPriority | 'ALL') => void
  onSearchChange: (value: string) => void
  onStageChange: (value: HelpdeskTicketStatus | 'ALL') => void
  onToggleFilter: () => void
  priorityFilter: HelpdeskTicketPriority | 'ALL'
  search: string
  stageFilter: HelpdeskTicketStatus | 'ALL'
  tickets: HelpdeskTicket[]
  unreadTicketIds: Set<string>
}) {
  const activeTickets = tickets.filter((ticket) => !['RESOLVED', 'CLOSED'].includes(ticket.status)).length
  const completedTickets = tickets.filter((ticket) => ['RESOLVED', 'CLOSED'].includes(ticket.status)).length
  const [openQuickGuide, setOpenQuickGuide] = useState<string | null>(null)

  return (
    <div className="admin-helpdesk-employee">
      <div className="admin-helpdesk-employee__overview">
        <div className="admin-helpdesk-employee__metrics" aria-label="Tóm tắt yêu cầu hỗ trợ">
          <EmployeeMetric icon={<ClipboardText size={25} weight="duotone" />} label="Tổng yêu cầu" value={tickets.length} helper="Tất cả yêu cầu của bạn" tone="gold" />
          <EmployeeMetric icon={<Clock size={25} weight="duotone" />} label="Đang xử lý" value={activeTickets} helper="Đang chờ IT hoặc bạn phản hồi" tone="blue" />
          <EmployeeMetric icon={<CheckCircle size={25} weight="duotone" />} label="Đã hoàn tất" value={completedTickets} helper="Đã giải quyết hoặc đã đóng" tone="green" />
        </div>

        <aside className="admin-helpdesk-employee__create-callout">
          <span className="admin-helpdesk-employee__callout-icon"><Headset size={28} weight="duotone" /></span>
          <div><h2>Tạo yêu cầu hỗ trợ</h2><p>Gặp sự cố? Gửi đủ thông tin để IT tiếp nhận nhanh hơn.</p></div>
          <button className="admin-button admin-button--primary" type="button" onClick={onCreate}><Plus size={17} weight="bold" /> Tạo yêu cầu mới</button>
        </aside>
      </div>

      <div className="admin-helpdesk-employee__content">
        <section className="admin-helpdesk-employee__tickets" aria-labelledby="employee-tickets-title">
          <header className="admin-helpdesk-employee__tickets-header">
            <div><h2 id="employee-tickets-title">Yêu cầu của tôi</h2><p>Chỉ hiển thị các yêu cầu do bạn gửi.</p></div>
            {tickets.length ? <span>{tickets.length} yêu cầu</span> : null}
          </header>
          <div className="admin-helpdesk-employee__ticket-tools">
            <label className="admin-helpdesk-toolbar__search">
              <MagnifyingGlass size={18} aria-hidden="true" />
              <span className="sr-only">Tìm trong yêu cầu của tôi</span>
              <input value={search} onChange={(event) => onSearchChange(event.target.value)} placeholder="Tìm theo mã yêu cầu hoặc tiêu đề…" />
            </label>
            <HelpdeskFilter
              agents={[]}
              assigneeFilter="ALL"
              canManage={false}
              categoryFilter={categoryFilter}
              clearFilters={clearFilters}
              createdDateFilter={createdDateFilter}
              filterPopoverRef={filterPopoverRef}
              isFilterOpen={isFilterOpen}
              onAssigneeChange={() => undefined}
              onCategoryChange={onCategoryChange}
              onCreatedDateChange={onCreatedDateChange}
              onPriorityChange={onPriorityChange}
              onStageChange={onStageChange}
              onToggle={onToggleFilter}
              priorityFilter={priorityFilter}
              stageFilter={stageFilter}
            />
          </div>

          {filteredTickets.length ? (
            <div className="admin-helpdesk-employee__table-wrap">
              <div className="admin-helpdesk-employee__table" role="table" aria-label="Yêu cầu hỗ trợ của tôi">
                <div className="admin-helpdesk-employee__table-head" role="row">
                  <span role="columnheader">Mã yêu cầu</span><span role="columnheader">Tiêu đề</span><span role="columnheader">Danh mục</span><span role="columnheader">Ưu tiên</span><span role="columnheader">Trạng thái</span><span role="columnheader">Cập nhật</span><span role="columnheader">Thao tác</span>
                </div>
                <div role="rowgroup">
                  {filteredTickets.map((ticket) => {
                    const hasUnreadReply = unreadTicketIds.has(ticket.id)
                    return (
                    <div className={`admin-helpdesk-employee__table-row${hasUnreadReply ? ' is-unread' : ''}`} key={ticket.id} role="row">
                      <span aria-label={hasUnreadReply ? `${ticket.code}, có phản hồi IT mới` : undefined} className="admin-helpdesk-employee__ticket-code" role="cell">
                        {ticket.code}{hasUnreadReply ? <i aria-hidden="true" /> : null}
                      </span>
                      <strong role="cell" title={ticket.subject}>{ticket.subject}</strong>
                      <span role="cell"><span className="admin-helpdesk-employee__category">{categoryLabel(ticket.category)}</span></span>
                      <span className={`admin-helpdesk-employee__priority is-${ticket.priority.toLocaleLowerCase('en-US')}`} role="cell"><span>{[1, 2, 3].map((value) => <Star key={value} size={14} weight={value <= priorityStars(ticket.priority) ? 'fill' : 'regular'} aria-hidden="true" />)}</span><small>{priorityLabel(ticket.priority)}</small></span>
                      <span role="cell"><span className={`admin-helpdesk-stage admin-helpdesk-stage--${ticket.status.toLocaleLowerCase('en-US').replaceAll('_', '-')}`}>{stageLabel(ticket.status)}</span></span>
                      <time role="cell" dateTime={ticket.updatedAt}>{formatRelativeTime(ticket.updatedAt, language)}</time>
                      <span role="cell"><button className="admin-helpdesk-employee__view" type="button" onClick={() => onOpen(ticket.id)}><Eye size={15} /> Xem</button></span>
                    </div>
                    )
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className={`admin-helpdesk-employee__empty${tickets.length ? ' is-filtered' : ' is-pristine'}`}>
              {!tickets.length ? <Headset size={34} weight="duotone" aria-hidden="true" /> : null}
              <strong>{tickets.length ? 'Không tìm thấy yêu cầu phù hợp.' : 'Bạn chưa có yêu cầu hỗ trợ nào.'}</strong>
              {tickets.length ? <p>Thử điều chỉnh từ khóa hoặc bộ lọc.</p> : null}
            </div>
          )}
        </section>

        <aside className="admin-helpdesk-employee__aside">
          <section className="admin-helpdesk-employee__guide">
            <header><BookOpenText size={23} weight="duotone" /><h2>Hướng dẫn nhanh</h2></header>
            <ul>
              {quickGuideItems.map((item) => {
                const isOpen = openQuickGuide === item.id
                const contentId = `helpdesk-guide-${item.id}`
                return (
                  <li className={isOpen ? 'is-open' : ''} key={item.id}>
                    <button
                      aria-controls={contentId}
                      aria-expanded={isOpen}
                      type="button"
                      onClick={() => setOpenQuickGuide((current) => current === item.id ? null : item.id)}
                    >
                      <span>{item.label}</span><CaretRight size={16} aria-hidden="true" />
                    </button>
                    <div aria-hidden={!isOpen} className="admin-helpdesk-employee__guide-content" id={contentId}>
                      <div className="admin-helpdesk-employee__guide-content-inner">
                        <p>{item.description}</p>
                        <ol>{item.steps.map((step) => <li key={step}>{step}</li>)}</ol>
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          </section>
          <section className="admin-helpdesk-employee__urgent">
            <header><WarningCircle size={23} weight="duotone" /><h2>Sự cố khẩn cấp</h2></header>
            <p>Nếu sự cố ảnh hưởng trực tiếp đến công việc, hãy chọn mức <strong>Khẩn cấp</strong> và mô tả rõ mức độ ảnh hưởng.</p>
          </section>
        </aside>
      </div>
    </div>
  )
}

function EmployeeMetric({ icon, label, value, helper, tone }: { icon: ReactNode; label: string; value: number; helper: string; tone: 'gold' | 'blue' | 'green' }) {
  return <article className={`admin-helpdesk-employee__metric is-${tone}`}><span>{icon}</span><div><small>{label}</small><strong>{value}</strong><p>{helper}</p></div></article>
}

function CreateTicketDialog({
  error,
  isCreating,
  onClose,
  onCreate,
}: {
  error: string | null
  isCreating: boolean
  onClose: () => void
  onCreate: (input: { subject: string; category: HelpdeskTicketCategory; priority: HelpdeskTicketPriority; description: string }) => Promise<boolean>
}) {
  const [priority, setPriority] = useState<HelpdeskTicketPriority>('LOW')
  const [category, setCategory] = useState<HelpdeskTicketCategory>('OTHER')

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const subject = String(formData.get('subject') ?? '').trim()
    const description = String(formData.get('description') ?? '').trim()
    if (!subject || !description) return
    await onCreate({ subject, category, priority, description })
  }

  return (
    <AdminModalPortal>
      <div className="admin-dialog-backdrop" role="presentation">
        <section className="admin-dialog admin-dialog--helpdesk-create" aria-labelledby="helpdesk-create-title" aria-modal="true" role="dialog">
        <header>
          <div><h2 id="helpdesk-create-title">Tạo yêu cầu hỗ trợ</h2><p>Gửi đủ thông tin để bộ phận IT tiếp nhận và xử lý.</p></div>
          <button type="button" disabled={isCreating} onClick={onClose} aria-label="Đóng"><X size={21} /></button>
        </header>
        <form onSubmit={submit}>
          <div className="admin-dialog__body admin-helpdesk-create-form">
            {error ? <p className="admin-form-error" role="alert">{error}</p> : null}
            <label><span>Tiêu đề <b>*</b></span><input name="subject" required minLength={4} maxLength={180} placeholder="Ví dụ: Không truy cập được email công ty" /></label>
            <div className="admin-helpdesk-create-form__dropdown">
              <span>Danh mục <b>*</b></span>
              <AdminDropdown
                ariaLabel="Chọn danh mục yêu cầu"
                onChange={setCategory}
                options={helpdeskCategories}
                value={category}
              />
            </div>
            <fieldset className="admin-helpdesk-create-priority"><legend>Mức độ ưu tiên</legend><div>{helpdeskPriorities.map((item) => <button type="button" className={priority === item.value ? 'is-selected' : ''} aria-pressed={priority === item.value} key={item.value} onClick={() => setPriority(item.value)}>{item.label}</button>)}</div></fieldset>
            <label><span>Mô tả <b>*</b></span><textarea name="description" required minLength={4} maxLength={8000} rows={7} placeholder="Bạn gặp vấn đề gì, từ khi nào và đã thử cách nào?" /></label>
          </div>
          <footer>
            <button className="admin-button" disabled={isCreating} type="button" onClick={onClose}>Hủy</button>
            <button className="admin-button admin-button--primary" disabled={isCreating} type="submit">{isCreating ? <CircleNotch className="is-spinning" size={17} /> : <Plus size={17} weight="bold" />} {isCreating ? 'Đang tạo...' : 'Tạo yêu cầu'}</button>
          </footer>
        </form>
        </section>
      </div>
    </AdminModalPortal>
  )
}

function HelpdeskSkeleton() {
  return (
    <section className="admin-helpdesk-workspace admin-helpdesk-workspace--skeleton" aria-busy="true" role="status">
      <span className="sr-only">Đang tải Hỗ trợ IT</span>
      <div className="admin-helpdesk-skeleton-heading"><KhungXuong /><KhungXuong /></div>
      <div className="admin-helpdesk-skeleton-toolbar"><KhungXuong /><KhungXuong /><KhungXuong /></div>
      <div className="admin-helpdesk-skeleton-board">{Array.from({ length: 5 }, (_, index) => <div key={index}><KhungXuong />{Array.from({ length: index % 2 + 1 }, (_, cardIndex) => <KhungXuong key={cardIndex} />)}</div>)}</div>
    </section>
  )
}

function HelpdeskDetailSkeleton() {
  return (
    <section className="admin-helpdesk-detail-drawer admin-helpdesk-detail-drawer--skeleton" aria-busy="true" role="status">
      <span className="sr-only">Đang tải chi tiết yêu cầu</span>
      {Array.from({ length: 8 }, (_, index) => <KhungXuong key={index} />)}
    </section>
  )
}

function toTicketSummary(ticket: HelpdeskTicket) {
  const summary = { ...ticket }
  delete summary.messages
  delete summary.attachments
  return summary
}

function replaceTicketInList(current: HelpdeskTicket[], ticket: HelpdeskTicket) {
  return [toTicketSummary(ticket), ...current.filter((item) => item.id !== ticket.id)]
    .sort((first, second) => Date.parse(second.updatedAt) - Date.parse(first.updatedAt))
}

function getTicketIdFromUrl() {
  if (typeof window === 'undefined') return null
  return new URLSearchParams(window.location.search).get('ticket')
}

function updateTicketUrl(ticketId: string | null, method: 'push' | 'replace' = 'push') {
  const url = new URL(window.location.href)
  if (ticketId) url.searchParams.set('ticket', ticketId)
  else url.searchParams.delete('ticket')
  window.history[method === 'replace' ? 'replaceState' : 'pushState']({}, '', `${url.pathname}${url.search}${url.hash}`)
}
