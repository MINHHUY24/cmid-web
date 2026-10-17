/*
 * Vai trò: Lưu/đọc/xóa access token theo scope khách/Admin, đăng ký refresh token.
 */
/* Hai vùng token độc lập cho khách hàng và khu vực Admin. */
export type AuthTokenScope = "customer" | "admin";

type AccessTokenRefresher = () => Promise<string | null>;

/* Bộ nhớ token ngắn hạn và callback refresh do Provider tương ứng đăng ký. */
const accessTokens: Record<AuthTokenScope, string | null> = {
  customer: null,
  admin: null,
};

const accessTokenRefreshers: Partial<
  Record<AuthTokenScope, AccessTokenRefresher>
> = {};

/* Đọc token đang dùng cho một scope, mặc định là khách hàng. */
export function getAccessToken(scope: AuthTokenScope = "customer") {
  return accessTokens[scope];
}

/* Ghi token mới sau login/refresh thành công. */
export function setAccessToken(
  nextAccessToken: string,
  scope: AuthTokenScope = "customer",
) {
  accessTokens[scope] = nextAccessToken;
}

/* Xoá token khi logout, phiên hết hạn hoặc không còn đủ quyền. */
export function clearAccessToken(scope: AuthTokenScope = "customer") {
  accessTokens[scope] = null;
}

/* Đăng ký hàm refresh từ Provider; đặt ở đây để tránh api.ts và auth.service phụ thuộc vòng. */
export function registerAccessTokenRefresher(
  scope: AuthTokenScope,
  refresher: AccessTokenRefresher,
) {
  accessTokenRefreshers[scope] = refresher;

  return () => {
    if (accessTokenRefreshers[scope] === refresher) {
      delete accessTokenRefreshers[scope];
    }
  };
}

/* Gọi refresher nếu Provider của scope đó đang hoạt động. */
export function refreshAccessToken(scope: AuthTokenScope) {
  return accessTokenRefreshers[scope]?.() ?? Promise.resolve(null);
}
