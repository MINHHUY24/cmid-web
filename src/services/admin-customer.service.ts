/*
 * Vai trò: Lấy và cập nhật khách hàng được quản trị.
 */
/* HTTP client dùng chung: tự gắn token/phân quyền theo scope Admin. */
import { apiFetch } from "./api";

/* Bản ghi khách hàng mà Admin được phép xem và quản lý. */
export interface ManagedCustomer {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  orderCount: number;
  totalSpent: number;
}

/* Lấy danh sách khách hàng cho màn hình quản trị. */
export function getManagedCustomers() {
  return apiFetch<{ customers: ManagedCustomer[] }>("/admin/access/customers", {
    authScope: "admin",
  });
}

/* Cập nhật các trường Admin được quyền chỉnh sửa trên hồ sơ khách. */
export function updateManagedCustomer(
  id: string,
  body: { fullName?: string; phone?: string; isActive?: boolean },
) {
  return apiFetch<{ customer: ManagedCustomer }>(
    `/admin/access/customers/${id}`,
    {
      method: "PATCH",
      authScope: "admin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );
}
