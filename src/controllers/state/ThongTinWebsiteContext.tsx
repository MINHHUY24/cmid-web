/*
 * Vai trò: Provider tải/cập nhật site settings công khai dùng bởi header, footer và SEO.
 */
/* Hook React tạo Context và điều phối việc tải cấu hình website công khai. */
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
/* Service lấy thiết lập có fallback an toàn khi API chưa phản hồi. */
import {
  defaultSiteSettings,
  getPublicSiteSettings,
  type PublicSiteSettings,
} from "../../services/site-settings.service";

/* Giá trị dùng chung cho Header, Footer, SEO và mọi View cần site settings. */
type SiteSettingsContextValue = {
  settings: PublicSiteSettings;
  isLoading: boolean;
  reload: () => Promise<void>;
};

/* Context để null mặc định nhằm phát hiện hook được dùng ngoài Provider. */
const SiteSettingsContext = createContext<SiteSettingsContextValue | null>(
  null,
);

/* Provider tự tải settings công khai và làm mới định kỳ mỗi phút. */
export function SiteSettingsProvider({ children }: { children: ReactNode }) {
  /* State khởi tạo từ fallback để UI luôn render được trước khi API trả về. */
  const [settings, setSettings] =
    useState<PublicSiteSettings>(defaultSiteSettings);
  const [isLoading, setIsLoading] = useState(true);

  /* Hành động làm mới thủ công để View gọi sau khi cần đồng bộ dữ liệu. */
  async function reload() {
    const next = await getPublicSiteSettings();
    setSettings(next);
  }

  /* Tải lần đầu và thiết lập polling; dọn interval khi Provider bị huỷ. */
  useEffect(() => {
    let isCurrent = true;
    /* Hàm refresh nội bộ giữ nguyên fallback khi API tạm thời lỗi. */
    const refresh = () => {
      void getPublicSiteSettings()
        .then((next) => {
          if (isCurrent) setSettings(next);
        })
        .catch(() => undefined)
        .finally(() => {
          if (isCurrent) setIsLoading(false);
        });
    };

    refresh();
    const interval = window.setInterval(refresh, 60_000);
    return () => {
      isCurrent = false;
      window.clearInterval(interval);
    };
  }, []);

  /* Memo hoá value, chỉ báo lại Consumer khi settings/loading thực sự đổi. */
  const value = useMemo(
    () => ({ settings, isLoading, reload }),
    [isLoading, settings],
  );
  /* Chia sẻ thiết lập website cho toàn bộ View phía dưới. */
  return (
    <SiteSettingsContext.Provider value={value}>
      {children}
    </SiteSettingsContext.Provider>
  );
}

/* Hook đọc settings với lỗi hướng dẫn khi thiếu SiteSettingsProvider. */
export function useSiteSettings() {
  const context = useContext(SiteSettingsContext);
  if (!context)
    throw new Error(
      "useSiteSettings must be used inside SiteSettingsProvider.",
    );
  return context;
}
