/*
 * Vai trò: Chọn ngôn ngữ ban đầu từ trình duyệt/storage, cung cấp content Việt/Anh.
 */
/* Hook React quản lý lựa chọn ngôn ngữ và kiểu `children` của Provider. */
import { useEffect, useMemo, useState, type ReactNode } from "react";
/* Nội dung tĩnh theo ngôn ngữ và kiểu mã ngôn ngữ hợp lệ. */
import {
  siteContent,
  type AppLanguage,
} from "../../models/content/site-content";
import { LanguageContext } from "./NgonNguContext";

/* Khoá localStorage để ghi nhớ lựa chọn ngôn ngữ giữa các lần truy cập. */
const LANGUAGE_STORAGE_KEY = "cmid-language";

/* Suy ra ngôn ngữ mặc định từ cài đặt trình duyệt khi chưa từng chọn. */
function getBrowserLanguage(): AppLanguage {
  return navigator.language.toLowerCase().startsWith("vi") ? "vi" : "en";
}

/* Ưu tiên lựa chọn đã lưu; nếu storage lỗi thì quay về ngôn ngữ trình duyệt. */
function getInitialLanguage(): AppLanguage {
  try {
    const savedLanguage = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (savedLanguage === "vi" || savedLanguage === "en") {
      return savedLanguage;
    }
  } catch {
    /* Storage bị chặn vẫn không được làm hỏng trải nghiệm chọn ngôn ngữ. */
  }

  return getBrowserLanguage();
}

/* Provider duy trì ngôn ngữ hiện tại và phân phối content tương ứng cho View con. */
export function LanguageProvider({ children }: { children: ReactNode }) {
  /* Khởi tạo lười để chỉ đọc storage/trình duyệt một lần khi Provider mount. */
  const [language, setLanguage] = useState<AppLanguage>(getInitialLanguage);

  /* Đồng bộ lựa chọn vào storage và thuộc tính `lang` hỗ trợ SEO/trợ năng. */
  useEffect(() => {
    try {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    } catch {
      /* Không lưu được vẫn áp dụng ngôn ngữ cho phiên truy cập hiện tại. */
    }
    document.documentElement.lang = language;
  }, [language]);

  /* Memo hoá Context value để không render lại consumer nếu ngôn ngữ không đổi. */
  const value = useMemo(
    () => ({ language, setLanguage, content: siteContent[language] }),
    [language],
  );

  /* Cung cấp giá trị ngôn ngữ cho toàn bộ cây giao diện phía dưới. */
  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}
