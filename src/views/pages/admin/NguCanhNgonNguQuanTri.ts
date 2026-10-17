/*
 * Vai trò: Context/hook lấy bản dịch ngôn ngữ Admin.
 */
import { createContext, useContext } from "react";
import { translateAdminText } from "../../../models/content/admin-content";
import type { AppLanguage } from "../../../models/content/site-content";

export const AdminLanguageContext = createContext<AppLanguage>("vi");

export function useAdminCopy() {
  const language = useContext(AdminLanguageContext);
  return {
    language,
    t: (value: string) => translateAdminText(language, value),
  };
}
