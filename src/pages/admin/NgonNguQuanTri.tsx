import type { ReactNode } from 'react'
import type { AppLanguage } from '../../content/site-content'
import { AdminLanguageContext } from './NguCanhNgonNguQuanTri'

export function AdminLanguageProvider({ language, children }: { language: AppLanguage; children: ReactNode }) {
  return <AdminLanguageContext.Provider value={language}>{children}</AdminLanguageContext.Provider>
}
