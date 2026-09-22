import {
  CaretLeft,
  CaretRight,
  Cube,
  ImageSquare,
  MagnifyingGlassMinus,
  MagnifyingGlassPlus,
  X,
} from '@phosphor-icons/react'
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import type { ProductImage, ProductModel3D } from '../../types/product'
import { useLanguage } from '../../contexts/NgonNguContext'

interface ThuVienAnhSanPhamProps {
  productId: number
  productName: string
  images: ProductImage[]
  models3D: ProductModel3D[]
}

interface AnhThuVien {
  id: string
  imageUrl: string
  altText: string
}

function createGalleryImages(
  productName: string,
  images: ProductImage[],
  models3D: ProductModel3D[],
): AnhThuVien[] {
  const productImages = [...images]
    .sort((firstImage, secondImage) => firstImage.sortOrder - secondImage.sortOrder)
    .map((image) => ({
      id: `image-${image.id}`,
      imageUrl: image.imageUrl,
      altText: image.altText?.trim() || productName,
    }))
  const posterImages = models3D
    .filter((model) => model.posterUrl)
    .map((model) => ({
      id: `model-${model.id}`,
      imageUrl: model.posterUrl as string,
      altText: `Hình mô phỏng ${productName}`,
    }))

  return [...productImages, ...posterImages].filter(
    (image, index, collection) =>
      collection.findIndex((otherImage) => otherImage.imageUrl === image.imageUrl) === index,
  )
}

