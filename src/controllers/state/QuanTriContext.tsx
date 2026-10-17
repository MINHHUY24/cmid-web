/*
 * Vai trò: Provider xác thực Admin: đăng nhập, refresh phiên, đăng xuất và access token.
 */
/* Hook React quản lý vòng đời phiên Admin, callback ổn định và Context value. */
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
/* Kiểu dữ liệu người dùng đã chuẩn hoá và Context dành cho Admin. */
import type { AuthenticatedUser } from "./NguoiDungContext";
import { AdminAuthContext } from "./QuanTriAuthContext";
/* Service đăng nhập/refresh/đăng xuất và kiểu response từ backend. */
/* Bộ nhớ access token phân vùng riêng cho khu vực Admin. */
import {
  loginAdminWithPassword,
  logoutAdminAuthSession,
  refreshAdminAuthSession,
  type ServerAuthenticatedUser,
} from "../../services/auth.service";
import {
  clearAccessToken,
  registerAccessTokenRefresher,
  setAccessToken,
} from "../../services/auth-token";

/* Chuyển response backend sang kiểu thống nhất mà các View dùng. */
function toAuthenticatedUser(user: ServerAuthenticatedUser): AuthenticatedUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    picture: user.picture,
    role: user.role,
    roleName: user.roleName,
    permissions: user.permissions,
    emailVerified: user.emailVerified,
  };
}

/* Provider quản lý vòng đời phiên: khôi phục, làm mới, đăng nhập và đăng xuất Admin. */
export function AdminAuthProvider({ children }: { children: ReactNode }) {
  /* State người dùng, trạng thái kiểm tra phiên ban đầu và trạng thái gửi form login. */
  const [adminUser, setAdminUser] = useState<AuthenticatedUser | null>(null);
  const [isAdminAuthLoading, setIsAdminAuthLoading] = useState(true);
  const [isAdminSigningIn, setIsAdminSigningIn] = useState(false);

  /* Khi Provider mount, thử khôi phục phiên Admin từ refresh token/httpOnly cookie. */
  useEffect(() => {
    /* Không cho request hoàn tất sau unmount sửa state hoặc token của phiên mới. */
    let isCurrent = true;

    void refreshAdminAuthSession()
      .then((session) => {
        if (!isCurrent) return;
        setAccessToken(session.accessToken, "admin");
        setAdminUser(toAuthenticatedUser(session.user));
      })
      .catch(() => {
        if (!isCurrent) return;
        clearAccessToken("admin");
        setAdminUser(null);
      })
      .finally(() => {
        if (isCurrent) setIsAdminAuthLoading(false);
      });

    return () => {
      isCurrent = false;
      clearAccessToken("admin");
    };
  }, []);

  /* Đăng ký hàm refresh để client API tự lấy access token mới khi token hết hạn. */
  useEffect(
    () =>
      registerAccessTokenRefresher("admin", async () => {
        try {
          const session = await refreshAdminAuthSession();
          setAccessToken(session.accessToken, "admin");
          setAdminUser(toAuthenticatedUser(session.user));
          return session.accessToken;
        } catch {
          clearAccessToken("admin");
          setAdminUser(null);
          return null;
        }
      }),
    [],
  );

  /* Gửi thông tin đăng nhập, lưu token và trả người dùng để View chuyển trang. */
  const signInAdminWithPassword = useCallback(
    async (username: string, password: string) => {
      setIsAdminSigningIn(true);
      try {
        const session = await loginAdminWithPassword(username, password);
        const authenticatedUser = toAuthenticatedUser(session.user);
        setAccessToken(session.accessToken, "admin");
        setAdminUser(authenticatedUser);
        return authenticatedUser;
      } finally {
        setIsAdminSigningIn(false);
      }
    },
    [],
  );

  /* Khoá giao diện ngay, sau đó cố gắng huỷ phiên trên server. */
  const signOutAdmin = useCallback(async () => {
    clearAccessToken("admin");
    setAdminUser(null);

    try {
      await logoutAdminAuthSession();
    } catch {
      /* Mất mạng vẫn phải khoá ngay UI Admin ở phía trình duyệt. */
    }
  }, []);

  /* Memo hoá Context value để các View con không render dư thừa. */
  const value = useMemo(
    () => ({
      adminUser,
      isAdminAuthLoading,
      isAdminSigningIn,
      signInAdminWithPassword,
      signOutAdmin,
    }),
    [
      adminUser,
      isAdminAuthLoading,
      isAdminSigningIn,
      signInAdminWithPassword,
      signOutAdmin,
    ],
  );

  /* Phân phối state và các hành động xác thực đến toàn bộ trang Admin. */
  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
}
