/*
 * Vai trò: Khai báo context ngôn ngữ và hook `useLanguage`.
 */
/* API React để tạo và sử dụng Context ngôn ngữ. */
import { createContext, useContext } from "react";
/* Kiểu mã ngôn ngữ và toàn bộ nội dung song ngữ của website. */
import type {
  AppLanguage,
  SiteContent,
} from "../../models/content/site-content";

/* Giá trị Provider chia sẻ cho toàn bộ View cần nội dung dịch. */
export interface LanguageContextValue {
  language: AppLanguage;
  setLanguage: (language: AppLanguage) => void;
  content: SiteContent;
}

/* Context để null mặc định nhằm phát hiện dùng hook ngoài LanguageProvider. */
export const LanguageContext = createContext<LanguageContextValue | null>(null);

/* Hook lấy ngôn ngữ hiện tại, hàm đổi ngôn ngữ và content đã chọn. */
export function useLanguage(): LanguageContextValue {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error("useLanguage must be used inside LanguageProvider");
  }

  return context;
}
