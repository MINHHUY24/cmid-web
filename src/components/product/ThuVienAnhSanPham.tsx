import { ArrowsOutSimple, ImageSquare } from '@phosphor-icons/react'
import { useMemo, useState } from 'react'
import type { ProductImage, ProductModel3D } from '../../types/product'

interface ThuVienAnhSanPhamProps {
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
      altText: image.altText ?? productName,
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
  productName,
  images,
  models3D,
}: ThuVienAnhSanPhamProps) {
  const galleryImages = useMemo(
    () => createGalleryImages(productName, images, models3D),
    [images, models3D, productName],
  )
  const [selectedImageId, setSelectedImageId] = useState(galleryImages[0]?.id ?? '')
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null)
  const selectedImage =
    galleryImages.find((image) => image.id === selectedImageId) ?? galleryImages[0]
  const hasImageError = selectedImage?.imageUrl === failedImageUrl

  return (
    <section className="product-gallery" aria-label={`Thư viện ảnh ${productName}`}>
      <div className="product-gallery__main">
        {selectedImage && !hasImageError ? (
          <img
            src={selectedImage.imageUrl}
            alt={selectedImage.altText}
            onError={() => setFailedImageUrl(selectedImage.imageUrl)}
          />
        ) : (
          <div className="product-gallery__empty">
            <ImageSquare size={58} weight="thin" aria-hidden="true" />
            <span>Chưa có ảnh sản phẩm</span>
          </div>
        )}
        <span className="product-gallery__expand" aria-label="Ảnh sản phẩm">
          <ArrowsOutSimple size={20} aria-hidden="true" />
        </span>
      </div>

      {galleryImages.length > 0 ? (
        <div className="product-gallery__thumbnails" aria-label="Chọn ảnh sản phẩm">
          {galleryImages.map((image) => (
            <button
              key={image.id}
              className={
                image.id === selectedImage?.id
                  ? 'product-gallery__thumbnail product-gallery__thumbnail--active'
                  : 'product-gallery__thumbnail'
              }
              type="button"
              aria-label={`Xem ${image.altText}`}
              aria-pressed={image.id === selectedImage?.id}
              onClick={() => {
                setSelectedImageId(image.id)
              }}
            >
              <img src={image.imageUrl} alt="" />
            </button>
          ))}
        </div>
      ) : null}
    </section>
  )
}
