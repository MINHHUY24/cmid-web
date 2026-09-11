import { Cube, FloppyDisk, Play, Trash } from '@phosphor-icons/react'
import { useEffect, useRef, useState } from 'react'
import { ProductModelViewer } from '../../components/product/ProductModelViewer'
import {
  cancelTrellisJob, createTrellisJob, getTrellisHealth, getTrellisJob, saveTrellisModel,
  TrellisApiError, type SavedTrellisModel, type TrellisJob,
} from '../../services/trellis.service'

interface Props {
  images: string[]
  productName: string
  productKey: string
  modelUrl: string
  onSaved: (model: SavedTrellisModel) => void
  onRemove: () => void
  onBusyChange: (busy: boolean) => void
}

function restoreJob(key: string): string | null {
  try { return window.sessionStorage.getItem(key) } catch { return null }
}

function rememberJob(key: string, id: string) {
  try { window.sessionStorage.setItem(key, id) } catch { /* The running page still tracks the job. */ }
}

export function AdminTrellisModel({ images, productName, productKey, modelUrl, onSaved, onRemove, onBusyChange }: Props) {
  const storageKey = `cmid-trellis-job:${productKey}`
  const [jobId, setJobId] = useState(() => restoreJob(storageKey))
  const [job, setJob] = useState<TrellisJob | null>(null)
  const [connection, setConnection] = useState<'checking' | 'ready' | 'offline'>('checking')
  const [isStarting, setIsStarting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const [steps, setSteps] = useState(12)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const uploadController = useRef<AbortController | null>(null)
  const viewCount = images.slice(0, 4).filter(Boolean).length
  const running = Boolean(jobId && (!job || job.state === 'loading' || job.state === 'generating'))
  const busy = isStarting || running || isSaving || isCancelling
  const pendingPreview = job?.state === 'completed' ? job.previewUrl : null
  const previewUrl = pendingPreview || modelUrl
  const isAttached = Boolean(job?.savedUrl && modelUrl === job.savedUrl)

  useEffect(() => { onBusyChange(busy) }, [busy, onBusyChange])

  useEffect(() => {
    let current = true
    void getTrellisHealth()
      .then((health) => { if (current) setConnection(health.ready ? 'ready' : 'offline') })
      .catch(() => { if (current) setConnection('offline') })
    return () => { current = false; uploadController.current?.abort() }
  }, [])

  useEffect(() => {
    if (!jobId) return
    const controller = new AbortController()
    let timer: ReturnType<typeof setTimeout> | undefined
    async function poll() {
      try {
        const next = await getTrellisJob(jobId!, controller.signal)
        if (controller.signal.aborted) return
        setJob(next)
        setConnection('ready')
        setError(null)
        if (next.state === 'loading' || next.state === 'generating') timer = setTimeout(() => void poll(), 2000)
      } catch (caught) {
        if (controller.signal.aborted) return
        setError(caught instanceof Error ? caught.message : 'Không lấy được trạng thái TRELLIS.')
        if (caught instanceof TrellisApiError && caught.status === 404) {
          setJobId(null)
          setJob(null)
          rememberJob(storageKey, '')
          return
        }
        setConnection('offline')
        timer = setTimeout(() => void poll(), 5000)
      }
    }
    void poll()
    return () => { controller.abort(); clearTimeout(timer) }
  }, [jobId, storageKey])

  async function checkConnection() {
    setConnection('checking')
    try {
      const health = await getTrellisHealth()
      setConnection(health.ready ? 'ready' : 'offline')
    } catch { setConnection('offline') }
  }

  async function generate() {
    if (!images[0] || busy) return
    setError(null)
    setNotice(null)
    setIsStarting(true)
    uploadController.current = new AbortController()
    try {
      const next = await createTrellisJob(images, steps, uploadController.current.signal)
      rememberJob(storageKey, next.id)
      setJob(next)
      setJobId(next.id)
    } catch (caught) {
      if (!uploadController.current.signal.aborted) setError(caught instanceof Error ? caught.message : 'Không tạo được mô hình.')
    } finally { setIsStarting(false) }
  }

  async function cancel() {
    if (!jobId) return
    setIsCancelling(true)
    try { setJob(await cancelTrellisJob(jobId)) }
    catch (caught) { setError(caught instanceof Error ? caught.message : 'Không dừng được lượt tạo.') }
    finally { setIsCancelling(false) }
  }

  async function save() {
    if (!job || job.state !== 'completed') return
    setIsSaving(true)
    setError(null)
    try {
      const saved = await saveTrellisModel(job.id)
      onSaved(saved)
      setJob({ ...job, savedUrl: saved.modelUrl })
      setNotice('Đã lưu tệp 3D. Bấm “Lưu sản phẩm” để áp dụng mô hình cho sản phẩm này.')
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Không lưu được mô hình.') }
    finally { setIsSaving(false) }
  }

  return (
    <section className="admin-trellis" aria-label="Tạo mô hình 3D">
      <div className="admin-trellis__heading">
        <div><h3><Cube size={22} /> Mô hình 3D</h3><p>Tạo bằng TRELLIS từ ảnh sản phẩm, xoay xem trước rồi lưu khi ưng ý.</p></div>
        <span className={`admin-trellis__connection is-${connection}`} role="status">
          {connection === 'ready' ? 'TRELLIS đã kết nối' : connection === 'checking' ? 'Đang kết nối…' : 'TRELLIS chưa kết nối'}
        </span>
      </div>
      <p className="admin-trellis__hint">
        {viewCount ? `Đã có ${viewCount}/4 góc ảnh. ` : ''}
        Ảnh mặt trước là bắt buộc. Thêm đủ bốn góc để mô hình có nhiều thông tin hơn; ảnh bổ sung dùng cho thư viện sản phẩm.
      </p>
      <div className="admin-trellis__controls">
        <label className="admin-field"><span>Chất lượng tạo hình</span>
          <select value={steps} onChange={(event) => setSteps(Number(event.target.value))} disabled={busy}>
            <option value={12}>Tiêu chuẩn</option><option value={8}>Tạo nhanh</option>
          </select>
        </label>
        <button className="admin-button admin-button--primary" type="button" disabled={!images[0] || busy || connection !== 'ready'} onClick={() => void generate()}>
          <Play size={17} /> {isStarting ? 'Đang gửi ảnh…' : running ? 'Đang tạo mô hình…' : job?.state === 'completed' ? 'Tạo lại mô hình 3D' : 'Tạo mô hình 3D'}
        </button>
        {running ? <button className="admin-button" type="button" disabled={isCancelling} onClick={() => void cancel()}>{isCancelling ? 'Đang dừng…' : 'Dừng tạo'}</button> : null}
        {connection === 'offline' ? <button className="admin-button" type="button" onClick={() => void checkConnection()}>Kết nối lại</button> : null}
      </div>
      {job ? <p className={`admin-trellis__status${running ? ' is-running' : ''}`} role={job.state === 'failed' ? 'alert' : 'status'}>{job.message}</p> : null}
      {previewUrl ? (
        <>
          <ProductModelViewer key={previewUrl} src={previewUrl} poster={images[0]} name={productName || 'sản phẩm'} />
          <p className="admin-trellis__hint">Kéo để xoay · Cuộn hoặc chụm hai ngón để thu phóng</p>
          <div className="admin-trellis__actions">
            {pendingPreview ? <button className="admin-button admin-button--primary" type="button" disabled={busy || isAttached} onClick={() => void save()}>
              <FloppyDisk size={17} /> {isSaving ? 'Đang lưu…' : isAttached ? 'Đã chọn dùng cho sản phẩm' : 'Lưu mô hình để sử dụng'}
            </button> : null}
            {modelUrl ? <button className="admin-button" type="button" disabled={busy} onClick={() => { onRemove(); setNotice('Đã bỏ mô hình khỏi sản phẩm. Bấm “Lưu sản phẩm” để áp dụng.') }}><Trash size={16} /> Bỏ mô hình đang dùng</button> : null}
          </div>
        </>
      ) : <div className="admin-trellis__empty"><Cube size={40} weight="thin" /><span>Mô hình 3D sẽ xuất hiện ở đây sau khi tạo xong.</span></div>}
      {notice ? <p className="admin-trellis__hint" role="status">{notice}</p> : null}
      {error ? <p className="admin-upload-field__error" role="alert">{error}</p> : null}
    </section>
  )
}
