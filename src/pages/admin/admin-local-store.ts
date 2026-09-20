import type { AppLanguage } from '../../content/site-content'
import type { ArticleCategoryKey, NewsArticle } from '../../content/news-articles'
import type { Product } from '../../types/product'

const ADMIN_PRODUCTS_KEY = 'cmid-admin-products'
const ADMIN_NEWS_KEY = 'cmid-admin-news'
const ADMIN_NEWS_HIDDEN_KEY = 'cmid-admin-news-hidden'
export const ADMIN_PRODUCTS_UPDATED_EVENT = 'cmid-admin-products-updated'
export const ADMIN_CONTENT_UPDATED_EVENT = 'cmid-admin-content-updated'

export type AdminPublishStatus = 'DRAFT' | 'PUBLISHED'

export interface AdminNewsArticle extends NewsArticle {
  status: AdminPublishStatus
}

export interface AdminNewsInput {
  slug?: string
  category: ArticleCategoryKey
  image: string
  featured: boolean
  status?: AdminPublishStatus
  publishedAt?: string
  readingMinutes?: number
  vi: Pick<NewsArticle, 'title' | 'summary' | 'body' | 'highlights' | 'tags'>
  en: Pick<NewsArticle, 'title' | 'summary' | 'body' | 'highlights' | 'tags'>
}

type StoredAdminNews = Record<AppLanguage, AdminNewsArticle[]>

function readStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback

  try {
    const savedValue = window.localStorage.getItem(key)
    return savedValue ? (JSON.parse(savedValue) as T) : fallback
  } catch {
    return fallback
  }
}

function writeStorage<T>(key: string, value: T) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(key, JSON.stringify(value))
}

export function getAdminProducts(): Product[] {
  return readStorage<Product[]>(ADMIN_PRODUCTS_KEY, [])
}

export function mergeAdminProducts(apiProducts: Product[]): Product[] {
  const customProducts = getAdminProducts()
  const customIds = new Set(customProducts.map((product) => product.id))

  return [...apiProducts.filter((product) => !customIds.has(product.id)), ...customProducts]
}

export function saveAdminProduct(product: Product) {
  const products = getAdminProducts()
  const existingIndex = products.findIndex((item) => item.id === product.id)

  if (existingIndex >= 0) {
    products.splice(existingIndex, 1, product)
  } else {
    products.unshift(product)
  }

  try {
    writeStorage(ADMIN_PRODUCTS_KEY, products)
  } catch {
    // The API has already saved the product. A full/unavailable browser cache
    // must not report that save as failed or override API data with stale data.
    try { window.localStorage.removeItem(ADMIN_PRODUCTS_KEY) } catch { /* Storage may be blocked. */ }
  }
  window.dispatchEvent(new Event(ADMIN_PRODUCTS_UPDATED_EVENT))
}

export function deleteAdminProduct(productId: number) {
  const products = getAdminProducts().filter((product) => product.id !== productId)
  writeStorage(ADMIN_PRODUCTS_KEY, products)
  window.dispatchEvent(new Event(ADMIN_PRODUCTS_UPDATED_EVENT))
}

export function getAdminNewsArticles(
  language: AppLanguage,
  includeDrafts = false,
): AdminNewsArticle[] {
  const articles = readStorage<StoredAdminNews>(ADMIN_NEWS_KEY, { vi: [], en: [] })[
    language
  ].map(normalizeAdminNewsArticle)

  return includeDrafts
    ? articles
    : articles.filter((article) => article.status === 'PUBLISHED')
}

export function getHiddenAdminNewsSlugs() {
  return readStorage<string[]>(ADMIN_NEWS_HIDDEN_KEY, [])
}

export function saveAdminNewsArticle(input: AdminNewsInput) {
  const now = new Date()
  const slug = input.slug || toSlug(input.vi.title) || `bai-viet-${now.getTime()}`
  const publishedAt = input.publishedAt || now.toISOString().slice(0, 10)
  const publishedDate = new Date(`${publishedAt}T00:00:00`)
  const viDate = publishedDate.toLocaleDateString('vi-VN')
  const enDate = publishedDate.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
  const existingNews = readStorage<StoredAdminNews>(ADMIN_NEWS_KEY, {
    vi: [],
    en: [],
  })

  const articleBase = {
    slug,
    publishedAt,
    category: input.category,
    image: input.image,
    readingMinutes: Math.max(1, input.readingMinutes ?? 4),
    featured: input.featured,
    status: input.status ?? 'PUBLISHED',
  }
  const viArticle: AdminNewsArticle = { ...articleBase, date: viDate, ...input.vi }
  const enArticle: AdminNewsArticle = { ...articleBase, date: enDate, ...input.en }

  writeStorage(ADMIN_NEWS_KEY, {
    vi: [viArticle, ...existingNews.vi.filter((article) => article.slug !== slug)],
    en: [enArticle, ...existingNews.en.filter((article) => article.slug !== slug)],
  })
  writeStorage(ADMIN_NEWS_HIDDEN_KEY, getHiddenAdminNewsSlugs().filter((item) => item !== slug))
  window.dispatchEvent(new Event(ADMIN_CONTENT_UPDATED_EVENT))
}

export function deleteAdminNewsArticle(slug: string) {
  const existingNews = readStorage<StoredAdminNews>(ADMIN_NEWS_KEY, { vi: [], en: [] })
  writeStorage(ADMIN_NEWS_KEY, {
    vi: existingNews.vi.filter((article) => article.slug !== slug),
    en: existingNews.en.filter((article) => article.slug !== slug),
  })
  writeStorage(ADMIN_NEWS_HIDDEN_KEY, [
    slug,
    ...getHiddenAdminNewsSlugs().filter((item) => item !== slug),
  ])
  window.dispatchEvent(new Event(ADMIN_CONTENT_UPDATED_EVENT))
}

function normalizeAdminNewsArticle(article: AdminNewsArticle): AdminNewsArticle {
  return {
    ...article,
    status: article.status ?? 'PUBLISHED',
  }
}

function toSlug(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('vi')
    .trim()
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}
