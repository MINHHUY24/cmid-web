import {
  ArrowRight,
  EnvelopeSimple,
  Eye,
  EyeSlash,
  LockKey,
  ShieldCheck,
} from '@phosphor-icons/react'
import { useState, type FormEvent } from 'react'
import interiorImage from '../../assets/images/khong-gian-trung-bay-vat-lieu.jpg'
import {
  adminDemoCredentials,
  signInAdmin,
  type AdminSession,
} from './admin-auth'

export function TrangDangNhapQuanTri({
  onSignedIn,
}: {
  onSignedIn: (session: AdminSession) => void
}) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)

    window.setTimeout(() => {
      const session = signInAdmin(email, password, remember)
      setIsSubmitting(false)
      if (!session) {
        setError('Email hoặc mật khẩu quản trị không chính xác.')
        return
      }
      onSignedIn(session)
    }, 450)
  }

  function fillDemoAccount() {
    setEmail(adminDemoCredentials.email)
    setPassword(adminDemoCredentials.password)
    setError(null)
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

        <form className="admin-login-form" onSubmit={handleSubmit}>
          <div className="admin-login-form__heading">
            <span><ShieldCheck size={18} weight="duotone" /> Khu vực bảo mật</span>
            <h2 id="admin-login-title">Đăng nhập quản trị</h2>
            <p>Dùng tài khoản quản trị được cấp để tiếp tục.</p>
          </div>

          <label className="admin-login-field">
            <span>Email quản trị</span>
            <div>
              <EnvelopeSimple size={19} aria-hidden="true" />
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="username"
                placeholder="admin@cmid.vn"
                required
              />
            </div>
          </label>

          <label className="admin-login-field">
            <span>Mật khẩu</span>
            <div>
              <LockKey size={19} aria-hidden="true" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                placeholder="Nhập mật khẩu"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                {showPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </label>

          <div className="admin-login-form__options">
            <label>
              <input
                type="checkbox"
                checked={remember}
                onChange={(event) => setRemember(event.target.checked)}
              />
              <span>Ghi nhớ đăng nhập</span>
            </label>
            <button type="button" onClick={fillDemoAccount}>Điền tài khoản mẫu</button>
          </div>

          {error ? <p className="admin-login-form__error" role="alert">{error}</p> : null}

          <button className="admin-login-form__submit" type="submit" disabled={isSubmitting}>
            <span>{isSubmitting ? 'Đang xác thực...' : 'Đăng nhập'}</span>
            <ArrowRight size={18} />
          </button>

          <div className="admin-login-form__demo">
            <strong>Tài khoản thử nghiệm</strong>
            <code>{adminDemoCredentials.email}</code>
            <code>{adminDemoCredentials.password}</code>
          </div>
        </form>

        <small className="admin-login-panel__footer">CMID Premium Administration</small>
      </section>
    </main>
  )
}
