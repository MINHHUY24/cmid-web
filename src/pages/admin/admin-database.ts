import type { AppLanguage } from '../../content/site-content'

const ADMIN_DATABASE_KEY = 'cmid-admin-database-v2'
export const ADMIN_DATABASE_UPDATED_EVENT = 'cmid-admin-database-updated'
export const MIN_PAYMENT_QR_TIMEOUT_SECONDS = 30

export type AdminDatabaseCollection =
  | 'categories'
  | 'brands'
  | 'materials'
  | 'suppliers'
  | 'orders'
  | 'quotes'
  | 'returns'
  | 'customers'
  | 'customerGroups'
  | 'gifts'
  | 'banners'
  | 'documents'
  | 'inquiries'
  | 'showrooms'
  | 'users'
  | 'roles'

export interface AdminNamedRecord {
  id: string
  name: string
  slug: string
  description: string
  status: 'ACTIVE' | 'INACTIVE'
  updatedAt: string
}

export interface AdminBrand extends AdminNamedRecord {
  logo: string
  website: string
}

export interface AdminMaterial extends AdminNamedRecord {
  origin: string
  properties: string
  image: string
}

export interface AdminSupplier extends AdminNamedRecord {
  contactName: string
  email: string
  phone: string
  address: string
}

export interface AdminOrderItem {
  productId: number
  name: string
  sku: string
  quantity: number
  price: number
  image: string
}

export interface AdminOrder {
  id: string
  customer: string
  email: string
  phone: string
  address: string
  items: AdminOrderItem[]
  subtotal: number
  vat: number
  total: number
  paymentMethod: string
  paymentMethodCode?: 'BANK_TRANSFER' | 'COD' | 'MOMO_WALLET' | 'MOMO_CARD'
  paymentStatus: 'Chưa thanh toán' | 'Thanh toán thất bại' | 'Đã thanh toán' | 'Hoàn tiền một phần' | 'Đã hoàn tiền'
  status: 'Chờ thanh toán' | 'Thanh toán thất bại' | 'Chờ xác nhận' | 'Đang xử lý' | 'Chờ lấy hàng' | 'Chờ giao hàng' | 'Đang giao' | 'Hoàn thành' | 'Đã hủy' | 'Đã trả hàng'
  refundedAmount: number
  refunds: AdminReturn[]
  statusHistory: AdminOrderStatusHistory[]
  note: string
  createdAt: string
}

export interface AdminReturn {
  id: string
  orderId: string
  customer: string
  reason: string
  amount: number
  status: 'Chờ duyệt' | 'Đã duyệt' | 'Đang hoàn tiền' | 'Hoàn tất' | 'Từ chối'
  provider?: 'MOMO' | 'MANUAL'
  providerRefundId?: string | null
  requestedBy?: string
  processedBy?: string | null
  processedAt?: string | null
  createdAt: string
}

export interface AdminOrderStatusHistory {
  id: number
  fromStatus: AdminOrder['status'] | null
  toStatus: AdminOrder['status']
  actor: string
  note: string
  createdAt: string
}

export interface AdminQuote {
  id: string
  customer: string
  email: string
  phone: string
  product: string
  projectType: string
  budget: string
  note: string
  status: 'Mới' | 'Đang tư vấn' | 'Đã gửi báo giá' | 'Đã chốt' | 'Đã đóng'
  createdAt: string
}

export interface AdminCustomer {
  id: string
  name: string
  email: string
  phone: string
  groupId: string
  company: string
  orderCount: number
  totalSpent: number
  status: 'ACTIVE' | 'INACTIVE'
  createdAt: string
}

export interface AdminCustomerGroup extends AdminNamedRecord {
  discountPercent: number
  memberCount: number
}

export interface AdminGift {
  id: string
  name: string
  code: string
  type: 'PERCENT' | 'FIXED' | 'GIFT'
  value: number
  minimumOrder: number
  expiresAt: string
  status: 'ACTIVE' | 'INACTIVE'
}

export interface AdminBanner {
  id: string
  title: string
  titleEn: string
  placement: 'HOME_HERO' | 'PRODUCT_HERO' | 'NEWS_HERO'
  image: string
  link: string
  status: 'ACTIVE' | 'INACTIVE'
  updatedAt: string
}

export interface AdminDocument {
  id: string
  title: string
  category: string
  fileName: string
  fileData: string
  visibility: 'PUBLIC' | 'INTERNAL'
  updatedAt: string
}

