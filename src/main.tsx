import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/roboto/latin-400.css'
import '@fontsource/roboto/latin-500.css'
import '@fontsource/roboto/latin-700.css'
import '@fontsource/roboto/vietnamese-400.css'
import '@fontsource/roboto/vietnamese-500.css'
import '@fontsource/roboto/vietnamese-700.css'
import './index.css'
import App from './UngDung.tsx'
import { LanguageProvider } from './contexts/NgonNguProvider.tsx'
import { UserProvider } from './contexts/NguoiDungProvider.tsx'
import { SiteSettingsProvider } from './contexts/ThongTinWebsiteContext.tsx'
import { applyPreferredColorTheme } from './hooks/useColorTheme.ts'

applyPreferredColorTheme()
retireSupersededContentCaches()

function retireSupersededContentCaches() {
  if (typeof window === 'undefined') return

  try {
    // Products and news are server-backed. These old keys were only a second,
    // browser-specific cache and could override the canonical Supabase result.
    window.localStorage.removeItem('cmid-admin-products')
    window.localStorage.removeItem('cmid-admin-news')
    window.localStorage.removeItem('cmid-admin-news-hidden')
  } catch {
    // A restricted browser storage area must not prevent the app from starting.
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LanguageProvider>
      <SiteSettingsProvider>
        <UserProvider>
          <App />
        </UserProvider>
      </SiteSettingsProvider>
    </LanguageProvider>
  </StrictMode>,
)
