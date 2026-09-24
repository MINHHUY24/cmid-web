import {
  ArrowRight,
  ShieldCheck,
} from '@phosphor-icons/react'
import { useState, type FormEvent } from 'react'
import interiorImage from '../../assets/images/khong-gian-trung-bay-vat-lieu.jpg'
import logoImage from '../../assets/images/logo.webp'
import { useUser } from '../../contexts/NguoiDungContext'

export function TrangDangNhapQuanTri() {
  const { isSigningIn, signInAdminWithPassword } = useUser()
  const [error, setError] = useState<string | null>(null)

  async function handlePasswordSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    const form = new FormData(event.currentTarget)
    try {
      await signInAdminWithPassword(String(form.get('username') ?? ''), String(form.get('password') ?? ''))
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
        <div className="admin-login-panel__content">
          <div className="admin-login-panel__brand">
            <img src={logoImage} alt="CMID" />
          </div>

        <div className="admin-login-form">
          <div className="admin-login-form__heading">
            <span><ShieldCheck size={18} weight="duotone" /> Khu vực bảo mật</span>
            <h2 id="admin-login-title">Đăng nhập quản trị</h2>
            <p>Dùng tài khoản nội bộ CMID được cấp quyền để tiếp tục.</p>
          </div>
          <form onSubmit={handlePasswordSignIn}>
            <label className="admin-field"><span>Email</span><div className="admin-login-email"><input name="username" autoComplete="username" required /><span>@cmid.com.vn</span></div></label>
            <label className="admin-field"><span>Mật khẩu</span><input name="password" type="password" autoComplete="current-password" required /></label>
            <button className="admin-login-form__submit" type="submit" disabled={isSigningIn}><span>{isSigningIn ? 'Đang xác thực...' : 'Đăng nhập'}</span><ArrowRight size={18} /></button>
          </form>

          {error ? <p className="admin-login-form__error" role="alert">{error}</p> : null}
        </div>
        </div>

      </section>
    </main>
  )
}
