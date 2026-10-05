type TrangThaiPhienDangNhapProps = {
  message: string
  variant: 'account' | 'login'
}

/**
 * Keeps an auth-sensitive route in a neutral state while the HttpOnly refresh
 * cookie is being exchanged for an access token after a page load.
 */
export function TrangThaiPhienDangNhap({ message, variant }: TrangThaiPhienDangNhapProps) {
  const pageClassName = variant === 'account' ? 'account-page' : 'auth-page'

  return (
    <main className={`${pageClassName} auth-session-status-page`} aria-busy="true">
      <div className="auth-session-status" role="status" aria-live="polite">
        <span className="auth-session-status__spinner" aria-hidden="true" />
        <span className="sr-only">{message}</span>
      </div>
    </main>
  )
}
