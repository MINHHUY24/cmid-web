import {
  CheckCircle,
  MagnifyingGlass,
  Package,
  PencilSimple,
  Plus,
  Trash,
  X,
} from '@phosphor-icons/react'
import { useMemo, useState, type FormEvent, type ReactNode } from 'react'
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
  const normalized = children.toLocaleLowerCase('vi')
  let tone = 'is-muted'
  if (['active', 'đang bán', 'đã xuất bản', 'hoàn thành', 'hoàn tất', 'đã duyệt'].some((key) => normalized.includes(key))) tone = 'is-success'
  if (['chờ', 'đang xử lý', 'đang giao', 'đang hoàn', 'draft', 'nháp'].some((key) => normalized.includes(key))) tone = 'is-warning'
  if (['inactive', 'đã hủy', 'từ chối', 'locked', 'ngưng bán'].some((key) => normalized.includes(key))) tone = 'is-danger'
  return <span className={`admin-status ${tone}`}>{t(children)}</span>
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
        <span>{filteredRows.length} {t('bản ghi')}</span>
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
                        <select name={field.key} defaultValue={String(initialValue ?? field.options?.[0]?.value ?? '')} required={field.required}>
                          {field.options?.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                        </select>
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
