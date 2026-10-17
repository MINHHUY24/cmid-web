/*
 * Vai trò: Trang hiển thị khi website đang maintenance.
 */
/* Icon liên hệ, logo/ảnh nền và Controller ngôn ngữ/theme dành cho trang bảo trì. */
import {
  EnvelopeSimpleIcon,
  PhoneIcon,
  WrenchIcon,
} from "@phosphor-icons/react";
import logoImage from "../../models/assets/images/logo.webp";
import { useLanguage } from "../../controllers/state/NgonNguContext";
import { useColorThemeController as useColorTheme } from "../../controllers/ui/useColorThemeController";
import maintenanceImage from "../../models/assets/images/khong-gian-trung-bay-vat-lieu.jpg";

/* Nội dung độc lập với siteContent vì vẫn cần render khi website bị bảo trì. */
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

/* View tĩnh cho khách truy cập trong thời gian bảo trì, Admin vẫn có route riêng. */
export function TrangBaoTriPage() {
  /* Áp dụng theme hiện tại và chọn đúng bản copy theo LanguageProvider. */
  const { language } = useLanguage();
  useColorTheme();
  const copy = maintenanceCopy[language];

  /* JSX chia thành lớp ảnh nền, overlay tối và phần nội dung/liên hệ dễ đọc. */
  return (
    <main className="maintenance-page" lang={language}>
      <img className="maintenance-page__image" src={maintenanceImage} alt="" />
      <div className="maintenance-page__scrim" />

      <div className="maintenance-page__content">
        <div className="maintenance-page__brand">
          <img src={logoImage} alt="CMID Stone & Interior" />
          <span>Stone &amp; Interior</span>
        </div>

        {/* Thông báo chính với phương án liên hệ thay thế trong lúc website tạm đóng. */}
        <section
          className="maintenance-page__notice"
          aria-labelledby="maintenance-title"
        >
          <span className="maintenance-page__icon">
            <WrenchIcon size={30} weight="duotone" />
          </span>
          <p className="maintenance-page__eyebrow">{copy.eyebrow}</p>
          <h1 id="maintenance-title">{copy.title}</h1>
          <p className="maintenance-page__description">{copy.description}</p>

          <div className="maintenance-page__contact">
            <strong>{copy.contact}</strong>
            <div>
              <a href="tel:18006868">
                <PhoneIcon size={18} weight="fill" />
                {copy.hotline}: 1800 6868
              </a>
              <a href="mailto:info@cmid.vn">
                <EnvelopeSimpleIcon size={18} weight="fill" />
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
