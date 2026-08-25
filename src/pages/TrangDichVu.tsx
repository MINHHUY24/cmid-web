import { ClipboardText, Cube, Medal, ShoppingCart } from "@phosphor-icons/react";
import heroImage from "../assets/images/hero-dich-vu-cmid.png";
import storyImage from "../assets/images/noi-that-phong-khach-cao-cap.jpg";
import { KhungDauTrang } from "../components/common/KhungDauTrang";
import { useLanguage } from '../contexts/NgonNguContext'

const dichVu = [
  { number: "01", icon: <ClipboardText size={27} weight="thin" /> },
  { number: "02", icon: <Cube size={27} weight="thin" /> },
  { number: "03", icon: <ShoppingCart size={27} weight="thin" /> },
  { number: "04", icon: <Medal size={27} weight="thin" /> },
];

export function TrangDichVuPage() {
  const { content } = useLanguage()
  const { services } = content

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

      <section className="dich-vu__danh-sach khung-noi-dung" aria-label={services.title}>
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