export interface AdminInquiry {
  id: string
  name: string
  email: string
  phone: string
  subject: string
  message: string
  source: 'CONTACT' | 'QUOTE' | 'SHOWROOM'
  status: 'Mới' | 'Đang xử lý' | 'Đã phản hồi' | 'Đã đóng'
  createdAt: string
}

export interface AdminShowroom {
  id: string
  name: string
  address: string
  phone: string
  email: string
  hours: string
  mapUrl: string
  image: string
  status: 'ACTIVE' | 'INACTIVE'
}

export interface AdminUser {
  id: string
  name: string
  email: string
  roleId: string
  status: 'ACTIVE' | 'LOCKED'
  lastLogin: string
}

export interface AdminRole {
  id: string
  name: string
  description: string
  permissions: string[]
  userCount: number
}

export interface AdminActivity {
  id: string
  actor: string
  action: string
  module: string
  createdAt: string
}

export interface AdminSettings {
  businessName: string
  email: string
  phone: string
  address: string
  weekdayHours: string
  weekendHours: string
  freeShippingThreshold: number
  defaultVatPercent: number
  paymentQrTimeoutSeconds: number
  orderNotificationEmail: string
  maintenanceMode: boolean
  adminLanguage: AppLanguage
}

export interface AdminDatabase {
  categories: AdminNamedRecord[]
  brands: AdminBrand[]
  materials: AdminMaterial[]
  suppliers: AdminSupplier[]
  orders: AdminOrder[]
  quotes: AdminQuote[]
  returns: AdminReturn[]
  customers: AdminCustomer[]
  customerGroups: AdminCustomerGroup[]
  gifts: AdminGift[]
  banners: AdminBanner[]
  documents: AdminDocument[]
  inquiries: AdminInquiry[]
  showrooms: AdminShowroom[]
  users: AdminUser[]
  roles: AdminRole[]
  activities: AdminActivity[]
  settings: AdminSettings
}

const now = '2026-08-14T09:30:00.000Z'

