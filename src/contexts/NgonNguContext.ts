import { createContext, useContext } from 'react'
import type { AppLanguage, SiteContent } from '../content/site-content'

export interface LanguageContextValue {
  language: AppLanguage
  setLanguage: (language: AppLanguage) => void
  content: SiteContent
}

export const LanguageContext = createContext<LanguageContextValue | null>(null)

export function useLanguage(): LanguageContextValue {
  const context = useContext(LanguageContext)

  if (!context) {
    throw new Error('useLanguage must be used inside LanguageProvider')
  }

  return context
}
