/*
 * Vai trò: Hiển thị hệ thống showroom/không gian trưng bày.
 */
/* Ảnh hero, component khung đầu trang và content theo ngôn ngữ. */
import showroomImage from "../../models/assets/images/hero-showroom-cmid.png";
import { KhungDauTrang } from "../components/common/KhungDauTrang";
import { useLanguage } from "../../controllers/state/NgonNguContext";

/* View showroom tối giản, tái dùng KhungDauTrang để nhất quán các trang public. */
export function TrangHeThongShowroomPage() {
  const { content } = useLanguage();

  /* Hero dẫn khách tới catalogue sau khi đọc phần giới thiệu showroom. */
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
  );
}