const seedDatabase: AdminDatabase = {
  categories: [
    named('cat-1', 'Xi măng & Bê tông', 'xi-mang-be-tong'),
    named('cat-2', 'Gạch ốp lát', 'gach-op-lat'),
    named('cat-3', 'Sơn & Chống thấm', 'son-chong-tham'),
    named('cat-4', 'Thiết bị vệ sinh', 'thiet-bi-ve-sinh'),
    named('cat-5', 'Đá tự nhiên', 'da-tu-nhien'),
    named('cat-6', 'Cửa & Phụ kiện', 'cua-phu-kien'),
    named('cat-7', 'Trần & Vách', 'tran-vach'),
    named('cat-8', 'Nội thất phòng khách', 'noi-that-phong-khach'),
    named('cat-9', 'Nội thất phòng ăn', 'noi-that-phong-an'),
    named('cat-10', 'Nội thất văn phòng', 'noi-that-van-phong'),
  ],
  brands: [
    { ...named('brand-1', 'TOTO', 'toto'), logo: '', website: 'https://vn.toto.com' },
    { ...named('brand-2', 'Dulux', 'dulux'), logo: '', website: 'https://www.dulux.vn' },
    { ...named('brand-3', 'INSEE', 'insee'), logo: '', website: 'https://insee.com.vn' },
    { ...named('brand-4', 'VICOSTONE', 'vicostone'), logo: '', website: 'https://vicostone.com' },
  ],
  materials: [
    { ...named('material-1', 'Đá Marble', 'da-marble'), origin: 'Ý, Tây Ban Nha', properties: 'Vân tự nhiên, bề mặt bóng hoặc mờ', image: '' },
    { ...named('material-2', 'Đá Granite', 'da-granite'), origin: 'Brazil, Ấn Độ', properties: 'Cứng, bền, chịu nhiệt', image: '' },
    { ...named('material-3', 'Gạch Porcelain', 'gach-porcelain'), origin: 'Việt Nam, Italy', properties: 'Ít hút nước, chống trầy xước', image: '' },
  ],
  suppliers: [
    { ...named('supplier-1', 'TOTO Việt Nam', 'toto-viet-nam'), contactName: 'Phòng kinh doanh dự án', email: 'project@toto.vn', phone: '028 3822 9520', address: 'TP. Hồ Chí Minh' },
    { ...named('supplier-2', 'An Cường', 'an-cuong'), contactName: 'Bộ phận đối tác', email: 'partner@ancuong.com', phone: '028 3767 5767', address: 'Bình Dương' },
  ],
  orders: [
    order('CMID-1024', 'KTS. Nguyễn Hải Anh', 'Gạch porcelain Stone Grey', 24500000, 'Chờ xác nhận', 'Đã thanh toán', '2026-08-18T09:25:00.000Z'),
    order('CMID-1023', 'Công ty TNHH An Phúc', 'Bồn cầu TOTO MS887RW12', 11700000, 'Đang xử lý', 'Đã thanh toán', '2026-08-17T11:10:00.000Z'),
    order('CMID-1019', 'Lê Anh Khoa', 'Sofa da cao cấp Italia', 28900000, 'Chờ lấy hàng', 'Đã thanh toán', '2026-08-12T10:15:00.000Z'),
    order('CMID-1018', 'Phạm Ngọc Mai', 'Gạch porcelain Stone Grey', 5880000, 'Chờ giao hàng', 'Chưa thanh toán', '2026-08-11T15:30:00.000Z'),
    order('CMID-1022', 'Trần Ngọc Bích', 'Sơn Dulux Inspire Ngoại thất', 6900000, 'Chờ xác nhận', 'Chưa thanh toán', '2026-08-16T14:05:00.000Z'),
    order('CMID-1021', 'KTS. Phạm Gia Khánh', 'Bộ bàn ăn gỗ sồi 6 ghế', 19500000, 'Đang giao', 'Đã thanh toán', '2026-08-14T08:40:00.000Z'),
    order('CMID-1020', 'Nguyễn Minh Thư', 'Lavabo đặt bàn TOTO LTS548', 3250000, 'Hoàn thành', 'Đã thanh toán', '2026-08-13T16:20:00.000Z'),
  ],
  quotes: [
    {
      id: 'BG-2026-0814',
      customer: 'KTS. Hoàng Minh Lâm',
      email: 'lam@lp-architects.vn',
      phone: '090 382 11xx',
      product: 'Đá Marble Calacatta cho sảnh biệt thự',
      projectType: 'Biệt thự',
      budget: '250 đến 400 triệu đồng',
      note: 'Cần tư vấn ghép vân và khảo sát trong tuần.',
      status: 'Đang tư vấn',
      createdAt: '2026-08-14T08:35:00.000Z',
    },
    {
      id: 'BG-2026-0813',
      customer: 'Công ty Nội thất Sala',
      email: 'project@sala-interior.vn',
      phone: '028 7300 28xx',
      product: 'Thiết bị vệ sinh cho 12 căn hộ mẫu',
      projectType: 'Căn hộ mẫu',
      budget: 'Theo khối lượng thực tế',
      note: 'Ưu tiên TOTO và tiến độ giao trong tháng 9.',
      status: 'Mới',
      createdAt: '2026-08-13T10:15:00.000Z',
    },
  ],
  returns: [
    { id: 'RT-0015', orderId: 'CMID-1014', customer: 'Lê Thanh Tùng', reason: 'Sản phẩm trầy xước khi nhận', amount: 4250000, status: 'Chờ duyệt', createdAt: '2026-08-12T10:20:00.000Z' },
    { id: 'RT-0014', orderId: 'CMID-1008', customer: 'Nguyễn Thị Lan', reason: 'Đổi mẫu gạch khác', amount: 8400000, status: 'Đang hoàn tiền', createdAt: '2026-08-09T15:45:00.000Z' },
  ],
  customers: [
    customer('customer-1', 'KTS. Nguyễn Hải Anh', 'hai.anh@atelier.vn', '090 382 11xx', 'group-partner', 'Atelier Hải Anh', 14, 428000000),
    customer('customer-2', 'Trần Ngọc Bích', 'bich.tran@gmail.com', '093 881 24xx', 'group-retail', '', 3, 48700000),
    customer('customer-3', 'Công ty TNHH An Phúc', 'purchasing@anphuc.vn', '028 3930 8xxx', 'group-business', 'Công ty TNHH An Phúc', 9, 385000000),
    customer('customer-4', 'Nguyễn Minh Thư', 'minhthu.nguyen@gmail.com', '090 222 67xx', 'group-vip', '', 6, 132500000),
  ],
  customerGroups: [
    { ...named('group-retail', 'Khách lẻ', 'khach-le'), discountPercent: 0, memberCount: 842 },
    { ...named('group-vip', 'Khách hàng VIP', 'khach-hang-vip'), discountPercent: 5, memberCount: 86 },
    { ...named('group-partner', 'Kiến trúc sư & Đối tác', 'kien-truc-su-doi-tac'), discountPercent: 8, memberCount: 124 },
    { ...named('group-business', 'Doanh nghiệp', 'doanh-nghiep'), discountPercent: 10, memberCount: 195 },
  ],
  gifts: [
    { id: 'gift-1', name: 'Ưu đãi thành viên mới', code: 'CMIDNEW', type: 'PERCENT', value: 5, minimumOrder: 3000000, expiresAt: '2026-12-31', status: 'ACTIVE' },
    { id: 'gift-2', name: 'Miễn phí giao hàng dự án', code: 'SHIPPROJECT', type: 'FIXED', value: 500000, minimumOrder: 10000000, expiresAt: '2026-10-31', status: 'ACTIVE' },
  ],
  banners: [
    { id: 'banner-home', title: 'Giải pháp vật liệu xây dựng & nội thất cao cấp', titleEn: 'Premium building materials & interior solutions', placement: 'HOME_HERO', image: '', link: '/products', status: 'ACTIVE', updatedAt: now },
    { id: 'banner-products', title: 'Sản phẩm CMID', titleEn: 'CMID products', placement: 'PRODUCT_HERO', image: '', link: '/products', status: 'ACTIVE', updatedAt: now },
  ],
  documents: [
    { id: 'doc-1', title: 'Hồ sơ năng lực CMID 2026', category: 'Hồ sơ năng lực', fileName: 'cmid-company-profile-2026.pdf', fileData: '', visibility: 'PUBLIC', updatedAt: now },
    { id: 'doc-2', title: 'Bảng giá dự án tháng 08/2026', category: 'Bảng giá', fileName: 'bang-gia-du-an-08-2026.xlsx', fileData: '', visibility: 'INTERNAL', updatedAt: now },
  ],
  inquiries: [
    { id: 'contact-1', name: 'Nguyễn Thu Hà', email: 'thuha@gmail.com', phone: '091 445 22xx', subject: 'Tư vấn vật liệu phòng bếp', message: 'Tôi muốn đặt lịch xem mẫu đá tự nhiên vào cuối tuần.', source: 'CONTACT', status: 'Mới', createdAt: '2026-08-14T07:50:00.000Z' },
    { id: 'contact-2', name: 'KTS. Lê Minh', email: 'minh@mlstudio.vn', phone: '090 772 18xx', subject: 'Đặt lịch showroom', message: 'Đoàn 4 người cần xem mẫu gạch khổ lớn vào chiều thứ Sáu.', source: 'SHOWROOM', status: 'Đang xử lý', createdAt: '2026-08-13T13:20:00.000Z' },
  ],
  showrooms: [
    { id: 'showroom-hcm', name: 'CMID Showroom TP. Hồ Chí Minh', address: '123 Lê Duẩn, Quận 1, TP. Hồ Chí Minh', phone: '1800 6868', email: 'info@cmid.vn', hours: '08:00 đến 17:30, Thứ 2 đến Thứ 7', mapUrl: 'https://maps.google.com', image: '', status: 'ACTIVE' },
    { id: 'showroom-danang', name: 'CMID Showroom Đà Nẵng', address: '456 Nguyễn Văn Linh, Hải Châu, Đà Nẵng', phone: '0236 388 6868', email: 'danang@cmid.vn', hours: '08:00 đến 17:30, Thứ 2 đến Thứ 7', mapUrl: 'https://maps.google.com', image: '', status: 'ACTIVE' },
  ],
  users: [
    { id: 'user-admin', name: 'CMID Admin', email: 'admincmid@gmail.com', roleId: 'role-super-admin', status: 'ACTIVE', lastLogin: now },
    { id: 'user-content', name: 'Nguyễn Minh Anh', email: 'content@cmid.vn', roleId: 'role-editor', status: 'ACTIVE', lastLogin: '2026-08-13T08:10:00.000Z' },
    { id: 'user-sale', name: 'Trần Quốc Nam', email: 'sales@cmid.vn', roleId: 'role-sales', status: 'ACTIVE', lastLogin: '2026-08-12T14:45:00.000Z' },
  ],
  roles: [
    { id: 'role-super-admin', name: 'Quản trị cao nhất', description: 'Toàn quyền trên hệ thống quản trị.', permissions: ['*'], userCount: 1 },
    { id: 'role-editor', name: 'Biên tập nội dung', description: 'Quản lý tin tức, dự án, banner và tài liệu.', permissions: ['news.*', 'projects.*', 'banners.*', 'documents.*'], userCount: 1 },
    { id: 'role-sales', name: 'Kinh doanh', description: 'Quản lý khách hàng, đơn hàng và báo giá.', permissions: ['orders.*', 'customers.*'], userCount: 1 },
  ],
  activities: [
    activity('Đăng nhập vào hệ thống quản trị', 'Hệ thống', '2026-08-14T09:30:00.000Z'),
    activity('Cập nhật trạng thái đơn hàng CMID-1023', 'Đơn hàng', '2026-08-14T09:05:00.000Z'),
    activity('Xuất bản bài viết xu hướng vật liệu', 'Tin tức', '2026-08-14T08:42:00.000Z'),
  ],
  settings: {
    businessName: 'CMID Stone & Interior',
    email: 'info@cmid.vn',
    phone: '1800 6868',
    address: '123 Lê Duẩn, Quận 1, TP. Hồ Chí Minh',
    weekdayHours: '08:00 - 17:30',
    weekendHours: '08:00 - 17:00',
    freeShippingThreshold: 5000000,
    defaultVatPercent: 10,
    paymentQrTimeoutSeconds: 300,
    orderNotificationEmail: 'sales@cmid.vn',
    maintenanceMode: false,
    adminLanguage: 'vi',
  },
}

