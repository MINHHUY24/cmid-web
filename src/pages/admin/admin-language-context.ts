import { createContext, useContext } from 'react'
import { translateAdminText } from '../../content/admin-content'
import type { AppLanguage } from '../../content/site-content'

export const AdminLanguageContext = createContext<AppLanguage>('vi')

export function useAdminCopy() {
  const language = useContext(AdminLanguageContext)
  return {
    language,
    t: (value: string) => translateAdminText(language, value),
  }
}
