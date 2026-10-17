/*
 * Vai trò: Trang 404 khi URL không khớp route.
 */
/* Điều hướng, SEO, panel trạng thái và Context ngôn ngữ của trang 404. */
import { Link, useLocation } from "react-router-dom";
import { Seo } from "../components/common/Seo";
import { StatusPanel } from "../components/common/KhunTranThai";
import { useLanguage } from "../../controllers/state/NgonNguContext";

/* View fallback cho route không tồn tại; luôn đặt noindex để tránh SEO sai URL. */
export function TrangKhongTimThayPage() {
  /* Pathname dùng làm canonical; language quyết định toàn bộ copy song ngữ. */
  const { language } = useLanguage();
  const { pathname } = useLocation();
  const isVietnamese = language === "vi";

  /* JSX gồm metadata SEO và panel hướng khách quay lại trang chủ. */
  return (
    <main className="trang-noi-dung product-detail-shell product-detail-shell--status">
      <Seo
        title={
          isVietnamese ? "Không tìm thấy trang | CMID" : "Page not found | CMID"
        }
        description={
          isVietnamese
            ? "Trang bạn tìm kiếm không tồn tại."
            : "The page you requested does not exist."
        }
        language={language}
        canonicalPath={pathname}
        robots="noindex,nofollow"
      />
      <StatusPanel
        title={isVietnamese ? "Không tìm thấy trang" : "Page not found"}
      >
        <p>
          {isVietnamese
            ? "Đường dẫn này không tồn tại hoặc đã được thay đổi."
            : "This address does not exist or has changed."}
        </p>
        <Link className="button button--small button--gold" to="/">
          {isVietnamese ? "Về trang chủ" : "Back to home"}
        </Link>
      </StatusPanel>
    </main>
  );
}