function named(id: string, name: string, slug: string): AdminNamedRecord {
  return { id, name, slug, description: '', status: 'ACTIVE', updatedAt: now }
}

function order(
  id: string,
  customerName: string,
  productName: string,
  total: number,
  status: AdminOrder['status'],
  paymentStatus: AdminOrder['paymentStatus'],
  createdAt: string,
): AdminOrder {
  return {
    id,
    customer: customerName,
    email: '',
    phone: '',
    address: '',
    items: [{ productId: 0, name: productName, sku: '', quantity: 1, price: total, image: '' }],
    subtotal: total,
    vat: 0,
    total,
    paymentMethod: 'Chuyển khoản ngân hàng',
    paymentMethodCode: 'BANK_TRANSFER',
    paymentStatus,
    status,
    refundedAmount: 0,
    refunds: [],
    statusHistory: [],
    note: '',
    createdAt,
  }
}

function customer(
  id: string,
  name: string,
  email: string,
  phone: string,
  groupId: string,
  company: string,
  orderCount: number,
  totalSpent: number,
): AdminCustomer {
  return { id, name, email, phone, groupId, company, orderCount, totalSpent, status: 'ACTIVE', createdAt: now }
}

function activity(actionText: string, module: string, createdAt: string): AdminActivity {
  return { id: `activity-${createdAt}-${module}`, actor: 'CMID Admin', action: actionText, module, createdAt }
}

