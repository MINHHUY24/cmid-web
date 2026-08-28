import {
  CaretDown,
  Check,
  CheckCircle,
  MagnifyingGlass,
  Package,
  PencilSimple,
  Plus,
  Trash,
  X,
} from '@phosphor-icons/react'
import { useCallback, useEffect, useId, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AdminImageUpload } from './AdminImageUpload'
import { createAdminId } from './admin-database'
import { useAdminCopy } from './admin-language-context'

export function AdminPageHeading({
  title,
  description,
  action,
}: {
  title: string
  description: string
  action?: ReactNode
}) {
  const { t } = useAdminCopy()
  return (
    <div className="admin-page-heading">
      <div><h1>{t(title)}</h1><p>{t(description)}</p></div>
      {action}
    </div>
  )
}

export function AdminPanel({
  title,
  children,
  className = '',
}: {
  title?: string
  children: ReactNode
  className?: string
}) {
  const { t } = useAdminCopy()
  return (
    <section className={`admin-panel ${className}`}>
      {title ? <h2>{t(title)}</h2> : null}
      {children}
    </section>
  )
}

export function AdminStatus({ children }: { children: string }) {
  const { t } = useAdminCopy()
  const label = getAdminStatusLabel(children)
  return <span className={`admin-status ${getAdminStatusTone(children)}`}>{t(label)}</span>
}

function getAdminStatusLabel(value: string) {
  const labels: Record<string, string> = {
    ACTIVE: 'Đang hoạt động',
    INACTIVE: 'Không hoạt động',
    LOCKED: 'Đã khóa',
    DRAFT: 'Bản nháp',
    PUBLISHED: 'Đã xuất bản',
    PUBLIC: 'Công khai',
    INTERNAL: 'Nội bộ',
  }

  return labels[value] ?? value
}

function getAdminStatusTone(value: string) {
  const normalized = value.toLocaleLowerCase('vi')
  if (['đang xử lý', 'đang tư vấn', 'đang phản hồi', 'đang hoàn tiền'].some((key) => normalized.includes(key))) return 'is-processing'
  if (normalized.includes('đang giao')) return 'is-shipping'
  if (['chờ xác nhận', 'chờ duyệt', 'chưa thanh toán', 'mới'].some((key) => normalized.includes(key))) return 'is-pending'
  if (normalized.includes('đã thanh toán')) return 'is-paid'
  if (normalized.includes('đã hoàn tiền')) return 'is-refunded'
  if (['inactive', 'không hoạt động', 'tạm ẩn', 'đã hủy', 'từ chối', 'locked', 'đã khóa', 'ngưng bán'].some((key) => normalized.includes(key))) return 'is-danger'
  if (['active', 'đang hoạt động', 'đang bán', 'đã xuất bản', 'hoàn thành', 'hoàn tất', 'đã duyệt'].some((key) => normalized.includes(key))) return 'is-success'
  return 'is-muted'
}

export interface AdminSelectOption {
  value: string
  label: string
}

interface AdminSelectProps {
  options: AdminSelectOption[]
  value?: string
  defaultValue?: string
  onChange?: (value: string) => void
  name?: string
  required?: boolean
  disabled?: boolean
  className?: string
  'aria-label'?: string
}

