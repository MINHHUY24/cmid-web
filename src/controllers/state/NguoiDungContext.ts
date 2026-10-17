/*
 * Vai trò: Type/context và hook cho khách hàng đăng nhập, hồ sơ và phiên auth.
 */
/* API React tạo Context phiên khách hàng và hook đọc Context. */
import { createContext, useContext } from "react";
/* Vai trò xác thực được service chuẩn hoá từ backend. */
import type { AuthenticatedRole } from "../../services/auth.service";

/* Thông tin tài khoản đã đăng nhập mà giao diện được phép dùng. */
export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  picture?: string;
  role: AuthenticatedRole;
  roleName?: string;
  permissions: string[];
  emailVerified: boolean;
}

/* Các giá trị giới tính được phép lưu trong hồ sơ khách hàng. */
export type CustomerGender = "" | "male" | "female" | "other";

/* Dữ liệu hồ sơ giao hàng/chăm sóc khách hàng có thể được cập nhật. */
export interface CustomerProfile {
  fullName: string;
  avatar: string;
  phone: string;
  birthDate: string;
  gender: CustomerGender;
  city: string;
  district: string;
  ward: string;
  address: string;
}

/* Hợp đồng cho trạng thái phiên, hồ sơ và các thao tác xác thực của khách. */
export interface UserContextValue {
  user: AuthenticatedUser | null;
  profile: CustomerProfile;
  isAuthLoading: boolean;
  isSigningIn: boolean;
  signInWithGoogle: () => Promise<AuthenticatedUser>;
  updateProfile: (profile: CustomerProfile) => Promise<void>;
  signOut: () => Promise<void>;
}

/* Context null mặc định giúp phát hiện View dùng hook ngoài UserProvider. */
export const UserContext = createContext<UserContextValue | null>(null);

/* Hook lấy thông tin người dùng với thông báo lỗi hướng dẫn khi cấu hình sai. */
export function useUser(): UserContextValue {
  const context = useContext(UserContext);

  if (!context) {
    throw new Error("useUser must be used inside UserProvider");
  }

  return context;
}
