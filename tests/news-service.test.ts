import { describe, expect, it, vi } from 'vitest'
import { apiFetch } from '../src/services/api'
import {
  getAdminNewsArticles,
  getNewsArticles,
  localizeNewsArticle,
  saveNewsArticle,
  type NewsArticleRecord,
} from '../src/services/news.service'

vi.mock('../src/services/api', () => ({
  apiFetch: vi.fn(),
}))

const article: NewsArticleRecord = {
  id: 'news-1',
  slug: 'xu-huong-vat-lieu',
  title: 'Xu hướng vật liệu',
  titleEn: 'Material trends',
  summary: 'Tóm tắt',
  summaryEn: 'Summary',
  body: ['Nội dung'],
  bodyEn: ['Article body'],
  highlights: ['Điểm nổi bật'],
  highlightsEn: ['Highlight'],
  tags: ['Vật liệu'],
  tagsEn: ['Materials'],
  category: 'material-trends',
  imageUrl: 'cmid-asset://news-interior',
  readingMinutes: 5,
  isFeatured: true,
  status: 'PUBLISHED',
  publishedAt: '2025-05-08T00:00:00.000Z',
  sortOrder: 1,
  createdAt: '2026-09-13T00:00:00.000Z',
  updatedAt: '2026-09-13T00:00:00.000Z',
}

describe('news service', () => {
  it('loads the public article list from the news API', () => {
    void getNewsArticles()

    expect(apiFetch).toHaveBeenCalledWith('/news', { skipAuth: true })
  })

  it('uses separate protected read and write paths for administrators', () => {
    void getAdminNewsArticles(false)
    void saveNewsArticle({
      slug: article.slug,
      title: article.title,
      summary: article.summary,
      body: ['Nội dung'],
      highlights: [],
      tags: [],
      category: 'material-trends',
      imageUrl: article.imageUrl,
      readingMinutes: 5,
      isFeatured: false,
      status: 'PUBLISHED',
      publishedAt: article.publishedAt,
    }, false)

    expect(apiFetch).toHaveBeenCalledWith('/news/admin', {
      authScope: 'admin',
      headers: undefined,
      skipAuth: false,
    })
    expect(apiFetch).toHaveBeenLastCalledWith('/news', expect.objectContaining({
      method: 'POST',
      skipAuth: false,
    }))
  })

  it('localizes Supabase fields and resolves bundled seed imagery', () => {
    const localized = localizeNewsArticle(article, 'en')

    expect(localized).toMatchObject({
      slug: 'xu-huong-vat-lieu',
      title: 'Material trends',
      summary: 'Summary',
      body: ['Article body'],
      highlights: ['Highlight'],
      tags: ['Materials'],
      category: 'material-trends',
      featured: true,
    })
    expect(localized.image).toContain('noi-that-phong-khach-cao-cap')
  })
})
