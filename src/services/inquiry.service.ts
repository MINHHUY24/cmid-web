/*
 * Vai trò: Gửi form liên hệ/báo giá và quản lý yêu cầu liên hệ trong Admin.
 */
/* HTTP client dùng cho form công khai và endpoint nội bộ cần quyền Admin. */
import { apiFetch } from "./api";

/* Mã trạng thái vòng đời và nguồn phát sinh yêu cầu tư vấn. */
export type InquiryStatus = "NEW" | "IN_PROGRESS" | "RESPONDED" | "CLOSED";
export type InquirySource = "CONTACT" | "SHOWROOM" | "QUOTE";

/* Bản ghi yêu cầu liên hệ/báo giá dùng ở cả trang công khai lẫn Admin. */
export interface ContactInquiry {
  id: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  source: InquirySource;
  status: InquiryStatus;
  createdAt: string;
  updatedAt: string;
}

/* Gửi form công khai không cần token, nhưng cần cờ đồng ý của khách. */
export function createContactInquiry(body: {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  consent: boolean;
}) {
  return apiFetch<{ inquiry: ContactInquiry }>("/inquiries", {
    method: "POST",
    skipAuth: true,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

/* Lấy toàn bộ yêu cầu cho màn hình quản trị. */
export function getManagedInquiries() {
  return apiFetch<{ inquiries: ContactInquiry[] }>("/inquiries/admin", {
    authScope: "admin",
  });
}

/* Cập nhật trạng thái xử lý của một yêu cầu trong Admin. */
export function updateManagedInquiry(id: string, status: InquiryStatus) {
  return apiFetch<{ inquiry: ContactInquiry }>(`/inquiries/admin/${id}`, {
    method: "PATCH",
    authScope: "admin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
}

/* Xoá yêu cầu đã chọn trong khu vực quản trị. */
export function deleteManagedInquiry(id: string) {
  return apiFetch<void>(`/inquiries/admin/${id}`, {
    method: "DELETE",
    authScope: "admin",
  });
}
