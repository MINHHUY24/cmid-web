/*
 * Vai trò: Đọc/sửa hồ sơ cá nhân Admin và đổi mật khẩu.
 */
/* HTTP client dùng chung cho endpoint yêu cầu quyền Admin. */
import { apiFetch } from "./api";

/* Hồ sơ của chính quản trị viên đang đăng nhập. */
export interface AdminOwnProfile {
  fullName: string;
  email: string;
  avatarUrl: string;
  phone: string;
  workEmail: string;
  employeeCode: string;
  department: string;
  directManager: string;
  joinedAt: string;
  workBranch: string;
  bankName: string;
  bankAccountNumber: string;
  bankAccountHolder: string;
  bankBranch: string;
  roleName: string;
  isActive: boolean;
  lastLoginAt: string;
  passwordConfigured: boolean;
  permissions: string[];
}

/* Tải hồ sơ Admin để hiển thị/truyền vào form cá nhân. */
export function getAdminOwnProfile() {
  return apiFetch<{ profile: AdminOwnProfile }>("/auth/admin/profile", {
    authScope: "admin",
  });
}

/* Chỉ gửi các trường Admin được tự chỉnh sửa trong hồ sơ của mình. */
export function updateAdminOwnProfile(input: {
  fullName?: string;
  phone?: string;
  workEmail?: string;
  bankName?: string;
  bankAccountNumber?: string;
  bankAccountHolder?: string;
  bankBranch?: string;
}) {
  return apiFetch<{ profile: AdminOwnProfile }>("/auth/admin/profile", {
    method: "PATCH",
    authScope: "admin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

/* Đổi mật khẩu bằng mật khẩu hiện tại và mật khẩu mới đã được View kiểm tra. */
export function changeAdminOwnPassword(input: {
  currentPassword: string;
  newPassword: string;
}) {
  return apiFetch<{ ok: true }>("/auth/admin/profile/password", {
    method: "PATCH",
    authScope: "admin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}
