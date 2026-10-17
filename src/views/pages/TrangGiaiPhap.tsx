/*
 * Vai trò: Trang giải pháp theo nhu cầu/dự án.
 */
/* Icon, asset và component hero phục vụ trang giải pháp. */
import {
  ArmchairIcon,
  BuildingsIcon,
  CheckIcon,
  ClipboardTextIcon,
  StorefrontIcon,
} from "@phosphor-icons/react";
import materialImage from "../../models/assets/images/khong-gian-trung-bay-vat-lieu.jpg";
import heroImage from "../../models/assets/images/hero-giai-phap-cmid.png";
import { KhungDauTrang } from "../components/common/KhungDauTrang";
import { useLanguage } from "../../controllers/state/NgonNguContext";

/* Metadata icon cố định, còn tiêu đề/mô tả được lấy từ content song ngữ. */
const nhomGiaiPhap = [
  {
    icon: <ArmchairIcon size={31} weight="thin" />,
  },
  {
    icon: <BuildingsIcon size={31} weight="thin" />,
  },
  {
    icon: <StorefrontIcon size={31} weight="thin" />,
  },
  {
    icon: <ClipboardTextIcon size={31} weight="thin" />,
  },
];

/* View nhóm giải pháp theo nhu cầu công trình. */
export function TrangGiaiPhapPage() {
  /* Lấy đúng nhánh nội dung của trang theo ngôn ngữ hiện hành. */
  const { content } = useLanguage();
  const { solutions } = content;

  /* JSX gồm hero, nhóm giải pháp và section giới thiệu kèm các điểm mạnh. */
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
        {/* Ghép icon với từng giải pháp theo vị trí tương ứng trong content. */}
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
            {solutions.points.map((point) => (
              <li key={point}>
                <CheckIcon size={16} weight="bold" aria-hidden="true" />
                {point}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  );
}
