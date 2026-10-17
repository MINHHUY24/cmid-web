/*
 * Vai trò: Endpoint login Google/Admin, refresh session, đọc user hiện tại và logout.
 */
/* HTTP client và header định danh tab dùng cho mọi thao tác xác thực. */
import { apiFetch } from "./api";
import { getAuthTabHeaders } from "./auth-tab";

/* Role để frontend kiểm tra quyền hiển thị; backend vẫn là nơi quyết định quyền thật. */
export type AuthenticatedRole = string;

/* User được backend trả về sau khi login/refresh session. */
export interface ServerAuthenticatedUser {
  id: string;
  name: string;
  email: string;
  picture?: string;
  role: AuthenticatedRole;
  roleName?: string;
  permissions: string[];
  emailVerified: boolean;
}

/* Session chứa access token ngắn hạn, hạn dùng và user đã xác thực. */
export interface AuthSessionResponse {
  accessToken: string;
  accessTokenExpiresIn: number;
  user: ServerAuthenticatedUser;
}

/* Promise đang refresh để nhiều request cùng lúc chỉ gọi refresh endpoint một lần. */
let pendingCustomerRefresh: Promise<AuthSessionResponse> | null = null;
let pendingAdminRefresh: Promise<AuthSessionResponse> | null = null;

/* Đổi Google credential lấy session khách hàng từ backend. */
export function loginWithGoogleCredential(credential: string) {
  return apiFetch<AuthSessionResponse>("/auth/google", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthTabHeaders() },
    body: JSON.stringify({ credential }),
    skipAuth: true,
  });
}

/* Đăng nhập Admin bằng thông tin form và gắn ID tab để cô lập session. */
export function loginAdminWithPassword(username: string, password: string) {
  return apiFetch<AuthSessionResponse>("/auth/admin/login", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthTabHeaders() },
    body: JSON.stringify({ username, password }),
    skipAuth: true,
  });
}

/* Refresh session khách; các cuộc gọi đồng thời dùng chung một Promise. */
export function refreshCustomerAuthSession() {
  if (!pendingCustomerRefresh) {
    pendingCustomerRefresh = apiFetch<AuthSessionResponse>("/auth/refresh", {
      method: "POST",
      headers: getAuthTabHeaders(),
      skipAuth: true,
    }).finally(() => {
      pendingCustomerRefresh = null;
    });
  }

  return pendingCustomerRefresh;
}

/* Refresh session Admin độc lập với session khách hàng. */
export function refreshAdminAuthSession() {
  if (!pendingAdminRefresh) {
    pendingAdminRefresh = apiFetch<AuthSessionResponse>("/auth/admin/refresh", {
      method: "POST",
      headers: getAuthTabHeaders(),
      skipAuth: true,
    }).finally(() => {
      pendingAdminRefresh = null;
    });
  }

  return pendingAdminRefresh;
}

/* Đọc user của phiên khách đang có access token. */
export function getCurrentAuthenticatedUser() {
  return apiFetch<{ user: ServerAuthenticatedUser }>("/auth/me");
}

/* Đọc user Admin, bắt buộc dùng scope Admin để gắn token đúng. */
export function getCurrentAdmin() {
  return apiFetch<{ user: ServerAuthenticatedUser }>("/auth/admin/me", {
    authScope: "admin",
  });
}

/* Yêu cầu server xoá refresh session của khách trong tab hiện tại. */
export function logoutCustomerAuthSession() {
  return apiFetch<void>("/auth/logout", {
    method: "POST",
    headers: getAuthTabHeaders(),
    skipAuth: true,
  });
}

/* Yêu cầu server xoá refresh session Admin trong tab hiện tại. */
export function logoutAdminAuthSession() {
  return apiFetch<void>("/auth/admin/logout", {
    method: "POST",
    headers: getAuthTabHeaders(),
    skipAuth: true,
  });
}