export function AdminSelect({
  options,
  value,
  defaultValue,
  onChange,
  name,
  required = false,
  disabled = false,
  className = '',
  'aria-label': ariaLabel,
}: AdminSelectProps) {
  const isControlled = value !== undefined
  const fallbackValue = options[0]?.value ?? ''
  const [internalValue, setInternalValue] = useState(defaultValue ?? fallbackValue)
  const [isOpen, setIsOpen] = useState(false)
  const [menuPosition, setMenuPosition] = useState<{ left: number; top: number; width: number; opensAbove: boolean } | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const menuId = useId()
  const selectedValue = isControlled ? value : internalValue
  const selectedOption = options.find((option) => option.value === selectedValue) ?? options[0]
  const selectedTone = selectedOption ? getAdminStatusTone(selectedOption.label) : 'is-muted'
  const hasStatusOptions = options.some((option) => getAdminStatusTone(option.label) !== 'is-muted')

  const updateMenuPosition = useCallback(() => {
    const trigger = triggerRef.current
    if (!trigger) return
    const rect = trigger.getBoundingClientRect()
    const minimumWidth = Math.max(rect.width, 180)
    const estimatedMenuHeight = Math.min(options.length * 40 + 10, 260)
    const opensAbove = window.innerHeight - rect.bottom < estimatedMenuHeight + 12 && rect.top > estimatedMenuHeight + 12
    setMenuPosition({
      left: Math.max(8, Math.min(rect.left, window.innerWidth - minimumWidth - 8)),
      top: opensAbove ? rect.top - 6 : rect.bottom + 6,
      width: minimumWidth,
      opensAbove,
    })
  }, [options.length])

  function openMenu() {
    if (disabled) return
    setIsOpen(true)
    requestAnimationFrame(updateMenuPosition)
  }

  function selectOption(nextValue: string) {
    if (!isControlled) setInternalValue(nextValue)
    onChange?.(nextValue)
    setIsOpen(false)
    requestAnimationFrame(() => triggerRef.current?.focus())
  }

  useEffect(() => {
    if (!isOpen) return undefined
    const closeOnOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node
      if (!rootRef.current?.contains(target) && !menuRef.current?.contains(target)) setIsOpen(false)
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setIsOpen(false)
      triggerRef.current?.focus()
    }
    document.addEventListener('mousedown', closeOnOutsideClick)
    document.addEventListener('keydown', closeOnEscape)
    window.addEventListener('resize', updateMenuPosition)
    window.addEventListener('scroll', updateMenuPosition, true)
    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick)
      document.removeEventListener('keydown', closeOnEscape)
      window.removeEventListener('resize', updateMenuPosition)
      window.removeEventListener('scroll', updateMenuPosition, true)
    }
  }, [isOpen, updateMenuPosition])

  return (
    <div className={`admin-select${hasStatusOptions ? ' admin-select--status' : ''} ${className}`} ref={rootRef}>
      {name ? <input type="hidden" name={name} value={selectedValue} required={required} /> : null}
      <button
        ref={triggerRef}
        className={`admin-select__trigger${selectedTone !== 'is-muted' ? ` is-status ${selectedTone}` : ''}`}
        type="button"
        disabled={disabled || options.length === 0}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={isOpen ? menuId : undefined}
        onClick={() => (isOpen ? setIsOpen(false) : openMenu())}
      >
        <span>{selectedOption?.label ?? 'Chọn giá trị'}</span>
        <CaretDown size={17} weight="bold" aria-hidden="true" />
      </button>
      {isOpen && typeof document !== 'undefined' && menuPosition ? createPortal(
        <div
          className={`admin-select__menu${hasStatusOptions ? ' admin-select__menu--status' : ''}${menuPosition.opensAbove ? ' admin-select__menu--above' : ''}`}
          id={menuId}
          ref={menuRef}
          role="listbox"
          aria-label={ariaLabel}
          style={{ left: menuPosition.left, top: menuPosition.top, minWidth: menuPosition.width }}
        >
          {options.map((option) => {
            const isSelected = option.value === selectedValue
            const tone = getAdminStatusTone(option.label)
            return (
              <button
                className={`${isSelected ? 'is-selected' : ''}${tone !== 'is-muted' ? ` is-status ${tone}` : ''}`.trim() || undefined}
                type="button"
                key={option.value}
                role="option"
                aria-selected={isSelected}
                onClick={() => selectOption(option.value)}
              >
                <span>{option.label}</span>
                {isSelected ? <Check size={16} weight="bold" aria-hidden="true" /> : null}
              </button>
            )
          })}
        </div>,
        document.body,
      ) : null}
    </div>
  )
}

export function AdminToast({ message, onClose }: { message: string; onClose: () => void }) {
  const { t } = useAdminCopy()
  return (
    <div className="admin-toast" role="status">
      <CheckCircle size={19} weight="fill" />
      <span>{t(message)}</span>
      <button type="button" onClick={onClose} aria-label={t('Đóng')}><X size={16} /></button>
    </div>
  )
}

export type AdminEditableRecord = { id: string; [key: string]: unknown }

export interface AdminFieldConfig {
  key: string
  label: string
  type?: 'text' | 'email' | 'tel' | 'number' | 'textarea' | 'select' | 'image' | 'checkbox'
  required?: boolean
  placeholder?: string
  options?: Array<{ value: string; label: string }>
  helper?: string
}

