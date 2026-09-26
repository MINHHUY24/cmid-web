import { EnvelopeSimple, Phone, Wrench } from "@phosphor-icons/react";
import logoImage from "../assets/images/logo.webp";
import { useLanguage } from "../contexts/NgonNguContext";
import { useColorTheme } from "../hooks/useColorTheme";
import maintenanceImage from "../assets/images/khong-gian-trung-bay-vat-lieu.jpg";

const maintenanceCopy = {
  vi: {
    eyebrow: "CMID Stone & Interior",
    title: "Website đang được bảo trì",
    description:
      "Chúng tôi đang cập nhật hệ thống để mang đến trải nghiệm tốt hơn. Vui lòng quay lại sau ít phút.",
    contact: "Cần hỗ trợ ngay?",
    hotline: "Gọi hotline",
    email: "Gửi email",
    note: "Khu vực quản trị vẫn hoạt động để đội ngũ CMID hoàn tất cập nhật.",
  },
  en: {
    eyebrow: "CMID Stone & Interior",
    title: "We are improving the website",
    description:
      "Our team is updating the system to provide a better experience. Please check back in a few minutes.",
    contact: "Need help right away?",
    hotline: "Call hotline",
    email: "Send email",
    note: "The admin area remains available so the CMID team can complete the update.",
  },
} as const;

export function TrangBaoTriPage() {
  const { language } = useLanguage();
  useColorTheme();
  const copy = maintenanceCopy[language];

  return (
    <main className="maintenance-page" lang={language}>
      <img className="maintenance-page__image" src={maintenanceImage} alt="" />
      <div className="maintenance-page__scrim" />

      <div className="maintenance-page__content">
        <div className="maintenance-page__brand">
          <img src={logoImage} alt="CMID Stone & Interior" />
          <span>Stone &amp; Interior</span>
        </div>

        <section
          className="maintenance-page__notice"
          aria-labelledby="maintenance-title"
        >
          <span className="maintenance-page__icon">
            <Wrench size={30} weight="duotone" />
          </span>
          <p className="maintenance-page__eyebrow">{copy.eyebrow}</p>
          <h1 id="maintenance-title">{copy.title}</h1>
          <p className="maintenance-page__description">{copy.description}</p>

          <div className="maintenance-page__contact">
            <strong>{copy.contact}</strong>
            <div>
              <a href="tel:18006868">
                <Phone size={18} weight="fill" />
                {copy.hotline}: 1800 6868
              </a>
              <a href="mailto:info@cmid.vn">
                <EnvelopeSimple size={18} weight="fill" />
                {copy.email}: info@cmid.vn
              </a>
            </div>
          </div>
        </section>

        <p className="maintenance-page__note">{copy.note}</p>
      </div>
    </main>
  );
}
