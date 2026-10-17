/*
 * Vai trò: Trang Google Sign-In của khách hàng và trạng thái phục hồi phiên.
 */
/* State lỗi, điều hướng sau login, View trạng thái và Context xác thực/ngôn ngữ. */
import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { TrangThaiPhienDangNhap } from "../components/common/TrangThaiPhienDangNhap";
import { useLanguage } from "../../controllers/state/NgonNguContext";
import { useUser } from "../../controllers/state/NguoiDungContext";

/* State route được trang cần bảo vệ truyền vào để quay lại đúng điểm đến sau login. */
interface LoginLocationState {
  from?: string;
}

/* View đăng nhập Google: chờ khôi phục session, redirect nếu đã login hoặc hiển thị form. */
export function TrangDangNhapPage() {
  /* Đọc session và xác định địa chỉ quay về an toàn với fallback tài khoản. */
  const { content } = useLanguage();
  const { user, isAuthLoading, isSigningIn, signInWithGoogle } = useUser();
  const location = useLocation();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const destination =
    (location.state as LoginLocationState | null)?.from ?? "/tai-khoan";

  /* Không render form trước khi biết chắc session cũ có còn hợp lệ không. */
  if (isAuthLoading) {
    return (
      <TrangThaiPhienDangNhap
        message={content.auth.restoringSession}
        variant="login"
      />
    );
  }

  /* Khách đã đăng nhập không nên ở lại trang login. */
  if (user) {
    return <Navigate to={destination} replace />;
  }

  /* Gọi Controller xác thực; chỉ điều hướng khi Google/backend trả session thành công. */
  async function handleGoogleSignIn() {
    setError(null);

    try {
      await signInWithGoogle();
      navigate(destination, { replace: true });
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Không thể đăng nhập. Vui lòng thử lại.",
      );
    }
  }

  /* JSX gồm lời chào thương hiệu, nút Google và vùng báo lỗi có trợ năng. */
  return (
    <main className="auth-page">
      <div className="auth-page__shell">
        <section className="auth-page__intro" aria-labelledby="login-title">
          <h1 id="login-title">{content.auth.loginWelcome}</h1>
          <p>{content.auth.loginDescription}</p>
          <span className="auth-page__accent" aria-hidden="true" />
        </section>

        <section className="auth-card" aria-labelledby="auth-card-title">
          <h2 id="auth-card-title" className="sr-only">
            {content.auth.loginTitle}
          </h2>
          <button
            type="button"
            className="auth-google-button"
            onClick={handleGoogleSignIn}
            disabled={isSigningIn}
          >
            <img
              className="auth-google-button__mark"
              src="/google-g.svg"
              alt=""
              aria-hidden="true"
            />
            <span>
              {isSigningIn ? content.auth.signingIn : content.auth.googleButton}
            </span>
          </button>

          {error ? (
            <p className="auth-card__error" role="alert">
              {error}
            </p>
          ) : null}
        </section>
      </div>
    </main>
  );
}
