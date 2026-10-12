import { useEffect, useState } from 'react'

export type ColorTheme = 'dark' | 'light'
type ColorThemePreference = ColorTheme | 'system'

const COLOR_THEME_PREFERENCE_STORAGE_KEY = 'cmid-color-theme-preference'
const THEME_COLORS: Record<ColorTheme, string> = {
  dark: '#0f0b08',
  light: '#e9e1d6',
}

function applyColorThemeToDocument(theme: ColorTheme) {
  if (typeof document === 'undefined') return

  const root = document.documentElement
  root.dataset.theme = theme
  // Safari uses the root colour scheme when choosing the contrast of its
  // browser chrome. Setting it on a nested application shell is too late for
  // a live theme change on iOS.
  root.style.colorScheme = theme

  const currentThemeColor = document.head.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
  const themeColor = document.createElement('meta')
  themeColor.name = 'theme-color'
  themeColor.content = THEME_COLORS[theme]

  // Recent iOS Safari builds can retain the old browser-chrome colour when
  // only `content` is mutated. Replacing the node makes Safari re-read it.
  if (currentThemeColor) {
    currentThemeColor.replaceWith(themeColor)
  } else {
    document.head.appendChild(themeColor)
  }
}

export function getSystemColorTheme(): ColorTheme {
  if (typeof window === 'undefined') {
    return 'light'
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

function getColorThemePreference(): ColorThemePreference {
  if (typeof window === 'undefined') {
    return 'system'
  }

  try {
    const preference = window.localStorage.getItem(COLOR_THEME_PREFERENCE_STORAGE_KEY)
    return preference === 'dark' || preference === 'light' ? preference : 'system'
  } catch {
    return 'system'
  }
}

function resolveColorTheme(preference: ColorThemePreference): ColorTheme {
  return preference === 'system' ? getSystemColorTheme() : preference
}

export function applyPreferredColorTheme(): ColorTheme {
  const theme = resolveColorTheme(getColorThemePreference())
  applyColorThemeToDocument(theme)
  return theme
}

export function useColorTheme() {
  const [systemTheme, setSystemTheme] = useState<ColorTheme>(getSystemColorTheme)
  const [themePreference, setThemePreference] = useState<ColorThemePreference>(getColorThemePreference)
  const colorTheme = themePreference === 'system' ? systemTheme : themePreference

  useEffect(() => {
    applyColorThemeToDocument(colorTheme)
  }, [colorTheme])

  useEffect(() => {
    try {
      if (themePreference === 'system') {
        window.localStorage.removeItem(COLOR_THEME_PREFERENCE_STORAGE_KEY)
      } else {
        window.localStorage.setItem(COLOR_THEME_PREFERENCE_STORAGE_KEY, themePreference)
      }
    } catch {
      // The selected theme still works when browser storage is unavailable.
    }
  }, [themePreference])

  useEffect(() => {
    const systemThemeQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const syncSystemTheme = (event: MediaQueryListEvent) => {
      setSystemTheme(event.matches ? 'dark' : 'light')
    }

    systemThemeQuery.addEventListener('change', syncSystemTheme)
    return () => systemThemeQuery.removeEventListener('change', syncSystemTheme)
  }, [])

  return {
    colorTheme,
    toggleColorTheme: () => {
      setThemePreference(colorTheme === 'dark' ? 'light' : 'dark')
    },
    resetColorThemeToSystem: () => setThemePreference('system'),
  }
}
