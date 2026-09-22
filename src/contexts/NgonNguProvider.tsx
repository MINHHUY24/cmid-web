import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { siteContent, type AppLanguage } from '../content/site-content'
import { LanguageContext } from './NgonNguContext'

const LANGUAGE_STORAGE_KEY = 'cmid-language'

function getBrowserLanguage(): AppLanguage {
  return navigator.language.toLowerCase().startsWith('vi') ? 'vi' : 'en'
}

function getInitialLanguage(): AppLanguage {
  try {
    const savedLanguage = window.localStorage.getItem(LANGUAGE_STORAGE_KEY)
    if (savedLanguage === 'vi' || savedLanguage === 'en') {
      return savedLanguage
    }
  } catch {
    // Fall back to the browser preference when storage is unavailable.
  }

  return getBrowserLanguage()
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<AppLanguage>(getInitialLanguage)

  useEffect(() => {
    try {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language)
    } catch {
      // The selected language still applies for the current visit.
    }
    document.documentElement.lang = language
  }, [language])

  const value = useMemo(
    () => ({ language, setLanguage, content: siteContent[language] }),
    [language],
  )

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}
