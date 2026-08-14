import type { ReactNode } from 'react'

type StatusPanelTone = 'default' | 'error'

interface StatusPanelProps {
  title: string
  children?: ReactNode
  tone?: StatusPanelTone
}

export function StatusPanel({
  title,
  children,
  tone = 'default',
}: StatusPanelProps) {
  return (
    <section className={`status-panel status-panel--${tone}`} aria-live="polite">
      <h2>{title}</h2>
      {children ? <div className="status-panel__content">{children}</div> : null}
    </section>
  )
}
