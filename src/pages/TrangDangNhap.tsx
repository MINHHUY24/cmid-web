import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useLanguage } from '../contexts/NgonNguContext'
import { useUser } from '../contexts/NguoiDungContext'

interface LoginLocationState {
  from?: string
}

export function TrangDangNhapPage() {
  const { content } = useLanguage()
  const { user, isSigningIn, signInWithGoogle } = useUser()
  const location = useLocation()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const destination = (location.state as LoginLocationState | null)?.from ?? '/tai-khoan'

  if (user) {
    return <Navigate to={destination} replace />
  }

  async function handleGoogleSignIn() {
    setError(null)

    try {
      await signInWithGoogle()
      navigate(destination, { replace: true })
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Không thể đăng nhập. Vui lòng thử lại.')
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-page__shell">
        <section className="auth-page__intro" aria-labelledby="login-title">
          <h1 id="login-title">{content.auth.loginWelcome}</h1>
          <p>{content.auth.loginDescription}</p>
          <span className="auth-page__accent" aria-hidden="true" />
        </section>

        <section className="auth-card" aria-labelledby="auth-card-title">
          <h2 id="auth-card-title" className="sr-only">{content.auth.loginTitle}</h2>
          <button
            type="button"
            className="auth-google-button"
            onClick={handleGoogleSignIn}
            disabled={isSigningIn}
          >
            <img className="auth-google-button__mark" src="/google-g.svg" alt="" aria-hidden="true" />
            <span>{isSigningIn ? content.auth.signingIn : content.auth.googleButton}</span>
          </button>

          {error ? <p className="auth-card__error" role="alert">{error}</p> : null}
        </section>
      </div>
    </main>
  )
}
