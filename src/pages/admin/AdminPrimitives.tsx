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
import { KhungXuong } from '../../components/common/KhungXuong'
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

export function AdminChiSoKhungXuong({ count = 4, label = 'Đang tải số liệu' }: { count?: number; label?: string }) {
  return (
    <div className="admin-kpi-grid admin-kpi-grid--skeleton" role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">{label}</span>
      {Array.from({ length: count }, (_, index) => (
        <article className="admin-metric admin-metric--skeleton" key={index} aria-hidden="true">
          <KhungXuong className="admin-metric__skeleton-icon" />
          <KhungXuong className="admin-metric__skeleton-label" />
          <KhungXuong className="admin-metric__skeleton-value" />
          <KhungXuong className="admin-metric__skeleton-helper" />
        </article>
      ))}
    </div>
  )
}

export function AdminBangKhungXuong({
  columns = 6,
  rows = 5,
  label = 'Đang tải dữ liệu',
  minWidth,
}: {
  columns?: number
  rows?: number
  label?: string
  minWidth?: number
}) {
  const rowStyle = {
    gridTemplateColumns: `repeat(${columns}, minmax(86px, 1fr))`,
  }
  const tableMinWidth = `${minWidth ?? Math.max(720, columns * 126)}px`

  return (
    <div className="admin-table-skeleton" role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">{label}</span>
      <div className="admin-table-skeleton__inner" aria-hidden="true" style={{ minWidth: tableMinWidth }}>
        <div className="admin-table-skeleton__row admin-table-skeleton__row--heading" style={rowStyle}>
          {Array.from({ length: columns }, (_, index) => <KhungXuong key={index} />)}
        </div>
        {Array.from({ length: rows }, (_, rowIndex) => (
          <div className="admin-table-skeleton__row" key={rowIndex} style={rowStyle}>
            {Array.from({ length: columns }, (_, columnIndex) => (
              <KhungXuong
                className={columnIndex === 0 ? 'admin-table-skeleton__primary' : columnIndex === columns - 1 ? 'admin-table-skeleton__action' : ''}
                key={columnIndex}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
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
  if (normalized.startsWith('chờ ') || ['chưa thanh toán', 'mới'].some((key) => normalized.includes(key))) return 'is-pending'
  if (normalized.includes('đã thanh toán')) return 'is-paid'
  if (normalized.includes('đã hoàn tiền')) return 'is-refunded'
  if (['inactive', 'không hoạt động', 'tạm ẩn', 'đã hủy', 'từ chối', 'locked', 'đã khóa', 'ngưng bán', 'hết hàng'].some((key) => normalized.includes(key))) return 'is-danger'
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
    const closeOnOutsideInteraction = (event: Event) => {
      const target = event.target
      if (!(target instanceof Node)) return
      if (!rootRef.current?.contains(target) && !menuRef.current?.contains(target)) setIsOpen(false)
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setIsOpen(false)
      triggerRef.current?.focus()
    }
    const updatePositionOnViewportScroll = (event: Event) => {
      // The menu itself is scrollable. Recalculating its position for that
      // scroll re-runs the selected-option centering effect and snaps the
      // menu back, which makes a long option list feel locked.
      if (menuRef.current?.contains(event.target as Node)) return
      updateMenuPosition()
    }
    // `pointerdown` covers modern browsers; the mouse/touch fallbacks also
    // close portal-rendered menus in embedded and older browser contexts.
    document.addEventListener('pointerdown', closeOnOutsideInteraction, true)
    document.addEventListener('mousedown', closeOnOutsideInteraction, true)
    document.addEventListener('touchstart', closeOnOutsideInteraction, true)
    document.addEventListener('keydown', closeOnEscape)
    window.addEventListener('resize', updateMenuPosition)
    window.addEventListener('scroll', updatePositionOnViewportScroll, true)
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideInteraction, true)
      document.removeEventListener('mousedown', closeOnOutsideInteraction, true)
      document.removeEventListener('touchstart', closeOnOutsideInteraction, true)
      document.removeEventListener('keydown', closeOnEscape)
      window.removeEventListener('resize', updateMenuPosition)
      window.removeEventListener('scroll', updatePositionOnViewportScroll, true)
    }
  }, [isOpen, updateMenuPosition])

  useEffect(() => {
    if (!isOpen || !menuPosition) return

    const menu = menuRef.current
    const selectedOption = menu?.querySelector<HTMLElement>('[aria-selected="true"]')
    if (!menu || !selectedOption) return

    const selectedCenter = selectedOption.offsetTop + selectedOption.offsetHeight / 2
    menu.scrollTop = Math.max(0, selectedCenter - menu.clientHeight / 2)
  }, [isOpen, menuPosition])

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

export interface AdminPermissionGroup {
  label: string
  permissions: Array<{ value: string; label: string }>
}

export interface AdminFieldConfig {
  key: string
  label: string
  type?: 'text' | 'email' | 'tel' | 'number' | 'password' | 'textarea' | 'select' | 'image' | 'checkbox' | 'permissions'
  required?: boolean
  requiredOnCreate?: boolean
  placeholder?: string
  suffix?: string
  action?: { label: string; onClick: () => void }
  permissionGroups?: AdminPermissionGroup[]
  options?: Array<{ value: string; label: string }>
  helper?: string
  readOnly?: boolean
}

export interface AdminColumnConfig {
  key: string
  label: string
  align?: 'left' | 'center' | 'right'
  render?: (record: AdminEditableRecord) => ReactNode
}

function getAdminColumnClass(column: AdminColumnConfig) {
  const alignment = column.align ?? (column.key === 'status' ? 'center' : 'left')
  return [
    `admin-table__cell--${column.key}`,
    alignment === 'left' ? '' : `admin-table__cell--${alignment}`,
  ].filter(Boolean).join(' ')
}

interface AdminCollectionManagerProps {
  title: string
  description: string
  singularLabel: string
  rows: AdminEditableRecord[]
  columns: AdminColumnConfig[]
  fields: AdminFieldConfig[]
  onSave: (record: AdminEditableRecord) => void | Promise<void>
  onDelete: (id: string) => void | Promise<void>
  allowCreate?: boolean
  allowDelete?: boolean
  deleteDescription?: string
  headingAction?: ReactNode
  searchPlaceholder?: string
  addLabel?: string
  readOnly?: boolean
  tableClassName?: string
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
  allowCreate = true,
  allowDelete = true,
  deleteDescription,
  headingAction,
  searchPlaceholder = 'Tìm kiếm...',
  addLabel,
  readOnly = false,
  tableClassName = '',
}: AdminCollectionManagerProps) {
  const { t } = useAdminCopy()
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<AdminEditableRecord | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleting, setDeleting] = useState<AdminEditableRecord | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [editorError, setEditorError] = useState<string | null>(null)
  const [inlineStatusError, setInlineStatusError] = useState<string | null>(null)
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null)

  const inlineStatusField = fields.find(
    (field) => field.key === 'status' && field.type === 'select' && (field.options?.length ?? 0) > 0,
  )

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
    permissionGroups: field.permissionGroups?.map((group) => ({
      ...group,
      label: t(group.label),
      permissions: group.permissions.map((permission) => ({ ...permission, label: t(permission.label) })),
    })),
  }))

  function openEditor(record?: AdminEditableRecord) {
    setEditing(record ?? null)
    setEditorError(null)
    setDialogOpen(true)
  }

  function requestDelete(record: AdminEditableRecord) {
    setDeleteError(null)
    setDeleting(record)
  }

  async function confirmDelete() {
    if (!deleting || isDeleting) return

    setDeleteError(null)
    setIsDeleting(true)
    try {
      await onDelete(deleting.id)
      setDeleting(null)
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : 'Không thể xóa dữ liệu.')
    } finally {
      setIsDeleting(false)
    }
  }

  async function updateInlineStatus(record: AdminEditableRecord, status: string) {
    if (!inlineStatusField || String(record.status ?? '') === status || updatingStatusId) return

    setInlineStatusError(null)
    setUpdatingStatusId(record.id)
    try {
      await onSave({ ...record, status })
    } catch (error) {
      setInlineStatusError(error instanceof Error ? error.message : 'Không thể cập nhật trạng thái.')
    } finally {
      setUpdatingStatusId(null)
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
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
      if (field.type === 'permissions') {
        next[field.key] = formData.getAll(field.key).map(String)
        return
      }
      const rawValue = String(formData.get(field.key) ?? '')
      const value = field.suffix ? `${rawValue.trim().split('@')[0]}${field.suffix}` : rawValue
      next[field.key] = field.type === 'number' ? Number(value) : value
    })

    const missingImage = fields.find((field) => field.type === 'image' && field.required && !next[field.key])
    if (missingImage) {
      setEditorError(`Vui lòng tải ${missingImage.label.toLocaleLowerCase('vi')}.`)
      return
    }

    try {
      await onSave(next)
      setDialogOpen(false)
      setEditing(null)
    } catch (error) {
      setEditorError(error instanceof Error ? error.message : 'Không thể lưu dữ liệu.')
    }
  }

  return (
    <>
      <AdminPageHeading
        title={title}
        description={description}
        action={!readOnly && allowCreate ? (
          <button className="admin-button admin-button--primary" type="button" onClick={() => openEditor()}>
            <Plus size={17} weight="bold" /> {addLabel ? t(addLabel) : `${t('Thêm')} ${t(singularLabel)}`}
          </button>
        ) : headingAction}
      />

      <AdminPanel className="admin-toolbar">
        <label>
          <MagnifyingGlass size={17} />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t(searchPlaceholder)} />
        </label>
      </AdminPanel>

      {inlineStatusError ? <p className="admin-form-error" role="alert">{inlineStatusError}</p> : null}

      <AdminPanel className="admin-table-panel">
        <div className="admin-table-wrap">
          <table className={`admin-table ${tableClassName}`.trim()}>
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
                      {column.key === 'status' && inlineStatusField && !readOnly ? (
                        <AdminSelect
                          className="admin-inline-select"
                          value={String(row.status ?? '')}
                          onChange={(status) => void updateInlineStatus(row, status)}
                          options={inlineStatusField.options ?? []}
                          disabled={updatingStatusId === row.id}
                          aria-label={`${t('Cập nhật trạng thái')} ${String(row.name ?? row.title ?? row.id)}`}
                        />
                      ) : column.render ? column.render(row) : String(row[column.key] ?? '')}
                    </td>
                  ))}
                  {!readOnly ? (
                    <td className="admin-table__cell--actions">
                      <div className="admin-row-actions">
                        <button type="button" onClick={() => openEditor(row)} aria-label={`${t('Sửa')} ${t(singularLabel)}`}><PencilSimple size={17} /></button>
                        {allowDelete ? <button type="button" className="is-danger" onClick={() => requestDelete(row)} aria-label={`${t('Xóa')} ${t(singularLabel)}`}><Trash size={17} /></button> : null}
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
                  const savedValue = String(editing?.[field.key] ?? '')
                  const initialValue = field.suffix ? savedValue.split('@')[0] : savedValue
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
                  if (field.type === 'permissions') {
                    const rawPermissions = editing?.[field.key]
                    const selected = new Set(Array.isArray(rawPermissions) ? rawPermissions.map(String) : [])
                    return (
                      <section className="admin-field admin-field--permissions" key={field.key}>
                        <span>{field.label}{field.required ? <b>*</b> : null}</span>
                        <div className="admin-permission-groups">
                          {field.permissionGroups?.map((group) => (
                            <fieldset key={group.label}>
                              <legend>{group.label}</legend>
                              <div>
                                {group.permissions.map((permission) => (
                                  <label className="admin-checkbox" key={permission.value}>
                                    <input name={field.key} type="checkbox" value={permission.value} defaultChecked={selected.has(permission.value)} />
                                    <span>{permission.label}</span>
                                  </label>
                                ))}
                              </div>
                            </fieldset>
                          ))}
                        </div>
                        {field.helper ? <small>{field.helper}</small> : null}
                      </section>
                    )
                  }
                  return (
                    <label className="admin-field" key={field.key}>
                      <span>{field.label}{field.required || (field.requiredOnCreate && !editing) ? <b>*</b> : null}</span>
                      {field.type === 'textarea' ? (
                        <textarea name={field.key} defaultValue={String(initialValue ?? '')} placeholder={field.placeholder} required={field.required || (field.requiredOnCreate && !editing)} readOnly={field.readOnly} />
                      ) : field.type === 'select' ? (
                        <AdminSelect
                          key={`${field.key}-${String(initialValue ?? field.options?.[0]?.value ?? '')}`}
                          name={field.key}
                          defaultValue={String(initialValue ?? field.options?.[0]?.value ?? '')}
                          options={field.options ?? []}
                          required={field.required || (field.requiredOnCreate && !editing)}
                          disabled={field.readOnly}
                          aria-label={field.label}
                        />
                      ) : (
                        field.suffix ? (
                          <div className="admin-input-suffix">
                            <input name={field.key} type="text" defaultValue={initialValue} placeholder={field.placeholder} required={field.required || (field.requiredOnCreate && !editing)} readOnly={field.readOnly} />
                            <span>{field.suffix}</span>
                          </div>
                        ) : (
                          <input name={field.key} type={field.type ?? 'text'} defaultValue={initialValue} placeholder={field.placeholder} required={field.required || (field.requiredOnCreate && !editing)} readOnly={field.readOnly} />
                        )
                      )}
                      {field.helper ? <small>{field.helper}</small> : null}
                      {field.action ? <button className="admin-field__action" type="button" onClick={field.action.onClick}><Plus size={15} weight="bold" /> {field.action.label}</button> : null}
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
        <div className="admin-dialog-backdrop" role="presentation" onMouseDown={() => { if (!isDeleting) setDeleting(null) }}>
          <section className="admin-dialog admin-dialog--confirm" role="alertdialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
            <header><div><h2>{t('Xóa')} {t(singularLabel)}?</h2><p>{t(deleteDescription ?? 'Dữ liệu này sẽ bị gỡ khỏi bản quản trị cục bộ.')}</p></div></header>
            {deleteError ? <p className="admin-form-error" role="alert">{deleteError}</p> : null}
            <footer><button className="admin-button" type="button" disabled={isDeleting} onClick={() => setDeleting(null)}>{t('Giữ lại')}</button><button className="admin-button admin-button--danger" type="button" disabled={isDeleting} onClick={() => void confirmDelete()}>{isDeleting ? t('Đang xóa...') : t('Xóa dữ liệu')}</button></footer>
          </section>
        </div>
      ) : null}
    </>
  )
}
