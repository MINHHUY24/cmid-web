import { useEffect, useState } from 'react'

export type ColorTheme = 'dark' | 'light'
type ColorThemePreference = ColorTheme | 'system'

const COLOR_THEME_PREFERENCE_STORAGE_KEY = 'cmid-color-theme-preference'

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
  if (typeof document !== 'undefined') {
    document.documentElement.dataset.theme = theme
  }
  return theme
}

export function useColorTheme() {
  const [systemTheme, setSystemTheme] = useState<ColorTheme>(getSystemColorTheme)
  const [themePreference, setThemePreference] = useState<ColorThemePreference>(getColorThemePreference)
  const colorTheme = themePreference === 'system' ? systemTheme : themePreference

  useEffect(() => {
    document.documentElement.dataset.theme = colorTheme
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
