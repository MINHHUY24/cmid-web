/*
 * Vai trò: Bọc `<model-viewer>` để xem GLB/AR an toàn trong React.
 */
import { useEffect, useRef, useState } from 'react'
import { KhungXuong } from '../common/KhungXuong'
import { PRODUCT_MODEL_CAMERA_LIMITS } from './model-viewer-config'

export function ProductModelViewer({ src, poster, name }: { src: string; poster?: string; name: string }) {
  const ref = useRef<HTMLElement>(null)
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let current = true
    void import('@google/model-viewer')
      .then(() => { if (current) setReady(true) })
      .catch(() => { if (current) setFailed(true) })
    return () => { current = false }
  }, [])

  useEffect(() => {
    const viewer = ref.current
    if (!viewer) return
    const onError = () => setFailed(true)
    viewer.addEventListener('error', onError)
    return () => viewer.removeEventListener('error', onError)
  }, [ready])

  return (
    <div className="product-model-viewer">
      {failed ? (
        <p role="alert">Không mở được mô hình 3D. Hãy thử tải lại hoặc tạo mô hình mới.</p>
      ) : ready ? (
        <model-viewer
          ref={ref} src={src} poster={poster} alt={`Mô hình 3D ${name}`}
          camera-controls="" touch-action="pan-y" shadow-intensity="1"
          exposure="1" loading="eager" reveal="auto"
          {...PRODUCT_MODEL_CAMERA_LIMITS}
          style={{ width: '100%', height: '100%', minHeight: 320 }}
        />
      ) : (
        <div className="product-model-viewer__loading" role="status" aria-live="polite" aria-busy="true">
          <span className="sr-only">Đang tải trình xem 3D</span>
          <KhungXuong className="product-model-viewer__skeleton" />
        </div>
      )}
    </div>
  )
}
