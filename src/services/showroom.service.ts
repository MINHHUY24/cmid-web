/*
 * Vai trò: CRUD showroom công khai và quản trị.
 */
/* HTTP client dùng chung cho API showroom công khai và quản trị. */
import { apiFetch } from "./api";

/* Trạng thái quyết định showroom có xuất hiện ở website công khai hay không. */
export type ShowroomStatus = "ACTIVE" | "INACTIVE";

/* Bản ghi showroom do server trả về, gồm cả metadata quản trị. */
export interface Showroom {
  id: string;
  name: string;
  address: string;
  phone: string | null;
  email: string | null;
  hours: string | null;
  mapUrl: string | null;
  image: string | null;
  status: ShowroomStatus;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

/* Payload tạo/cập nhật showroom từ form Admin. */
export type ShowroomInput = {
  id?: string;
  name: string;
  address: string;
  phone?: string;
  email?: string;
  hours?: string;
  mapUrl?: string;
  image?: string;
  status: ShowroomStatus;
};

/* Lấy showroom đang công bố; khách truy cập không cần đăng nhập. */
export function getPublishedShowrooms() {
  return apiFetch<Showroom[]>("/showrooms", { skipAuth: true });
}

/* Lấy cả showroom đang ẩn cho màn hình Admin. */
export function getAdminShowrooms() {
  return apiFetch<Showroom[]>("/showrooms/admin", { authScope: "admin" });
}

/* Tạo hoặc lưu thay đổi showroom theo cơ chế upsert của backend. */
export function saveShowroom(input: ShowroomInput) {
  return apiFetch<Showroom>("/showrooms", {
    method: "POST",
    authScope: "admin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

/* Xoá showroom theo ID đã được mã hoá để URL luôn hợp lệ. */
export function deleteShowroom(id: string) {
  return apiFetch<void>(`/showrooms/${encodeURIComponent(id)}`, {
    method: "DELETE",
    authScope: "admin",
  });
}
