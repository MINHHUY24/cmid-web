import { ArrowLeft, ArrowsOutSimple, Cube } from '@phosphor-icons/react'
import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { KhungXuong } from '../components/common/KhungXuong'
import { StatusPanel } from '../components/common/KhunTranThai'
import { Seo } from '../components/common/Seo'
import { PRODUCT_MODEL_CAMERA_LIMITS } from '../components/product/model-viewer-config'
import { useLanguage } from '../contexts/NgonNguContext'
import { useProduct } from '../hooks/useProduct'
import { getProductName } from '../utils/localizeProduct'

type ModelViewerWithAR = HTMLElement & {
  canActivateAR?: boolean
  activateAR?: () => Promise<void>
}

function TraiNghiem3DKhungXuong() {
  return (
    <main className="product-3d-experience product-3d-experience--loading" role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">Đang tải trải nghiệm 3D</span>
      <header className="product-3d-experience__header" aria-hidden="true">
        <KhungXuong className="product-3d-experience__skeleton-back" />
        <div className="product-3d-experience__skeleton-title"><KhungXuong /><KhungXuong /></div>
        <KhungXuong className="product-3d-experience__skeleton-mode" />
      </header>
      <section className="product-3d-experience__stage" aria-hidden="true">
        <KhungXuong className="product-3d-experience__stage-skeleton" />
      </section>
      <footer className="product-3d-experience__controls" aria-hidden="true">
        <KhungXuong className="product-3d-experience__skeleton-instruction" />
        <KhungXuong className="product-3d-experience__skeleton-action" />
      </footer>
    </main>
  )
}

export function TrangTraiNghiem3D() {
  const { id } = useParams()
  const productId = Number(id)
  const { product, isLoading, errorMessage, retry } = useProduct(productId)
  const { language } = useLanguage()
  const [viewerReady, setViewerReady] = useState(false)
  const [viewerError, setViewerError] = useState<string | null>(null)
  const [isOpeningAR, setIsOpeningAR] = useState(false)
  const viewerRef = useRef<HTMLElement>(null)
  const model = product?.models3D.find((item) => item.isActive && item.modelUrl)
  const productName = product ? getProductName(product, language) : ''
  const productPath = Number.isSafeInteger(productId) ? `/products/${productId}` : '/products'

  useEffect(() => {
    let current = true
    void import('@google/model-viewer')
      .then(() => { if (current) setViewerReady(true) })
      .catch(() => { if (current) setViewerError('Không tải được trình xem 3D.') })
    return () => { current = false }
  }, [])

  async function openAR() {
    const viewer = viewerRef.current as ModelViewerWithAR | null
    if (!viewer?.activateAR) {
      setViewerError('Thiết bị này chưa sẵn sàng để mở AR.')
      return
    }

    setViewerError(null)
    setIsOpeningAR(true)
    try {
      await viewer.activateAR()
    } catch {
      setViewerError('Không thể mở AR trên thiết bị này. Hãy dùng Chrome trên Android hoặc Safari trên iPhone/iPad.')
    } finally {
      setIsOpeningAR(false)
    }
  }

  if (isLoading) {
    return <TraiNghiem3DKhungXuong />
  }

  if (errorMessage) {
    return (
      <main className="product-3d-experience product-3d-experience--status">
        <StatusPanel title="Không thể tải mô hình 3D" tone="error">
          <p>{errorMessage}</p>
          <button className="button button--small" type="button" onClick={retry}>Thử lại</button>
        </StatusPanel>
      </main>
    )
  }

  if (!product || !model) {
    return (
      <main className="product-3d-experience product-3d-experience--status">
        <StatusPanel title="Sản phẩm chưa có mô hình 3D">
          <p>CMID đang chuẩn bị trải nghiệm 3D cho sản phẩm này.</p>
          <Link className="button button--small button--gold" to={productPath}>Quay lại sản phẩm</Link>
        </StatusPanel>
      </main>
    )
  }

  return (
    <>
      <Seo
        title={`Trải nghiệm 3D ${productName} | CMID`}
        description={`Xem mô hình 3D của ${productName} tại CMID.`}
        language={language}
        canonicalPath={`${productPath}/3d`}
        image={model.posterUrl ?? undefined}
        robots="noindex,nofollow"
      />
      <main className="product-3d-experience">
        <header className="product-3d-experience__header">
          <Link className="product-3d-experience__back" to={productPath} aria-label={`Quay lại ${productName}`}>
            <ArrowLeft size={21} /> <span>Quay lại sản phẩm</span>
          </Link>
          <div className="product-3d-experience__title"><b>CMID</b><span>{productName}</span></div>
          <span className="product-3d-experience__mode"><Cube size={17} /> Xem đối tượng</span>
        </header>

        <section className="product-3d-experience__stage" aria-label={`Mô hình 3D ${productName}`}>
          {viewerError ? <p className="product-3d-experience__error" role="alert">{viewerError}</p> : null}
          {viewerReady ? (
            <model-viewer
              ref={viewerRef}
              src={model.modelUrl}
              poster={model.posterUrl ?? undefined}
              alt={`Mô hình 3D ${productName}`}
              camera-controls=""
              touch-action="pan-y"
              {...PRODUCT_MODEL_CAMERA_LIMITS}
              shadow-intensity="1"
              exposure="1"
              ar
              ar-modes="webxr scene-viewer quick-look"
              ar-scale="auto"
              xr-environment=""
              loading="eager"
              reveal="auto"
              onError={() => setViewerError('Không mở được mô hình 3D. Hãy quay lại trang sản phẩm và thử lại.')}
            />
          ) : (
            <div className="product-3d-experience__stage-loading" role="status" aria-live="polite" aria-busy="true">
              <span className="sr-only">Đang tải mô hình 3D</span>
              <KhungXuong className="product-3d-experience__stage-skeleton" />
            </div>
          )}
        </section>

        <footer className="product-3d-experience__controls">
          <p>Kéo để xoay · Cuộn hoặc chụm hai ngón để thu phóng</p>
          <button
            className="product-3d-experience__ar"
            type="button"
            disabled={!viewerReady || isOpeningAR}
            onClick={() => void openAR()}
          >
            <ArrowsOutSimple size={20} />
            {isOpeningAR ? 'Đang mở AR…' : 'Đặt thử bằng AR'}
          </button>
        </footer>
      </main>
    </>
  )
}
