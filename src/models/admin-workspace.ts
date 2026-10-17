/*
 * Vai trò: Toàn bộ type của workspace Admin: danh mục, thương hiệu, đơn, khách, quyền, showroom, cấu hình.
 */
/* Kiểu ngôn ngữ dùng trong cấu hình màn hình quản trị. */
import type { AppLanguage } from "../models/content/site-content";

/* Các collection mà workspace Admin có thể thao tác trong dữ liệu cục bộ/API. */
export type AdminDatabaseCollection =
  | "categories"
  | "brands"
  | "materials"
  | "suppliers"
  | "orders"
  | "returns"
  | "customers"
  | "customerGroups"
  | "gifts"
  | "banners"
  | "inquiries"
  | "showrooms"
  | "users"
  | "roles";

/* Trường chung của những bản ghi có tên, slug, mô tả và trạng thái. */
export interface AdminNamedRecord {
  id: string;
  name: string;
  slug: string;
  description: string;
  status: "ACTIVE" | "INACTIVE";
  updatedAt: string;
}

/* Thương hiệu kế thừa trường chung và thêm nhận diện/liên kết website. */
export interface AdminBrand extends AdminNamedRecord {
  logo: string;
  website: string;
}

/* Vật liệu gồm xuất xứ, đặc tính và hình ảnh tham chiếu. */
export interface AdminMaterial extends AdminNamedRecord {
  origin: string;
  properties: string;
  image: string;
}

/* Nhà cung cấp với thông tin đầu mối liên hệ và địa chỉ. */
export interface AdminSupplier extends AdminNamedRecord {
  contactName: string;
  email: string;
  phone: string;
  address: string;
}

/* Một sản phẩm đã chốt trong đơn, lưu snapshot giá/tên để không đổi theo catalog. */
export interface AdminOrderItem {
  productId: number;
  name: string;
  sku: string;
  quantity: number;
  price: number;
  image: string;
}

/* Đơn hàng đầy đủ: khách, dòng hàng, thanh toán, giao nhận và lịch sử xử lý. */
export interface AdminOrder {
  id: string;
  customer: string;
  email: string;
  phone: string;
  address: string;
  items: AdminOrderItem[];
  subtotal: number;
  vat: number;
  total: number;
  paymentMethod: string;
  paymentMethodCode?: "BANK_TRANSFER" | "COD" | "MOMO_WALLET" | "MOMO_CARD";
  paymentStatus:
    | "Chưa thanh toán"
    | "Thanh toán thất bại"
    | "Đã thanh toán"
    | "Hoàn tiền một phần"
    | "Đã hoàn tiền";
  status:
    | "Chờ thanh toán"
    | "Thanh toán thất bại"
    | "Chờ xác nhận"
    | "Đang xử lý"
    | "Chờ lấy hàng"
    | "Chờ giao hàng"
    | "Đang giao"
    | "Hoàn thành"
    | "Đã hủy"
    | "Đã trả hàng";
  refundedAmount: number;
  refunds: AdminReturn[];
  statusHistory: AdminOrderStatusHistory[];
  note: string;
  createdAt: string;
}

/* Yêu cầu trả hàng/hoàn tiền gắn với đơn và trạng thái xử lý của nó. */
export interface AdminReturn {
  id: string;
  orderId: string;
  customer: string;
  reason: string;
  amount: number;
  status: "Chờ duyệt" | "Đã duyệt" | "Đang hoàn tiền" | "Hoàn tất" | "Từ chối";
  provider?: "MOMO" | "MANUAL";
  providerRefundId?: string | null;
  requestedBy?: string;
  processedBy?: string | null;
  processedAt?: string | null;
  createdAt: string;
}

/* Một mốc lịch sử thay đổi trạng thái đơn nhằm phục vụ truy vết. */
export interface AdminOrderStatusHistory {
  id: number;
  fromStatus: AdminOrder["status"] | null;
  toStatus: AdminOrder["status"];
  actor: string;
  note: string;
  createdAt: string;
}

/* Hồ sơ khách hàng tổng hợp phục vụ CRM trong Admin. */
export interface AdminCustomer {
  id: string;
  name: string;
  email: string;
  phone: string;
  groupId: string;
  company: string;
  orderCount: number;
  totalSpent: number;
  status: "ACTIVE" | "INACTIVE";
  createdAt: string;
}

/* Nhóm khách hàng, quyền lợi chiết khấu và số lượng thành viên. */
export interface AdminCustomerGroup extends AdminNamedRecord {
  discountPercent: number;
  memberCount: number;
}

/* Chương trình quà tặng/ưu đãi với điều kiện, giá trị và hạn dùng. */
export interface AdminGift {
  id: string;
  name: string;
  code: string;
  type: "PERCENT" | "FIXED" | "GIFT";
  value: number;
  minimumOrder: number;
  expiresAt: string;
  status: "ACTIVE" | "INACTIVE";
}

/* Banner theo vị trí hero, chứa nội dung hiển thị và liên kết điều hướng. */
export interface AdminBanner {
  id: string;
  title: string;
  titleEn: string;
  placement: "HOME_HERO" | "PRODUCT_HERO" | "NEWS_HERO";
  image: string;
  link: string;
  status: "ACTIVE" | "INACTIVE";
  updatedAt: string;
}

/* Yêu cầu tư vấn/liên hệ mà khách gửi từ các form công khai. */
export interface AdminInquiry {
  id: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  source: "CONTACT" | "QUOTE" | "SHOWROOM";
  status: "Mới" | "Đang xử lý" | "Đã phản hồi" | "Đã đóng";
  createdAt: string;
}

/* Thông tin showroom hiển thị/điều hành trong Admin. */
export interface AdminShowroom {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  hours: string;
  mapUrl: string;
  image: string;
  status: "ACTIVE" | "INACTIVE";
}

/* Tài khoản nhân sự quản trị và trạng thái truy cập hệ thống. */
export interface AdminUser {
  id: string;
  name: string;
  email: string;
  roleId: string;
  status: "ACTIVE" | "LOCKED";
  lastLogin: string;
}

/* Nhóm quyền, mô tả và số thành viên đang được gán. */
export interface AdminRole {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  userCount: number;
}

/* Nhật ký hành động để audit thao tác trong khu vực quản trị. */
export interface AdminActivity {
  id: string;
  actor: string;
  action: string;
  module: string;
  createdAt: string;
}

/* Thiết lập vận hành: doanh nghiệp, chính sách, thông báo và bảo trì. */
export interface AdminSettings {
  businessName: string;
  email: string;
  phone: string;
  address: string;
  weekdayHours: string;
  weekendHours: string;
  freeShippingThreshold: number;
  defaultVatPercent: number;
  paymentQrTimeoutSeconds: number;
  orderNotificationEmail: string;
  maintenanceMode: boolean;
  adminLanguage: AppLanguage;
}

/* Cấu trúc database tổng hợp dùng cho workspace Admin ở frontend. */
export interface AdminDatabase {
  categories: AdminNamedRecord[];
  brands: AdminBrand[];
  materials: AdminMaterial[];
  suppliers: AdminSupplier[];
  orders: AdminOrder[];
  returns: AdminReturn[];
  customers: AdminCustomer[];
  customerGroups: AdminCustomerGroup[];
  gifts: AdminGift[];
  banners: AdminBanner[];
  inquiries: AdminInquiry[];
  showrooms: AdminShowroom[];
  users: AdminUser[];
  roles: AdminRole[];
  activities: AdminActivity[];
  settings: AdminSettings;
}
