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
import { applyPreferredColorTheme } from './hooks/useColorTheme.ts'

applyPreferredColorTheme()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LanguageProvider>
      <UserProvider>
        <App />
      </UserProvider>
    </LanguageProvider>
  </StrictMode>,
)
