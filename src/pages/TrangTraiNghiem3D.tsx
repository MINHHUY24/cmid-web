import { ArrowLeft, ArrowsOutSimple, Cube } from '@phosphor-icons/react'
import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { StatusPanel } from '../components/common/KhunTranThai'
import { Seo } from '../components/common/Seo'
import { useLanguage } from '../contexts/NgonNguContext'
import { useProducts } from '../hooks/useProducts'
import { getProductName } from '../utils/localizeProduct'

type ModelViewerWithAR = HTMLElement & {
  canActivateAR?: boolean
  activateAR?: () => Promise<void>
}

export function TrangTraiNghiem3D() {
  const { id } = useParams()
  const { products, isLoading, errorMessage, retry } = useProducts()
  const { language } = useLanguage()
  const [viewerReady, setViewerReady] = useState(false)
  const [viewerError, setViewerError] = useState<string | null>(null)
  const [isOpeningAR, setIsOpeningAR] = useState(false)
  const viewerRef = useRef<HTMLElement>(null)
  const productId = Number(id)
  const product = products.find((item) => item.id === productId)
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
    return <main className="product-3d-experience product-3d-experience--status"><p role="status">Đang tải trải nghiệm 3D…</p></main>
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
          ) : <p className="product-3d-experience__loading" role="status">Đang tải mô hình 3D…</p>}
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
