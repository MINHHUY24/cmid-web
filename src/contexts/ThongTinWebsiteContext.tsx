import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  defaultSiteSettings,
  getPublicSiteSettings,
  type PublicSiteSettings,
} from '../services/site-settings.service'

type SiteSettingsContextValue = {
  settings: PublicSiteSettings
  isLoading: boolean
  reload: () => Promise<void>
}

const SiteSettingsContext = createContext<SiteSettingsContextValue | null>(null)

export function SiteSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<PublicSiteSettings>(defaultSiteSettings)
  const [isLoading, setIsLoading] = useState(true)

  async function reload() {
    const next = await getPublicSiteSettings()
    setSettings(next)
  }

  useEffect(() => {
    let isCurrent = true
    const refresh = () => {
      void getPublicSiteSettings()
        .then((next) => {
          if (isCurrent) setSettings(next)
        })
        .catch(() => undefined)
        .finally(() => {
          if (isCurrent) setIsLoading(false)
        })
    }

    refresh()
    const interval = window.setInterval(refresh, 60_000)
    return () => {
      isCurrent = false
      window.clearInterval(interval)
    }
  }, [])

  const value = useMemo(() => ({ settings, isLoading, reload }), [isLoading, settings])
  return <SiteSettingsContext.Provider value={value}>{children}</SiteSettingsContext.Provider>
}

export function useSiteSettings() {
  const context = useContext(SiteSettingsContext)
  if (!context) throw new Error('useSiteSettings must be used inside SiteSettingsProvider.')
  return context
}
