import { EnvelopeSimple, MapPin, Phone } from "@phosphor-icons/react";
import { Link } from "react-router-dom";

const footerGroups = [
  {
    title: "Về CMID",
    links: [
      { label: "Giới thiệu", to: "/ve-cmid" },
      { label: "Sứ mệnh và Giá trị", to: "/ve-cmid" },
      { label: "Tin tức", to: "/tin-tuc-su-kien" },
      { label: "Tuyển dụng", to: "/lien-he" },
    ],
  },
  {
    title: "Sản phẩm",
    links: [
      { label: "Vật liệu xây dựng", to: "/products" },
      { label: "Thiết bị và Hoàn thiện", to: "/products" },
      { label: "Nội thất", to: "/products" },
      { label: "Thương hiệu", to: "/products" },
    ],
  },
  {
    title: "Dịch vụ",
    links: [
      { label: "Tư vấn giải pháp", to: "/dich-vu" },
      { label: "Báo giá dự án", to: "/lien-he" },
      { label: "Vận chuyển và Lắp đặt", to: "/dich-vu" },
      { label: "Bảo hành", to: "/dich-vu" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer__grid">
        <div className="site-footer__brand">
          <Link
            className="brand brand--footer"
            to="/"
            aria-label="CMID - Trang chủ"
          >
            <span className="brand__mark">C</span>
            <span>CMID</span>
          </Link>
          <p>
            Vật liệu xây dựng và trang trí nội thất cho không gian sống bền
            vững.
          </p>
        </div>

        {footerGroups.map((group) => (
          <div key={group.title} className="site-footer__links">
            <h2>{group.title}</h2>
            {group.links.map((link) => (
              <Link key={link.label} to={link.to}>
                {link.label}
              </Link>
            ))}
          </div>
        ))}

        <div className="site-footer__contact">
          <h2>Liên hệ</h2>
          <a href="tel:02838386173">
            <Phone size={15} aria-hidden="true" />
            028 3838 6173
          </a>
          <a href="mailto:cmidvxd@gmail.com">
            <EnvelopeSimple size={15} aria-hidden="true" />
            cmidvxd@gmail.com
          </a>
          <p>
            <MapPin size={15} aria-hidden="true" />
            TP. Hồ Chí Minh, Việt Nam
          </p>
        </div>
      </div>
      <div className="site-footer__bottom">
        <span>© 2026 CMID. Bảo lưu mọi quyền.</span>
        <Link to="/lien-he">Chính sách liên hệ</Link>
      </div>
    </footer>
  );
}
