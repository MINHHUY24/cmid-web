import type {
  HelpdeskSlaStatus,
  HelpdeskTicketCategory,
  HelpdeskTicketPriority,
  HelpdeskTicketStatus,
} from '../../services/helpdesk.service'

export const helpdeskStages: Array<{ value: HelpdeskTicketStatus; label: string }> = [
  { value: 'OPEN', label: 'Mới' },
  { value: 'ACKNOWLEDGED', label: 'Đã tiếp nhận' },
  { value: 'IN_PROGRESS', label: 'Đang xử lý' },
  { value: 'WAITING_FOR_EMPLOYEE', label: 'Chờ người dùng' },
  { value: 'RESOLVED', label: 'Đã giải quyết' },
  { value: 'CLOSED', label: 'Đóng' },
]

export const helpdeskPriorities: Array<{ value: HelpdeskTicketPriority; label: string; stars: number }> = [
  { value: 'LOW', label: 'Bình thường', stars: 0 },
  { value: 'NORMAL', label: 'Trung bình', stars: 1 },
  { value: 'HIGH', label: 'Cao', stars: 2 },
  { value: 'URGENT', label: 'Khẩn cấp', stars: 3 },
]

export const helpdeskCategories: Array<{ value: HelpdeskTicketCategory; label: string }> = [
  { value: 'ACCOUNT', label: 'Tài khoản' },
  { value: 'ACCESS', label: 'Quyền truy cập' },
  { value: 'DEVICE', label: 'Thiết bị' },
  { value: 'SOFTWARE', label: 'Phần mềm' },
  { value: 'NETWORK', label: 'Mạng / kết nối' },
  { value: 'OTHER', label: 'Khác' },
]

export function stageLabel(status: HelpdeskTicketStatus) {
  return helpdeskStages.find((stage) => stage.value === status)?.label ?? status
}

export function priorityLabel(priority: HelpdeskTicketPriority) {
  return helpdeskPriorities.find((item) => item.value === priority)?.label ?? priority
}

export function priorityStars(priority: HelpdeskTicketPriority) {
  return helpdeskPriorities.find((item) => item.value === priority)?.stars ?? 0
}

export function categoryLabel(category: HelpdeskTicketCategory) {
  return helpdeskCategories.find((item) => item.value === category)?.label ?? category
}

export function slaLabel(status: HelpdeskSlaStatus | null, deadline: string | null, language: 'vi' | 'en') {
  if (!deadline || !status) return language === 'vi' ? 'SLA -' : 'SLA -'
  if (status === 'ACHIEVED') return language === 'vi' ? 'Đạt SLA' : 'SLA met'

  const minutes = Math.round((Date.parse(deadline) - Date.now()) / 60_000)
  if (status === 'OVERDUE') {
    const late = Math.abs(minutes)
    return language === 'vi' ? `Quá SLA ${formatMinutes(late)}` : `Overdue ${formatMinutes(late)}`
  }
  if (status === 'WARNING') return language === 'vi' ? `Sắp quá hạn ${formatMinutes(Math.max(0, minutes))}` : `Due in ${formatMinutes(Math.max(0, minutes))}`
  return language === 'vi' ? `SLA ${formatMinutes(Math.max(0, minutes))}` : `SLA ${formatMinutes(Math.max(0, minutes))}`
}

function formatMinutes(minutes: number) {
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  const remainder = minutes % 60
  return remainder ? `${hours}h ${remainder}m` : `${hours}h`
}

export function formatRelativeTime(value: string, language: 'vi' | 'en') {
  const minutes = Math.max(0, Math.round((Date.now() - Date.parse(value)) / 60_000))
  if (minutes < 1) return language === 'vi' ? 'Vừa xong' : 'Just now'
  if (minutes < 60) return language === 'vi' ? `${minutes} phút` : `${minutes} min`
  if (minutes < 1_440) return language === 'vi' ? `${Math.round(minutes / 60)} giờ` : `${Math.round(minutes / 60)} hr`
  return new Date(value).toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-GB', { day: '2-digit', month: '2-digit' })
}

export function formatDateTime(value: string, language: 'vi' | 'en') {
  return new Date(value).toLocaleString(language === 'vi' ? 'vi-VN' : 'en-GB', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

export function formatMessageTime(value: string, language: 'vi' | 'en') {
  return new Date(value).toLocaleTimeString(language === 'vi' ? 'vi-VN' : 'en-GB', {
    hour: '2-digit', minute: '2-digit',
  })
}

export function initials(value: string) {
  return value.trim().split(/\s+/).slice(-2).map((part) => part[0]).join('').toLocaleUpperCase('vi') || '?'
}
