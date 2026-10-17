/*
 * Vai trò: Ô shortcut danh mục có icon và link.
 */
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

interface CategoryShortcutProps {
  icon: ReactNode
  label: string
  to: string
}

export function CategoryShortcut({ icon, label, to }: CategoryShortcutProps) {
  return (
    <Link className="category-shortcut" to={to}>
      <span className="category-shortcut__icon" aria-hidden="true">
        {icon}
      </span>
      <span>{label}</span>
    </Link>
  )
}
