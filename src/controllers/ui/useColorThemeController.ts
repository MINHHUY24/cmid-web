/*
 * Vai trò: Đọc/lưu/toggle sáng-tối, cập nhật `data-theme`, `color-scheme` và màu trình duyệt di động.
 */
/* Hook React đồng bộ sở thích giao diện với DOM, storage và hệ điều hành. */
import { useEffect, useState } from 'react'

/* Hai theme thực tế và lựa chọn `system` để bám theo cài đặt thiết bị. */
export type ColorTheme = 'dark' | 'light'
type ColorThemePreference = ColorTheme | 'system'

/* Khoá lưu sở thích và màu thanh trình duyệt tương ứng với mỗi theme. */
const COLOR_THEME_PREFERENCE_STORAGE_KEY = 'cmid-color-theme-preference'
const THEME_COLORS: Record<ColorTheme, string> = {
  dark: '#0f0b08',
  light: '#e9e1d6',
}

/* Cập nhật thuộc tính DOM và meta theme-color để Chrome/Safari đổi cả thanh hệ thống. */
function applyColorThemeToDocument(theme: ColorTheme) {
  if (typeof document === 'undefined') return

  /* `data-theme` điều khiển biến CSS; `colorScheme` điều chỉnh control mặc định. */
  const root = document.documentElement
  root.dataset.theme = theme
  root.style.colorScheme = theme

  /* Thay meta cũ thay vì thêm nhiều thẻ `theme-color` trùng nhau. */
  const currentThemeColor = document.head.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
  const themeColor = document.createElement('meta')
  themeColor.name = 'theme-color'
  themeColor.content = THEME_COLORS[theme]

  if (currentThemeColor) {
    currentThemeColor.replaceWith(themeColor)
  } else {
    document.head.appendChild(themeColor)
  }
}

/* Đọc theme ưu tiên của hệ điều hành, với fallback an toàn cho SSR. */
export function getSystemColorTheme(): ColorTheme {
  if (typeof window === 'undefined') return 'light'

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

/* Lấy lựa chọn đã lưu; giá trị lạ hoặc storage lỗi được xem là `system`. */
function getColorThemePreference(): ColorThemePreference {
  if (typeof window === 'undefined') return 'system'

  try {
    const preference = window.localStorage.getItem(COLOR_THEME_PREFERENCE_STORAGE_KEY)
    return preference === 'dark' || preference === 'light' ? preference : 'system'
  } catch {
    return 'system'
  }
}

/* Chuyển lựa chọn `system` thành một theme cụ thể để áp dụng cho giao diện. */
function resolveColorTheme(preference: ColorThemePreference): ColorTheme {
  return preference === 'system' ? getSystemColorTheme() : preference
}

/* Áp dụng theme sớm trước React render để hạn chế hiện tượng chớp sáng/tối. */
export function applyPreferredColorTheme(): ColorTheme {
  const theme = resolveColorTheme(getColorThemePreference())
  applyColorThemeToDocument(theme)
  return theme
}

/* Controller quản lý theme của ứng dụng và các thao tác đổi/reset dành cho View. */
export function useColorThemeController() {
  /* State tách theme hệ thống và sở thích người dùng để hỗ trợ chế độ `system`. */
  const [systemTheme, setSystemTheme] = useState<ColorTheme>(getSystemColorTheme)
  const [themePreference, setThemePreference] = useState<ColorThemePreference>(getColorThemePreference)
  const colorTheme = themePreference === 'system' ? systemTheme : themePreference

  /* Mỗi khi theme hiệu lực đổi, đồng bộ nó vào document ngay. */
  useEffect(() => {
    applyColorThemeToDocument(colorTheme)
  }, [colorTheme])

  /* Lưu lựa chọn rõ ràng; xoá khoá khi người dùng quay về theo hệ thống. */
  useEffect(() => {
    try {
      if (themePreference === 'system') {
        window.localStorage.removeItem(COLOR_THEME_PREFERENCE_STORAGE_KEY)
      } else {
        window.localStorage.setItem(COLOR_THEME_PREFERENCE_STORAGE_KEY, themePreference)
      }
    } catch {
      /* Storage lỗi không ngăn theme đã chọn hoạt động trong phiên hiện tại. */
    }
  }, [themePreference])

  /* Theo dõi thay đổi cài đặt hệ điều hành để cập nhật khi đang dùng `system`. */
  useEffect(() => {
    const systemThemeQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const syncSystemTheme = (event: MediaQueryListEvent) => {
      setSystemTheme(event.matches ? 'dark' : 'light')
    }

    systemThemeQuery.addEventListener('change', syncSystemTheme)
    return () => systemThemeQuery.removeEventListener('change', syncSystemTheme)
  }, [])

  /* API tối giản để component giao diện đổi theme hoặc trở về chế độ hệ thống. */
  return {
    colorTheme,
    toggleColorTheme: () => {
      setThemePreference(colorTheme === 'dark' ? 'light' : 'dark')
    },
    resetColorThemeToSystem: () => setThemePreference('system'),
  }
}
