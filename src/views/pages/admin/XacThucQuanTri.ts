/*
 * Vai trò: Map session server thành Admin session UI, kiểm tra user Admin và tên role.
 */
import type { AuthenticatedUser } from "../../../controllers/state/NguoiDungContext";
import type { AuthenticatedRole } from "../../../services/auth.service";
import { hasPermission } from "./PhanQuyenQuanTri";

export type AdminRole = AuthenticatedRole;

export interface AdminSession {
  email: string;
  name: string;
  role: AdminRole;
  roleName: string;
  permissions: string[];
}

const defaultRoleNames: Record<string, string> = {
  SUPER_ADMIN: "Quản trị cao nhất",
  SALES_STAFF: "Nhân viên kinh doanh",
  SALES_MANAGER: "Trưởng phòng kinh doanh",
  CONTENT_STAFF: "Nhân viên Content/Marketing",
  CONTENT_MANAGER: "Trưởng phòng Content/Marketing",
  WAREHOUSE_STAFF: "Nhân viên kho",
  ACCOUNTANT: "Nhân viên kế toán",
  MANAGER: "Quản lý",
  IT_ADMIN: "Quản trị IT",
};

export function getAdminRoleName(role: string, roleName?: string) {
  if (roleName?.trim()) return roleName;
  if (defaultRoleNames[role]) return defaultRoleNames[role];
  return role
    .toLocaleLowerCase("vi-VN")
    .split("_")
    .map((word) => word.charAt(0).toLocaleUpperCase("vi-VN") + word.slice(1))
    .join(" ");
}

export function isAdminUser(
  user: AuthenticatedUser | null,
): user is AuthenticatedUser & { role: AdminRole } {
  return Boolean(
    user &&
    user.role !== "CUSTOMER" &&
    hasPermission(user.permissions, "admin.access"),
  );
}

export function toAdminSession(
  user: AuthenticatedUser & { role: AdminRole },
): AdminSession {
  return {
    email: user.email,
    name: user.name,
    role: user.role,
    roleName: getAdminRoleName(user.role, user.roleName),
    permissions: user.permissions,
  };
}