function cloneSeed(): AdminDatabase {
  return JSON.parse(JSON.stringify(seedDatabase)) as AdminDatabase
}

export function createAdminId(prefix: string) {
  const randomId = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID().slice(0, 8)
    : Math.random().toString(36).slice(2, 10)
  return `${prefix}-${randomId}`
}

export function getAdminDatabase(): AdminDatabase {
  if (typeof window === 'undefined') return cloneSeed()

  try {
    const saved = window.localStorage.getItem(ADMIN_DATABASE_KEY)
    if (!saved) return cloneSeed()
    const parsed = JSON.parse(saved) as Partial<AdminDatabase>
    const seed = cloneSeed()
    return {
      ...seed,
      ...parsed,
      settings: {
        ...seed.settings,
        ...(parsed.settings ?? {}),
      },
    }
  } catch {
    return cloneSeed()
  }
}

export function getPaymentQrTimeoutSeconds() {
  const configuredValue = Number(getAdminDatabase().settings.paymentQrTimeoutSeconds)

  return Number.isFinite(configuredValue)
    ? Math.max(MIN_PAYMENT_QR_TIMEOUT_SECONDS, Math.round(configuredValue))
    : 300
}

export function saveAdminDatabase(database: AdminDatabase) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(ADMIN_DATABASE_KEY, JSON.stringify(database))
  window.dispatchEvent(new Event(ADMIN_DATABASE_UPDATED_EVENT))
}

export function mutateAdminDatabase(
  mutation: (database: AdminDatabase) => AdminDatabase,
  activityText?: string,
  module = 'Hệ thống',
) {
  const current = getAdminDatabase()
  const next = mutation(current)
  if (activityText) {
    next.activities = [
      { id: createAdminId('activity'), actor: 'CMID Admin', action: activityText, module, createdAt: new Date().toISOString() },
      ...next.activities,
    ].slice(0, 100)
  }
  saveAdminDatabase(next)
  return next
}
