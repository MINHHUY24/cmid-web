/*
 * Vai trò: Khai báo context xác thực Admin.
 */
/* API React dùng để tạo Context đăng nhập của khu vực quản trị. */
import { createContext } from "react";
/* Dùng chung cấu trúc người dùng đã xác thực với khu vực khách hàng. */
import type { AuthenticatedUser } from "./NguoiDungContext";

/* Dữ liệu và thao tác mà các màn hình Admin được phép sử dụng. */
export interface AdminAuthContextValue {
  adminUser: AuthenticatedUser | null;
  isAdminAuthLoading: boolean;
  isAdminSigningIn: boolean;
  signInAdminWithPassword: (
    username: string,
    password: string,
  ) => Promise<AuthenticatedUser>;
  signOutAdmin: () => Promise<void>;
}

/* Context Admin để null mặc định nhằm phát hiện quên bọc AdminAuthProvider. */
export const AdminAuthContext = createContext<AdminAuthContextValue | null>(
  null,
);
