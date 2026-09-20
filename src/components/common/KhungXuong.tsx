import type { ReactNode } from 'react'

export function KhungXuong({ className = '' }: { className?: string }) {
  return <span className={`cmid-skeleton ${className}`.trim()} aria-hidden="true" />
}

export function TrangDangTaiKhungXuong({
  label,
  className = '',
  children,
}: {
  label: string
  className?: string
  children: ReactNode
}) {
  return (
    <div className={className} role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">{label}</span>
      {children}
    </div>
  )
}
