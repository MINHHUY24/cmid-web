import { ImageSquare, Trash, UploadSimple } from '@phosphor-icons/react'
import { useRef, useState, type ChangeEvent, type DragEvent } from 'react'
import { KhungXuong } from '../../components/common/KhungXuong'
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
  disabled?: boolean
  showDataMode?: boolean
  onUploadingChange?: (uploading: boolean) => void
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
  disabled = false,
  showDataMode = true,
  onUploadingChange,
}: AdminImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const dragDepth = useRef(0)
  const [error, setError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  async function uploadFile(file: File | undefined) {
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
      onUploadingChange?.(true)
      onChange(await uploadAdminImage(file))
      setError(null)
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Không thể tải ảnh lên.')
    } finally {
      setIsUploading(false)
      onUploadingChange?.(false)
    }
  }

  function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    void uploadFile(file)
  }

  function isFileDrag(event: DragEvent<HTMLButtonElement>) {
    return Array.from(event.dataTransfer.types).includes('Files')
  }

  function handleDragEnter(event: DragEvent<HTMLButtonElement>) {
    if (disabled || isUploading || !isFileDrag(event)) return
    event.preventDefault()
    dragDepth.current += 1
    setIsDragging(true)
  }

  function handleDragOver(event: DragEvent<HTMLButtonElement>) {
    if (disabled || isUploading || !isFileDrag(event)) return
    event.preventDefault()
    event.dataTransfer.dropEffect = 'copy'
  }

  function handleDragLeave(event: DragEvent<HTMLButtonElement>) {
    if (!isFileDrag(event)) return
    dragDepth.current = Math.max(0, dragDepth.current - 1)
    if (dragDepth.current === 0) setIsDragging(false)
  }

  function handleDrop(event: DragEvent<HTMLButtonElement>) {
    if (disabled || isUploading || !isFileDrag(event)) return
    event.preventDefault()
    dragDepth.current = 0
    setIsDragging(false)
    void uploadFile(event.dataTransfer.files[0])
  }

  return (
    <div className="admin-upload-field">
      <div className="admin-upload-field__label">
        <label htmlFor={id}>
          {label}
          {required ? <b>*</b> : null}
        </label>
        {value ? (
          <button type="button" disabled={disabled || isUploading} onClick={() => onChange('')}>
            <Trash size={16} /> Xóa ảnh
          </button>
        ) : null}
      </div>

      <button
        type="button"
        className={`admin-upload-dropzone${value ? ' has-image' : ''}${isDragging ? ' is-dragging' : ''}`}
        onClick={() => inputRef.current?.click()}
        disabled={disabled || isUploading}
        aria-label={`Chọn ảnh: ${label}`}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {isUploading ? (
          <>
            <span className="sr-only" role="status">Đang tải ảnh</span>
            <KhungXuong className="admin-upload-dropzone__skeleton" />
          </>
        ) : value ? (
          <img src={value} alt={`Ảnh xem trước: ${label}`} />
        ) : (
          <>
            <span><ImageSquare size={30} weight="thin" /></span>
            <strong>{isDragging ? 'Thả ảnh vào đây' : 'Chọn ảnh từ thiết bị'}</strong>
            <small>{isDragging ? 'Thả để tải ảnh lên' : 'Bấm hoặc kéo thả ảnh để tải lên'}</small>
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
        disabled={disabled || isUploading}
      />
      <small className="admin-upload-field__helper">
        {helper}{showDataMode ? ` Chế độ dữ liệu: ${getAdminDataMode() === 'backend' ? 'API quản trị' : 'bản demo cục bộ'}.` : ''}
      </small>
      {error ? <p className="admin-upload-field__error" role="alert">{error}</p> : null}
    </div>
  )
}