export interface AdminColumnConfig {
  key: string
  label: string
  align?: 'left' | 'center' | 'right'
  render?: (record: AdminEditableRecord) => ReactNode
}

function getAdminColumnClass(column: AdminColumnConfig) {
  const alignment = column.align ?? (column.key === 'status' ? 'center' : 'left')
  return alignment === 'left' ? undefined : `admin-table__cell--${alignment}`
}

interface AdminCollectionManagerProps {
  title: string
  description: string
  singularLabel: string
  rows: AdminEditableRecord[]
  columns: AdminColumnConfig[]
  fields: AdminFieldConfig[]
  onSave: (record: AdminEditableRecord) => void
  onDelete: (id: string) => void
  searchPlaceholder?: string
  addLabel?: string
  readOnly?: boolean
}

export function AdminCollectionManager({
  title,
  description,
  singularLabel,
  rows,
  columns,
  fields,
  onSave,
  onDelete,
  searchPlaceholder = 'Tìm kiếm...',
  addLabel,
  readOnly = false,
}: AdminCollectionManagerProps) {
  const { t } = useAdminCopy()
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<AdminEditableRecord | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleting, setDeleting] = useState<AdminEditableRecord | null>(null)
  const [editorError, setEditorError] = useState<string | null>(null)

  const filteredRows = useMemo(() => {
    const value = search.trim().toLocaleLowerCase('vi')
    if (!value) return rows
    return rows.filter((row) =>
      Object.values(row).some((item) => String(item ?? '').toLocaleLowerCase('vi').includes(value)),
    )
  }, [rows, search])

  const translatedFields = fields.map((field) => ({
    ...field,
    label: t(field.label),
    placeholder: field.placeholder ? t(field.placeholder) : undefined,
    helper: field.helper ? t(field.helper) : undefined,
    options: field.options?.map((option) => ({ ...option, label: t(option.label) })),
  }))

  function openEditor(record?: AdminEditableRecord) {
    setEditing(record ?? null)
    setEditorError(null)
    setDialogOpen(true)
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const next: AdminEditableRecord = {
      ...(editing ?? {}),
      id: editing?.id || createAdminId(singularLabel.toLocaleLowerCase('vi').replaceAll(' ', '-')),
    }

    fields.forEach((field) => {
      if (field.type === 'image') return
      if (field.type === 'checkbox') {
        next[field.key] = formData.get(field.key) === 'on'
        return
      }
      const rawValue = String(formData.get(field.key) ?? '')
      next[field.key] = field.type === 'number' ? Number(rawValue) : rawValue
    })

    const missingImage = fields.find((field) => field.type === 'image' && field.required && !next[field.key])
    if (missingImage) {
      setEditorError(`Vui lòng tải ${missingImage.label.toLocaleLowerCase('vi')}.`)
      return
    }

    onSave(next)
    setDialogOpen(false)
    setEditing(null)
  }

  return (
    <>
      <AdminPageHeading
        title={title}
        description={description}
        action={!readOnly ? (
          <button className="admin-button admin-button--primary" type="button" onClick={() => openEditor()}>
            <Plus size={17} weight="bold" /> {addLabel ? t(addLabel) : `${t('Thêm')} ${t(singularLabel)}`}
          </button>
        ) : undefined}
      />

      <AdminPanel className="admin-toolbar">
        <label>
          <MagnifyingGlass size={17} />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t(searchPlaceholder)} />
        </label>
      </AdminPanel>

      <AdminPanel className="admin-table-panel">
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                {columns.map((column) => (
                  <th className={getAdminColumnClass(column)} key={column.key} scope="col">{t(column.label)}</th>
                ))}
                {!readOnly ? <th className="admin-table__cell--actions" scope="col">{t('Thao tác')}</th> : null}
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row) => (
                <tr key={row.id}>
                  {columns.map((column) => (
                    <td className={getAdminColumnClass(column)} key={column.key}>
                      {column.render ? column.render(row) : String(row[column.key] ?? '')}
                    </td>
                  ))}
                  {!readOnly ? (
                    <td className="admin-table__cell--actions">
                      <div className="admin-row-actions">
                        <button type="button" onClick={() => openEditor(row)} aria-label={`${t('Sửa')} ${t(singularLabel)}`}><PencilSimple size={17} /></button>
                        <button type="button" className="is-danger" onClick={() => setDeleting(row)} aria-label={`${t('Xóa')} ${t(singularLabel)}`}><Trash size={17} /></button>
                      </div>
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
          {filteredRows.length === 0 ? (
            <div className="admin-empty"><Package size={30} /><p>{t('Chưa có dữ liệu phù hợp.')}</p></div>
          ) : null}
        </div>
      </AdminPanel>

      {dialogOpen ? (
        <div className="admin-dialog-backdrop" role="presentation" onMouseDown={() => setDialogOpen(false)}>
          <section className="admin-dialog" role="dialog" aria-modal="true" aria-labelledby="admin-editor-title" onMouseDown={(event) => event.stopPropagation()}>
            <header>
              <div><h2 id="admin-editor-title">{editing ? `${t('Cập nhật')} ${t(singularLabel)}` : `${t('Thêm')} ${t(singularLabel)}`}</h2><p>{t('Dữ liệu được lưu ngay sau khi xác nhận.')}</p></div>
              <button type="button" onClick={() => setDialogOpen(false)} aria-label={t('Đóng')}><X size={19} /></button>
            </header>
            <form onSubmit={submit}>
              <div className="admin-dialog__body">
                {editorError ? <p className="admin-form-error" role="alert">{editorError}</p> : null}
                {translatedFields.map((field) => {
                  const initialValue = editing?.[field.key]
                  if (field.type === 'image') {
                    return (
                      <AdminImageUpload
                        key={field.key}
                        id={`admin-field-${field.key}`}
                        label={field.label}
                        value={String(initialValue ?? '')}
                        onChange={(value) => setEditing((current) => ({ ...(current ?? { id: '' }), [field.key]: value }))}
                        helper={field.helper}
                        required={field.required}
                      />
                    )
                  }
                  if (field.type === 'checkbox') {
                    return <label className="admin-check-field" key={field.key}><input name={field.key} type="checkbox" defaultChecked={Boolean(initialValue)} /><span>{field.label}</span></label>
                  }
                  return (
                    <label className="admin-field" key={field.key}>
                      <span>{field.label}{field.required ? <b>*</b> : null}</span>
                      {field.type === 'textarea' ? (
                        <textarea name={field.key} defaultValue={String(initialValue ?? '')} placeholder={field.placeholder} required={field.required} />
                      ) : field.type === 'select' ? (
                        <AdminSelect
                          key={`${field.key}-${String(initialValue ?? field.options?.[0]?.value ?? '')}`}
                          name={field.key}
                          defaultValue={String(initialValue ?? field.options?.[0]?.value ?? '')}
                          options={field.options ?? []}
                          required={field.required}
                          aria-label={field.label}
                        />
                      ) : (
                        <input name={field.key} type={field.type ?? 'text'} defaultValue={String(initialValue ?? '')} placeholder={field.placeholder} required={field.required} />
                      )}
                      {field.helper ? <small>{field.helper}</small> : null}
                    </label>
                  )
                })}
              </div>
              <footer><button className="admin-button" type="button" onClick={() => setDialogOpen(false)}>{t('Hủy')}</button><button className="admin-button admin-button--primary" type="submit">{t('Lưu thay đổi')}</button></footer>
            </form>
          </section>
        </div>
      ) : null}

      {deleting ? (
        <div className="admin-dialog-backdrop" role="presentation" onMouseDown={() => setDeleting(null)}>
          <section className="admin-dialog admin-dialog--confirm" role="alertdialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
            <header><div><h2>{t('Xóa')} {t(singularLabel)}?</h2><p>{t('Dữ liệu này sẽ bị gỡ khỏi bản quản trị cục bộ.')}</p></div></header>
            <footer><button className="admin-button" type="button" onClick={() => setDeleting(null)}>{t('Giữ lại')}</button><button className="admin-button admin-button--danger" type="button" onClick={() => { onDelete(deleting.id); setDeleting(null) }}>{t('Xóa dữ liệu')}</button></footer>
          </section>
        </div>
      ) : null}
    </>
  )
}
