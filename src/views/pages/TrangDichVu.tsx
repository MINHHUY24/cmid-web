/*
 * Vai trò: Trang giới thiệu dịch vụ của CMID.
 */
/* Icon, ảnh và component dùng để trình bày các dịch vụ CMID. */
import {
  ClipboardTextIcon,
  CubeIcon,
  MedalIcon,
  ShoppingCartIcon,
} from "@phosphor-icons/react";
import heroImage from "../../models/assets/images/hero-dich-vu-cmid.png";
import storyImage from "../../models/assets/images/noi-that-phong-khach-cao-cap.jpg";
import { KhungDauTrang } from "../components/common/KhungDauTrang";
import { useLanguage } from "../../controllers/state/NgonNguContext";

/* Chỉ lưu số thứ tự/icon; text lấy từ content để hỗ trợ song ngữ. */
const dichVu = [
  { number: "01", icon: <ClipboardTextIcon size={27} weight="thin" /> },
  { number: "02", icon: <CubeIcon size={27} weight="thin" /> },
  { number: "03", icon: <ShoppingCartIcon size={27} weight="thin" /> },
  { number: "04", icon: <MedalIcon size={27} weight="thin" /> },
];

/* View dịch vụ: kết hợp nội dung bản địa hoá với metadata icon cố định. */
export function TrangDichVuPage() {
  /* Content thay đổi theo LanguageProvider, riêng danh sách icon không đổi. */
  const { content } = useLanguage();
  const { services } = content;

  /* JSX gồm hero, bốn bước dịch vụ và lời cam kết thương hiệu. */
  return (
    <main className="trang-dich-vu trang-noi-dung">
      <KhungDauTrang
        tone="toi"
        title={services.title}
        description={services.description}
        image={heroImage}
        imageAlt="Khu vực trưng bày vật liệu của CMID"
        actionLabel={services.action}
        actionHref="/lien-he"
      />

      <section
        className="dich-vu__danh-sach khung-noi-dung"
        aria-label={services.title}
      >
        {/* Ghép từng icon/số với bản copy cùng chỉ mục trong content. */}
        {dichVu.map((service, index) => (
          <article key={service.number}>
            <p className="dich-vu__so">{service.number}</p>
            <span aria-hidden="true">{service.icon}</span>
            <h2>{services.list[index].title}</h2>
            <p>{services.list[index].description}</p>
          </article>
        ))}
      </section>

      <section className="dich-vu__cam-ket khung-noi-dung">
        <img src={storyImage} alt="CMID completed interior" />
        <blockquote>
          <p>{services.quote}</p>
          <footer>{services.quoteBy}</footer>
        </blockquote>
      </section>
    </main>
  );
}
