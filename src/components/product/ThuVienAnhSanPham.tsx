import { ArrowsOutSimple, Cube, ImageSquare } from '@phosphor-icons/react'
import { useMemo, useState } from 'react'
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
  const { content } = useLanguage()
  const galleryImages = useMemo(
    () => createGalleryImages(productName, images, models3D),
    [images, models3D, productName],
  )
  const [selectedImageId, setSelectedImageId] = useState(galleryImages[0]?.id ?? '')
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null)
  const activeModels = models3D.filter((model) => model.isActive && model.modelUrl)
  const selectedImage =
    galleryImages.find((image) => image.id === selectedImageId) ?? galleryImages[0]
  const hasImageError = selectedImage?.imageUrl === failedImageUrl

  return (
    <section className="product-gallery" aria-label={`${productName} gallery`}>
      <div className="product-gallery__main">
        {selectedImage && !hasImageError ? (
          <img
            src={selectedImage.imageUrl}
            alt={selectedImage.altText}
            decoding="async"
            onError={() => setFailedImageUrl(selectedImage.imageUrl)}
          />
        ) : (
          <div className="product-gallery__empty">
            <ImageSquare size={58} weight="thin" aria-hidden="true" />
            <span>{content.product.noImage}</span>
          </div>
        )}
        <span className="product-gallery__expand" aria-label={content.product.noImage}>
          <ArrowsOutSimple size={20} aria-hidden="true" />
        </span>
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
              }}
            >
              <img src={image.imageUrl} alt="" loading="lazy" decoding="async" />
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
  )
}
