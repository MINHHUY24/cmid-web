function normalizeSiteUrl(value: string | undefined): string {
  const fallback = 'https://cmid.vn'

  try {
    return new URL(value || fallback).origin
  } catch {
    return fallback
  }
}

export const siteUrl = normalizeSiteUrl(import.meta.env.VITE_SITE_URL)

export function getAbsoluteUrl(value: string): string {
  if (/^https?:\/\//i.test(value)) {
    return value
  }

  return new URL(value.startsWith('/') ? value : `/${value}`, `${siteUrl}/`).toString()
}
