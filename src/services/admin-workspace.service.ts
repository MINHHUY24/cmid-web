/*
 * Vai trò: Lấy/thay toàn bộ dữ liệu workspace Admin demo/quản trị.
 */
/* Cấu trúc workspace hoàn chỉnh và HTTP client yêu cầu quyền Admin. */
import type { AdminDatabase } from "../models/admin-workspace";
import { apiFetch } from "./api";

/* Response kèm thời điểm server cập nhật để View có thể kiểm soát đồng bộ. */
type AdminWorkspaceResponse = {
  data: AdminDatabase | null;
  updatedAt: string | null;
};

/* Lấy snapshot dữ liệu workspace Admin. */
export function getAdminWorkspace() {
  return apiFetch<AdminWorkspaceResponse>("/admin-workspace", {
    authScope: "admin",
  });
}

/* Ghi đè workspace bằng snapshot mới sau khi Admin xác nhận lưu. */
export function replaceAdminWorkspace(data: AdminDatabase) {
  return apiFetch<AdminWorkspaceResponse>("/admin-workspace", {
    method: "PUT",
    authScope: "admin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data }),
  });
}
