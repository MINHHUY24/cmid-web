import {
  ArrowRight,
  ShieldCheck,
} from '@phosphor-icons/react'
import { useState } from 'react'
import interiorImage from '../../assets/images/khong-gian-trung-bay-vat-lieu.jpg'
import { useUser } from '../../contexts/NguoiDungContext'
import { adminDemoCredentials, isAdminDemoEnabled } from './admin-demo-auth'

export function TrangDangNhapQuanTri({ onDemoSignIn }: { onDemoSignIn?: () => void }) {
  const { isSigningIn, signInWithGoogle } = useUser()
  const [error, setError] = useState<string | null>(null)
  const showDemo = isAdminDemoEnabled && Boolean(onDemoSignIn)

  async function handleGoogleSignIn() {
    setError(null)

    try {
      await signInWithGoogle()
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Không thể đăng nhập. Vui lòng thử lại.',
      )
    }
  }

  return (
    <main className="admin-login-page">
      <section className="admin-login-visual" aria-label="Không gian trưng bày CMID">
        <img src={interiorImage} alt="Không gian trưng bày vật liệu và nội thất CMID" />
        <div className="admin-login-visual__scrim" />
        <div className="admin-login-visual__copy">
          <span>CMID STONE &amp; INTERIOR</span>
          <h1>Quản lý toàn bộ nội dung và vận hành trong một nơi.</h1>
          <p>Sản phẩm, đơn hàng, khách hàng và nội dung website được tổ chức theo cùng một quy trình.</p>
        </div>
      </section>

      <section className="admin-login-panel" aria-labelledby="admin-login-title">
        <div className="admin-login-panel__brand">
          <strong>CMID</strong>
          <span>ADMIN CONSOLE</span>
        </div>

        <div className="admin-login-form">
          <div className="admin-login-form__heading">
            <span><ShieldCheck size={18} weight="duotone" /> Khu vực bảo mật</span>
            <h2 id="admin-login-title">Đăng nhập quản trị</h2>
            <p>{showDemo
              ? 'Dùng tài khoản mẫu bên dưới để vào trang quản trị và thử các chức năng.'
              : 'Dùng tài khoản Google đã được cấp quyền trên hệ thống để tiếp tục.'}</p>
          </div>

          {showDemo ? (
            <button
              className="admin-login-form__submit"
              type="button"
              onClick={onDemoSignIn}
              disabled={isSigningIn}
            >
              <span>Đăng nhập bằng tài khoản mẫu</span>
              <ArrowRight size={18} />
            </button>
          ) : null}

          <button
            className={`admin-login-form__submit${showDemo ? ' admin-login-form__submit--secondary' : ''}`}
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isSigningIn}
          >
            <span>{isSigningIn ? 'Đang xác thực...' : 'Tiếp tục với Google'}</span>
            <ArrowRight size={18} />
          </button>

          {error ? <p className="admin-login-form__error" role="alert">{error}</p> : null}

          <div className="admin-login-form__demo">
            {showDemo ? (
              <>
                <strong>Tài khoản thử nghiệm</strong>
                <code>{adminDemoCredentials.email}</code>
                <code>{adminDemoCredentials.password}</code>
              </>
            ) : (
              <>
                <strong>Quyền truy cập</strong>
                <p>Dùng tài khoản đã được cấp quyền quản trị để truy cập hệ thống.</p>
              </>
            )}
          </div>
        </div>

        <small className="admin-login-panel__footer">CMID Premium Administration</small>
      </section>
    </main>
  )
}
