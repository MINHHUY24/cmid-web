import {
  ArrowsCounterClockwise,
  Buildings,
  ChartBar,
  ChatsCircle,
  ClockCounterClockwise,
  Cube,
  FileText,
  GearSix,
  Gift,
  ImageSquare,
  ListBullets,
  Newspaper,
  Package,
  Quotes,
  ShieldCheck,
  ShoppingCartSimple,
  Storefront,
  Tag,
  UserGear,
  UserList,
  UsersThree,
} from '@phosphor-icons/react'
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
  | 'quotes'
  | 'returns'
  | 'customers'
  | 'customer-groups'
  | 'gifts'
  | 'news'
  | 'projects'
  | 'banners'
  | 'documents'
  | 'inquiries'
  | 'showrooms'
  | 'reports'
  | 'settings'
  | 'users'
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
      { id: 'dashboard', label: 'Dashboard', icon: <ChartBar size={19} /> },
      { id: 'reports', label: 'Báo cáo', icon: <ChartBar size={19} weight="duotone" /> },
    ],
  },
  {
    label: 'Quản lý sản phẩm',
    items: [
      { id: 'products', label: 'Sản phẩm', icon: <Package size={19} /> },
      { id: 'categories', label: 'Danh mục', icon: <ListBullets size={19} /> },
      { id: 'brands', label: 'Thương hiệu', icon: <Tag size={19} /> },
      { id: 'materials', label: 'Vật liệu', icon: <Cube size={19} /> },
      { id: 'suppliers', label: 'Nhà cung cấp', icon: <Storefront size={19} /> },
    ],
  },
  {
    label: 'Quản lý đơn hàng',
    items: [
      { id: 'orders', label: 'Đơn hàng', icon: <ShoppingCartSimple size={19} />, badge: 5 },
      { id: 'quotes', label: 'Yêu cầu báo giá', icon: <Quotes size={19} /> },
      { id: 'returns', label: 'Trả hàng / Hoàn tiền', icon: <ArrowsCounterClockwise size={19} /> },
    ],
  },
  {
    label: 'Quản lý khách hàng',
    items: [
      { id: 'customers', label: 'Khách hàng', icon: <UsersThree size={19} /> },
      { id: 'customer-groups', label: 'Nhóm khách hàng', icon: <UserList size={19} /> },
      { id: 'gifts', label: 'Quà tặng & ưu đãi', icon: <Gift size={19} /> },
    ],
  },
  {
    label: 'Quản lý nội dung',
    items: [
      { id: 'news', label: 'Tin tức', icon: <Newspaper size={19} /> },
      { id: 'projects', label: 'Dự án', icon: <Buildings size={19} /> },
      { id: 'banners', label: 'Banner', icon: <ImageSquare size={19} /> },
      { id: 'documents', label: 'Tài liệu', icon: <FileText size={19} /> },
      { id: 'inquiries', label: 'Liên hệ & Báo giá', icon: <ChatsCircle size={19} /> },
      { id: 'showrooms', label: 'Showroom', icon: <Buildings size={19} weight="duotone" /> },
    ],
  },
  {
    label: 'Quản lý hệ thống',
    items: [
      { id: 'settings', label: 'Cấu hình', icon: <GearSix size={19} /> },
      { id: 'users', label: 'Người dùng', icon: <UserGear size={19} /> },
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
  quotes: { label: 'Yêu cầu báo giá', description: 'Theo dõi nhu cầu tư vấn và báo giá dự án.' },
  returns: { label: 'Trả hàng / Hoàn tiền', description: 'Duyệt yêu cầu đổi trả và theo dõi hoàn tiền.' },
  customers: { label: 'Khách hàng', description: 'Quản lý hồ sơ, lịch sử mua và trạng thái tài khoản.' },
  'customer-groups': { label: 'Nhóm khách hàng', description: 'Thiết lập nhóm, quyền lợi và mức chiết khấu.' },
  gifts: { label: 'Quà tặng & ưu đãi', description: 'Quản lý mã ưu đãi và quyền lợi thành viên.' },
  news: { label: 'Tin tức', description: 'Biên tập bài viết song ngữ và ảnh đại diện.' },
  projects: { label: 'Dự án', description: 'Quản lý dự án nổi bật hiển thị trên website.' },
  banners: { label: 'Banner', description: 'Điều khiển hình ảnh và liên kết ở các khu vực hero.' },
  documents: { label: 'Tài liệu', description: 'Quản lý hồ sơ năng lực, catalogue và tài liệu nội bộ.' },
  inquiries: { label: 'Liên hệ & Báo giá', description: 'Tiếp nhận, phân công và phản hồi yêu cầu khách hàng.' },
  showrooms: { label: 'Showroom', description: 'Quản lý địa chỉ, bản đồ và giờ hoạt động.' },
  reports: { label: 'Báo cáo', description: 'Tổng hợp doanh thu, đơn hàng, khách hàng và sản phẩm.' },
  settings: { label: 'Cấu hình', description: 'Thiết lập thông tin doanh nghiệp và chính sách bán hàng.' },
  users: { label: 'Người dùng', description: 'Quản lý tài khoản được phép truy cập khu vực admin.' },
  roles: { label: 'Phân quyền', description: 'Thiết lập vai trò và phạm vi thao tác.' },
  logs: { label: 'Nhật ký hoạt động', description: 'Theo dõi thay đổi và thao tác quản trị.' },
}

export function isAdminView(value: string | null): value is AdminView {
  return Boolean(value && value in adminViewMeta)
}
