/*
 * Vai trò: Đồng bộ trạng thái bảo trì dùng chung với backend.
 */
/* Xác định nguồn dữ liệu Admin và HTTP client gọi backend dùng chung. */
import { getAdminDataMode } from "./admin.service";
import { apiFetch } from "./api";

/* Response tối giản của endpoint chỉ quản lý cờ bảo trì. */
interface MaintenanceModeResponse {
  maintenanceMode: boolean;
}

/* Chỉ dùng cờ backend khi khu vực Admin không chạy bằng dữ liệu demo local. */
export function usesSharedMaintenanceMode() {
  return getAdminDataMode() === "backend";
}

/* Đọc trạng thái bảo trì công khai để chặn/cho phép website đúng lúc. */
export async function getSharedMaintenanceMode() {
  const response = await apiFetch<MaintenanceModeResponse>(
    "/site-settings/maintenance",
    {
      skipAuth: true,
    },
  );
  return response.maintenanceMode;
}

/* Admin bật/tắt bảo trì và nhận lại cờ đã được server xác nhận. */
export async function updateSharedMaintenanceMode(maintenanceMode: boolean) {
  const response = await apiFetch<MaintenanceModeResponse>(
    "/site-settings/maintenance",
    {
      method: "PATCH",
      authScope: "admin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ maintenanceMode }),
    },
  );
  return response.maintenanceMode;
}
