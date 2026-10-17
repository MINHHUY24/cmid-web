/*
 * Vai trò: Cập nhật title, meta, canonical, Open Graph và JSON-LD.
 */
import { useEffect } from 'react'
import type { AppLanguage } from '../../../models/content/site-content'
import defaultSocialImage from '../../../models/assets/images/noi-that-phong-khach-cao-cap.jpg'
import { getAbsoluteUrl } from '../../utils/seo'

type StructuredData = Record<string, unknown> | Array<Record<string, unknown>>

export interface SeoProps {
  title: string
  description: string
  language: AppLanguage
  canonicalPath?: string
  image?: string
  imageAlt?: string
  type?: 'website' | 'article' | 'product'
  robots?: string
  structuredData?: StructuredData
}

function setMeta(
  attribute: 'name' | 'property',
  key: string,
  content: string,
) {
  const selector = `meta[${attribute}="${key}"]`
  const element = document.head.querySelector<HTMLMetaElement>(selector)
    ?? document.head.appendChild(document.createElement('meta'))

  element.setAttribute(attribute, key)
  element.content = content
}

function removeMeta(attribute: 'name' | 'property', key: string) {
  document.head.querySelector(`meta[${attribute}="${key}"]`)?.remove()
}

function setCanonical(url: string) {
  const element = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
    ?? document.head.appendChild(document.createElement('link'))

  element.rel = 'canonical'
  element.href = url
}

function setStructuredData(data: StructuredData | undefined) {
  const selector = 'script[data-cmid-seo="structured-data"]'
  const existing = document.head.querySelector<HTMLScriptElement>(selector)

  if (!data) {
    existing?.remove()
    return
  }

  const script = existing ?? document.head.appendChild(document.createElement('script'))
  script.type = 'application/ld+json'
  script.dataset.cmidSeo = 'structured-data'
  script.textContent = JSON.stringify(data).replace(/</g, '\\u003c')
}

export function Seo({
  title,
  description,
  language,
  canonicalPath = '/',
  image = defaultSocialImage,
  imageAlt = title,
  type = 'website',
  robots = 'index,follow',
  structuredData,
}: SeoProps) {
  useEffect(() => {
    const canonicalUrl = getAbsoluteUrl(canonicalPath)
    const imageUrl = getAbsoluteUrl(image)
    const locale = language === 'vi' ? 'vi_VN' : 'en_US'

    document.title = title
    document.documentElement.lang = language
    setMeta('name', 'description', description)
    setMeta('name', 'robots', robots)
    setMeta('name', 'twitter:card', 'summary_large_image')
    setMeta('name', 'twitter:title', title)
    setMeta('name', 'twitter:description', description)
    setMeta('name', 'twitter:image', imageUrl)
    setMeta('name', 'twitter:image:alt', imageAlt)
    setMeta('property', 'og:title', title)
    setMeta('property', 'og:description', description)
    setMeta('property', 'og:type', type)
    setMeta('property', 'og:site_name', 'CMID')
    setMeta('property', 'og:url', canonicalUrl)
    setMeta('property', 'og:image', imageUrl)
    setMeta('property', 'og:image:alt', imageAlt)
    setMeta('property', 'og:locale', locale)
    removeMeta('property', 'og:image:width')
    removeMeta('property', 'og:image:height')
    setCanonical(canonicalUrl)
    setStructuredData(structuredData)
  }, [canonicalPath, description, image, imageAlt, language, robots, structuredData, title, type])

  return null
}
