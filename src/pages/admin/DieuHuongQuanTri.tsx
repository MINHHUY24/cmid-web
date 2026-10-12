import {
  ArrowsCounterClockwise,
  ChartBar,
  ClockCounterClockwise,
  GearSix,
  Gift,
  Headset,
  ImageSquare,
  ListBullets,
  Newspaper,
  Package,
  ShieldCheck,
  ShoppingCartSimple,
  Tag,
  UserGear,
  UserList,
  UsersThree,
} from '@phosphor-icons/react'
import {
  Factory,
  FolderKanban,
  LayoutDashboard,
  Layers3,
  MessageSquareQuote,
  CircleUserRound,
  Store,
} from 'lucide-react'
import type { ReactNode } from 'react'

export type AdminView =
  | 'dashboard'
  | 'products'
  | 'product-editor'
  | 'categories'
  | 'brands'
  | 'materials'
  | 'suppliers'
  | 'orders'
  | 'returns'
  | 'customers'
  | 'customer-groups'
  | 'gifts'
  | 'news'
  | 'projects'
  | 'banners'
  | 'inquiries'
  | 'showrooms'
  | 'reports'
  | 'settings'
  | 'profile'
  | 'users'
  | 'helpdesk'
  | 'roles'
  | 'logs'

export interface AdminNavItem {
  id: Exclude<AdminView, 'product-editor'>
  label: string
  icon: ReactNode
  badge?: number
}

export const adminMenuGroups: Array<{ label: string; items: AdminNavItem[] }> = [
  {
    label: 'Tổng quan',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={19} /> },
      { id: 'reports', label: 'Báo cáo', icon: <ChartBar size={19} weight="duotone" /> },
    ],
  },
  {
    label: 'Quản lý sản phẩm',
    items: [
      { id: 'products', label: 'Sản phẩm', icon: <Package size={19} /> },
      { id: 'categories', label: 'Danh mục', icon: <ListBullets size={19} /> },
      { id: 'brands', label: 'Thương hiệu', icon: <Tag size={19} /> },
      { id: 'materials', label: 'Vật liệu', icon: <Layers3 size={19} /> },
      { id: 'suppliers', label: 'Nhà cung cấp', icon: <Factory size={19} /> },
    ],
  },
  {
    label: 'Quản lý đơn hàng',
    items: [
      { id: 'orders', label: 'Đơn hàng', icon: <ShoppingCartSimple size={19} />, badge: 5 },
      { id: 'returns', label: 'Trả hàng / Hoàn tiền', icon: <ArrowsCounterClockwise size={19} /> },
    ],
  },
  {
    label: 'Quản lý khách hàng',
    items: [
      { id: 'customers', label: 'Khách hàng', icon: <UsersThree size={19} /> },
      { id: 'inquiries', label: 'Liên hệ & Báo giá', icon: <MessageSquareQuote size={19} /> },
      { id: 'customer-groups', label: 'Nhóm khách hàng', icon: <UserList size={19} /> },
      { id: 'gifts', label: 'Quà tặng & ưu đãi', icon: <Gift size={19} /> },
    ],
  },
  {
    label: 'Quản lý nội dung',
    items: [
      { id: 'news', label: 'Tin tức', icon: <Newspaper size={19} /> },
      { id: 'projects', label: 'Dự án', icon: <FolderKanban size={19} /> },
      { id: 'banners', label: 'Banner', icon: <ImageSquare size={19} /> },
      { id: 'showrooms', label: 'Showroom', icon: <Store size={19} /> },
    ],
  },
  {
    label: 'Quản lý hệ thống',
    items: [
      { id: 'profile', label: 'Thông tin cá nhân', icon: <CircleUserRound size={19} /> },
      { id: 'settings', label: 'Cấu hình', icon: <GearSix size={19} /> },
      { id: 'users', label: 'Nhân viên', icon: <UserGear size={19} /> },
      { id: 'helpdesk', label: 'Hỗ trợ IT', icon: <Headset size={19} /> },
      { id: 'roles', label: 'Phân quyền', icon: <ShieldCheck size={19} /> },
      { id: 'logs', label: 'Nhật ký hoạt động', icon: <ClockCounterClockwise size={19} /> },
    ],
  },
]

export const adminViewMeta: Record<AdminView, { label: string; description: string }> = {
  dashboard: { label: 'Tổng quan', description: 'Theo dõi vận hành và nội dung website CMID.' },
  products: { label: 'Sản phẩm', description: 'Quản lý catalogue, giá bán, tồn kho và trạng thái hiển thị.' },
  'product-editor': { label: 'Biên tập sản phẩm', description: 'Cập nhật dữ liệu hiển thị trên giao diện khách hàng.' },
  categories: { label: 'Danh mục', description: 'Tổ chức nhóm sản phẩm và liên kết bộ lọc catalogue.' },
  brands: { label: 'Thương hiệu', description: 'Quản lý thương hiệu, logo và liên kết đối tác.' },
  materials: { label: 'Vật liệu', description: 'Khai báo đặc tính, xuất xứ và ứng dụng vật liệu.' },
  suppliers: { label: 'Nhà cung cấp', description: 'Lưu thông tin liên hệ và nguồn cung sản phẩm.' },
  orders: { label: 'Đơn hàng', description: 'Tiếp nhận và xử lý đơn được gửi từ website.' },
  returns: { label: 'Trả hàng / Hoàn tiền', description: 'Duyệt yêu cầu đổi trả và theo dõi hoàn tiền.' },
  customers: { label: 'Khách hàng', description: 'Quản lý hồ sơ, lịch sử mua và trạng thái tài khoản.' },
  'customer-groups': { label: 'Nhóm khách hàng', description: 'Thiết lập nhóm, quyền lợi và mức chiết khấu.' },
  gifts: { label: 'Quà tặng & ưu đãi', description: 'Quản lý mã ưu đãi và quyền lợi thành viên.' },
  news: { label: 'Tin tức', description: 'Biên tập bài viết song ngữ và ảnh đại diện.' },
  projects: { label: 'Dự án', description: 'Quản lý dự án nổi bật hiển thị trên website.' },
  banners: { label: 'Banner', description: 'Điều khiển hình ảnh và liên kết ở các khu vực hero.' },
  inquiries: { label: 'Liên hệ & Báo giá', description: 'Tiếp nhận, phân công và phản hồi yêu cầu khách hàng.' },
  showrooms: { label: 'Showroom', description: 'Quản lý địa chỉ, bản đồ và giờ hoạt động.' },
  reports: { label: 'Báo cáo', description: 'Tổng hợp doanh thu, đơn hàng, khách hàng và sản phẩm.' },
  settings: { label: 'Cấu hình', description: 'Thiết lập thông tin doanh nghiệp và chính sách bán hàng.' },
  profile: { label: 'Thông tin cá nhân', description: 'Cập nhật thông tin liên hệ của tài khoản đang đăng nhập.' },
  users: { label: 'Nhân viên', description: 'Quản lý tài khoản nội bộ được phép truy cập khu vực admin.' },
  helpdesk: { label: 'Hỗ trợ IT', description: 'Gửi yêu cầu nội bộ và trao đổi với bộ phận IT trong một luồng theo dõi rõ ràng.' },
  roles: { label: 'Phân quyền', description: 'Thiết lập vai trò và phạm vi thao tác.' },
  logs: { label: 'Nhật ký hoạt động', description: 'Theo dõi thay đổi và thao tác quản trị.' },
}

export function isAdminView(value: string | null): value is AdminView {
  return Boolean(value && value in adminViewMeta)
}
