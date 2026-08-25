import { ImageSquare, Trash, UploadSimple } from '@phosphor-icons/react'
import { useRef, useState, type ChangeEvent } from 'react'
import { getAdminDataMode, uploadAdminImage } from '../../services/admin.service'

interface AdminImageUploadProps {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  helper?: string
  required?: boolean
  accept?: string
  maxSizeMb?: number
}

export function AdminImageUpload({
  id,
  label,
  value,
  onChange,
  helper = 'JPG, PNG hoặc WEBP, tối đa 6 MB.',
  required = false,
  accept = 'image/jpeg,image/png,image/webp,image/avif',
  maxSizeMb = 6,
}: AdminImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Tệp đã chọn không phải là hình ảnh.')
      return
    }

    if (file.size > maxSizeMb * 1024 * 1024) {
      setError(`Ảnh không được vượt quá ${maxSizeMb} MB.`)
      return
    }

    try {
      setIsUploading(true)
      onChange(await uploadAdminImage(file))
      setError(null)
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Không thể tải ảnh lên.')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="admin-upload-field">
      <div className="admin-upload-field__label">
        <label htmlFor={id}>
          {label}
          {required ? <b>*</b> : null}
        </label>
        {value ? (
          <button type="button" onClick={() => onChange('')}>
            <Trash size={16} /> Xóa ảnh
          </button>
        ) : null}
      </div>

      <button
        type="button"
        className={`admin-upload-dropzone${value ? ' has-image' : ''}`}
        onClick={() => inputRef.current?.click()}
        disabled={isUploading}
      >
        {value ? (
          <img src={value} alt="Ảnh xem trước" />
        ) : (
          <>
            <span><ImageSquare size={30} weight="thin" /></span>
            <strong>{isUploading ? 'Đang tải ảnh...' : 'Chọn ảnh từ thiết bị'}</strong>
            <small>Bấm để chọn ảnh và tải lên</small>
          </>
        )}
        {value ? <i><UploadSimple size={17} /> Thay ảnh</i> : null}
      </button>

      <input
        ref={inputRef}
        id={id}
        className="sr-only"
        type="file"
        accept={accept}
        onChange={handleFile}
      />
      <small className="admin-upload-field__helper">
        {helper} Chế độ dữ liệu: {getAdminDataMode() === 'backend' ? 'API quản trị' : 'bản demo cục bộ'}.
      </small>
      {error ? <p className="admin-upload-field__error" role="alert">{error}</p> : null}
    </div>
  )
}
