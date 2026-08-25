import { Armchair, Buildings, Check, ClipboardText, Storefront } from "@phosphor-icons/react";
import materialImage from "../assets/images/khong-gian-trung-bay-vat-lieu.jpg";
import heroImage from "../assets/images/hero-giai-phap-cmid.png";
import { KhungDauTrang } from "../components/common/KhungDauTrang";
import { useLanguage } from '../contexts/NgonNguContext'

const nhomGiaiPhap = [
  {
    icon: <Armchair size={31} weight="thin" />,
  },
  {
    icon: <Buildings size={31} weight="thin" />,
  },
  {
    icon: <Storefront size={31} weight="thin" />,
  },
  {
    icon: <ClipboardText size={31} weight="thin" />,
  },
];

export function TrangGiaiPhapPage() {
  const { content } = useLanguage()
  const { solutions } = content

  return (
    <main className="trang-giai-phap trang-noi-dung">
      <KhungDauTrang
        title={solutions.title}
        description={solutions.description}
        image={heroImage}
        imageAlt="Không gian phòng khách sử dụng vật liệu cao cấp"
        actionLabel={solutions.action}
        actionHref="#nhom-giai-phap"
      />

      <section className="giai-phap__nhom khung-noi-dung" id="nhom-giai-phap">
        {nhomGiaiPhap.map((solution, index) => (
          <article className="giai-phap__muc" key={solutions.list[index].title}>
            <span className="giai-phap__bieu-tuong" aria-hidden="true">
              {solution.icon}
            </span>
            <h2>{solutions.list[index].title}</h2>
            <p>{solutions.list[index].description}</p>
          </article>
        ))}
      </section>

      <section className="giai-phap__gioi-thieu khung-noi-dung">
        <img src={materialImage} alt="CMID selected materials" />
        <div>
          <p className="nhan-noi-dung">{solutions.eyebrow}</p>
          <h2>{solutions.featureTitle}</h2>
          <p>{solutions.featureDescription}</p>
          <ul>
            {solutions.points.map((point) => <li key={point}><Check size={16} weight="bold" aria-hidden="true" />{point}</li>)}
          </ul>
        </div>
      </section>
    </main>
  );
}