export function ThuVienAnhSanPham({
  productId,
  productName,
  images,
  models3D,
}: ThuVienAnhSanPhamProps) {
  const { content, language } = useLanguage()
  const galleryImages = useMemo(
    () => createGalleryImages(productName, images, models3D),
    [images, models3D, productName],
  )
  const [selectedImageId, setSelectedImageId] = useState(galleryImages[0]?.id ?? '')
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null)
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false)
  const [viewerZoom, setViewerZoom] = useState(1)
  const viewerCloseButtonRef = useRef<HTMLButtonElement>(null)
  const closeImageViewerRef = useRef<() => void>(() => undefined)
  const selectImageAtOffsetRef = useRef<(offset: -1 | 1) => void>(() => undefined)
  const activeModels = models3D.filter((model) => model.isActive && model.modelUrl)
  const selectedImage =
    galleryImages.find((image) => image.id === selectedImageId) ?? galleryImages[0]
  const hasImageError = selectedImage?.imageUrl === failedImageUrl
  const galleryCopy = language === 'vi'
    ? {
        previous: 'Xem ảnh trước',
        next: 'Xem ảnh tiếp theo',
        open: 'Xem ảnh lớn',
        close: 'Đóng trình xem ảnh',
        zoomIn: 'Phóng to',
        zoomOut: 'Thu nhỏ',
        resetZoom: 'Đặt lại tỷ lệ ảnh',
        viewer: 'Trình xem ảnh sản phẩm',
      }
    : {
        previous: 'View previous image',
        next: 'View next image',
        open: 'View full-size image',
        close: 'Close image viewer',
        zoomIn: 'Zoom in',
        zoomOut: 'Zoom out',
        resetZoom: 'Reset image zoom',
        viewer: 'Product image viewer',
      }

  const setViewerScale = useCallback((nextScale: number) => {
    setViewerZoom(Math.min(4, Math.max(1, Number(nextScale.toFixed(2)))))
  }, [])

  const selectImageAtOffset = useCallback((offset: -1 | 1) => {
    if (galleryImages.length < 2) return

    const selectedIndex = Math.max(
      0,
      galleryImages.findIndex((image) => image.id === selectedImage?.id),
    )
    const nextIndex = (selectedIndex + offset + galleryImages.length) % galleryImages.length

    setSelectedImageId(galleryImages[nextIndex].id)
    setFailedImageUrl(null)
    setViewerZoom(1)
  }, [galleryImages, selectedImage?.id])

  function openImageViewer() {
    if (!selectedImage || hasImageError) return

    setViewerZoom(1)
    setIsImageViewerOpen(true)
  }

  const closeImageViewer = useCallback(() => {
    setIsImageViewerOpen(false)
    setViewerZoom(1)
  }, [])

  useEffect(() => {
    closeImageViewerRef.current = closeImageViewer
    selectImageAtOffsetRef.current = selectImageAtOffset
  }, [closeImageViewer, selectImageAtOffset])

  useEffect(() => {
    if (!isImageViewerOpen) return undefined

    const previouslyFocusedElement = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null
    const previousOverflow = document.body.style.overflow
    const previousPaddingRight = document.body.style.paddingRight
    const scrollbarWidth = Math.max(0, window.innerWidth - document.documentElement.clientWidth)
    const focusFrame = window.requestAnimationFrame(() => viewerCloseButtonRef.current?.focus())

    function handleViewerKeydown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        closeImageViewerRef.current()
        return
      }

      if (event.key === 'ArrowLeft') {
        event.preventDefault()
        selectImageAtOffsetRef.current(-1)
        return
      }

      if (event.key === 'ArrowRight') {
        event.preventDefault()
        selectImageAtOffsetRef.current(1)
        return
      }

      if (event.key === '+' || event.key === '=') {
        event.preventDefault()
        setViewerZoom((currentZoom) => Math.min(4, currentZoom + 0.25))
        return
      }

      if (event.key === '-') {
        event.preventDefault()
        setViewerZoom((currentZoom) => Math.max(1, currentZoom - 0.25))
      }
    }

    document.body.style.overflow = 'hidden'
    if (scrollbarWidth > 0) document.body.style.paddingRight = `${scrollbarWidth}px`
    document.addEventListener('keydown', handleViewerKeydown)

    return () => {
      window.cancelAnimationFrame(focusFrame)
      document.removeEventListener('keydown', handleViewerKeydown)
      document.body.style.overflow = previousOverflow
      document.body.style.paddingRight = previousPaddingRight

      if (previouslyFocusedElement?.isConnected) {
        previouslyFocusedElement.focus({ preventScroll: true })
      }
    }
  }, [isImageViewerOpen])

  const modalRoot = typeof document === 'undefined'
    ? null
    : document.getElementById('site-modal-root') ?? document.body

  return (
    <>
      <section className="product-gallery" aria-label={`${productName} gallery`}>
        <div
          className={
            selectedImage && !hasImageError
              ? 'product-gallery__main product-gallery__main--image'
              : 'product-gallery__main product-gallery__main--empty'
          }
        >
          {selectedImage && !hasImageError ? (
            <>
              <button
                className="product-gallery__main-image-button"
                type="button"
                aria-label={`${galleryCopy.open}: ${selectedImage.altText}`}
                onClick={openImageViewer}
              >
                <img
                  src={selectedImage.imageUrl}
                  alt={selectedImage.altText}
                  draggable={false}
                  decoding="async"
                  onDragStart={(event) => event.preventDefault()}
                  onError={() => setFailedImageUrl(selectedImage.imageUrl)}
                />
              </button>

              {galleryImages.length > 1 ? (
                <div className="product-gallery__navigation" aria-label={`${productName} image navigation`}>
                  <button
                    className="product-gallery__navigation-button product-gallery__navigation-button--previous"
                    type="button"
                    aria-label={galleryCopy.previous}
                    onClick={() => selectImageAtOffset(-1)}
                  >
                    <CaretLeft size={25} weight="bold" aria-hidden="true" />
                  </button>
                  <button
                    className="product-gallery__navigation-button product-gallery__navigation-button--next"
                    type="button"
                    aria-label={galleryCopy.next}
                    onClick={() => selectImageAtOffset(1)}
                  >
                    <CaretRight size={25} weight="bold" aria-hidden="true" />
                  </button>
                </div>
              ) : null}
            </>
          ) : (
            <div className="product-gallery__empty">
              <ImageSquare size={58} weight="thin" aria-hidden="true" />
              <span>{content.product.noImage}</span>
            </div>
          )}
        </div>

        {galleryImages.length > 0 ? (
          <div className="product-gallery__thumbnails" aria-label={`${productName} images`}>
            {galleryImages.map((image) => (
              <button
                key={image.id}
                className={
                  image.id === selectedImage?.id
                    ? 'product-gallery__thumbnail product-gallery__thumbnail--active'
                    : 'product-gallery__thumbnail'
                }
                type="button"
                aria-label={content.product.viewDetail(image.altText)}
                aria-pressed={image.id === selectedImage?.id}
                onClick={() => {
                  setSelectedImageId(image.id)
                  setFailedImageUrl(null)
                }}
              >
                <img
                  src={image.imageUrl}
                  alt=""
                  draggable={false}
                  loading="lazy"
                  decoding="async"
                  onDragStart={(event) => event.preventDefault()}
                />
              </button>
            ))}
            {activeModels.map((model) => (
              <Link
                key={`viewer-${model.id}`}
                className="product-gallery__thumbnail product-gallery__thumbnail--model"
                aria-label={`Mở trang trải nghiệm 3D của ${productName}`}
                to={`/products/${productId}/3d`}
              ><Cube size={24} /><span>3D</span></Link>
            ))}
          </div>
        ) : null}
      </section>

      {isImageViewerOpen && selectedImage && modalRoot
        ? createPortal(
            <div className="product-image-viewer" role="presentation" onMouseDown={closeImageViewer}>
              <section
                className="product-image-viewer__dialog"
                role="dialog"
                aria-modal="true"
                aria-label={galleryCopy.viewer}
                onMouseDown={(event) => event.stopPropagation()}
              >
                <header className="product-image-viewer__toolbar">
                  <span>{galleryImages.findIndex((image) => image.id === selectedImage.id) + 1} / {galleryImages.length}</span>
                  <div>
                    <button
                      type="button"
                      aria-label={galleryCopy.zoomOut}
                      disabled={viewerZoom <= 1}
                      onClick={() => setViewerScale(viewerZoom - 0.25)}
                    >
                      <MagnifyingGlassMinus size={20} weight="bold" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      aria-label={galleryCopy.zoomIn}
                      disabled={viewerZoom >= 4}
                      onClick={() => setViewerScale(viewerZoom + 0.25)}
                    >
                      <MagnifyingGlassPlus size={20} weight="bold" aria-hidden="true" />
                    </button>
                    <button
                      className="product-image-viewer__close"
                      ref={viewerCloseButtonRef}
                      type="button"
                      aria-label={galleryCopy.close}
                      onClick={closeImageViewer}
                    >
                      <X size={22} weight="bold" aria-hidden="true" />
                    </button>
                  </div>
                </header>

                <div
                  className="product-image-viewer__stage"
                  onDoubleClick={() => setViewerScale(viewerZoom === 1 ? 2 : 1)}
                  onWheel={(event) => {
                    event.preventDefault()
                    setViewerScale(viewerZoom + (event.deltaY < 0 ? 0.25 : -0.25))
                  }}
                >
                  <img
                    src={selectedImage.imageUrl}
                    alt={selectedImage.altText}
                    draggable={false}
                    style={{ '--product-image-viewer-scale': viewerZoom } as CSSProperties}
                    onDragStart={(event) => event.preventDefault()}
                  />
                </div>

                {galleryImages.length > 1 ? (
                  <>
                    <button
                      className="product-image-viewer__navigation product-image-viewer__navigation--previous"
                      type="button"
                      aria-label={galleryCopy.previous}
                      onClick={() => selectImageAtOffset(-1)}
                    >
                      <CaretLeft size={30} weight="bold" aria-hidden="true" />
                    </button>
                    <button
                      className="product-image-viewer__navigation product-image-viewer__navigation--next"
                      type="button"
                      aria-label={galleryCopy.next}
                      onClick={() => selectImageAtOffset(1)}
                    >
                      <CaretRight size={30} weight="bold" aria-hidden="true" />
                    </button>
                  </>
                ) : null}
              </section>
            </div>,
            modalRoot,
          )
        : null}
    </>
  )
}
