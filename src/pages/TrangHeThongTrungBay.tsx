import showroomImage from '../assets/images/hero-showroom-cmid.png'
import { KhungDauTrang } from '../components/common/KhungDauTrang'
import { useLanguage } from '../contexts/NgonNguContext'

export function TrangHeThongShowroomPage() {
  const { content } = useLanguage()

  return (
    <main className="trang-noi-dung trang-he-thong-showroom">
      <KhungDauTrang
        title={content.showroom.title}
        description={content.showroom.description}
        image={showroomImage}
        imageAlt={content.showroom.title}
        actionLabel={content.showroom.browseProducts}
        actionHref="/products"
      />
    </main>
  )
}
