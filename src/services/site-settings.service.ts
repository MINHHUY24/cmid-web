/*
 * Vai trò: Lấy/cập nhật thông tin website, giờ làm việc, liên hệ, VAT và maintenance.
 */
/* HTTP client dùng chung, tự gắn quyền Admin cho endpoint nội bộ. */
import { apiFetch } from "./api";

/* Thiết lập công khai có thể dùng an toàn ở Header, Footer và SEO. */
export type PublicSiteSettings = {
  businessName: string;
  email: string;
  phone: string;
  address: string;
  weekdayHours: string;
  weekendHours: string;
  paymentQrTimeoutSeconds: number;
  maintenanceMode: boolean;
};

/* Thiết lập mở rộng chỉ Admin được phép đọc/chỉnh sửa. */
export type AdminSiteSettings = PublicSiteSettings & {
  freeShippingThreshold: number;
  defaultVatPercent: number;
  orderNotificationEmail: string;
  updatedAt: string;
};

/* Payload PATCH: chỉ cần gửi các trường Admin thực sự thay đổi. */
export type SiteSettingsUpdate = Partial<Omit<AdminSiteSettings, "updatedAt">>;

/* Fallback giúp giao diện vẫn có thông tin hợp lệ trước khi API phản hồi. */
export const defaultSiteSettings: AdminSiteSettings = {
  businessName: "CMID Stone & Interior",
  email: "info@cmid.vn",
  phone: "1800 6868",
  address: "123 Lê Duẩn, Quận 1, TP. Hồ Chí Minh",
  weekdayHours: "08:00 - 17:30",
  weekendHours: "08:00 - 17:00",
  paymentQrTimeoutSeconds: 300,
  freeShippingThreshold: 5_000_000,
  defaultVatPercent: 10,
  orderNotificationEmail: "sales@cmid.vn",
  maintenanceMode: false,
  updatedAt: "",
};

/* Lấy settings công khai, không yêu cầu đăng nhập. */
export function getPublicSiteSettings() {
  return apiFetch<PublicSiteSettings>("/site-settings", { skipAuth: true });
}

/* Lấy settings đầy đủ cho trang cấu hình Admin. */
export function getAdminSiteSettings() {
  return apiFetch<AdminSiteSettings>("/site-settings/admin", {
    authScope: "admin",
  });
}

/* Gửi thay đổi settings đã được View/Admin xác nhận. */
export function updateSiteSettings(input: SiteSettingsUpdate) {
  return apiFetch<AdminSiteSettings>("/site-settings", {
    method: "PATCH",
    authScope: "admin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}
