/*
 * Vai trò: Cập nhật featured/publication của bài tin không làm mất sort order/trạng thái.
 */
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { AdminNewsView } from '../src/views/pages/admin/GiaoDienNoiDungQuanTri'
import {
  getAdminNewsArticles,
  saveNewsArticle,
  type NewsArticleRecord,
} from '../src/services/news.service'

vi.mock('../src/services/news.service', () => ({
  deleteNewsArticle: vi.fn(),
  getAdminNewsArticles: vi.fn(),
  resolveNewsImage: (imageUrl: string) => imageUrl,
  saveNewsArticle: vi.fn(),
}))

const targetArticle: NewsArticleRecord = {
  id: 'news-featured-target',
  slug: 'bai-viet-can-chuyen-noi-bat',
  title: 'Bài viết cần chuyển nổi bật',
  titleEn: 'Article to feature',
  summary: 'Tóm tắt dùng để kiểm thử cập nhật hiển thị.',
  summaryEn: 'A summary used to test the display update.',
  body: ['Nội dung kiểm thử'],
  bodyEn: ['Test content'],
  highlights: ['Điểm nổi bật kiểm thử'],
  highlightsEn: ['Test highlight'],
  tags: ['kiểm thử'],
  tagsEn: ['test'],
  category: 'material-trends',
  imageUrl: 'https://example.com/news-cover.webp',
  readingMinutes: 5,
  isFeatured: false,
  status: 'PUBLISHED',
  publishedAt: '2026-09-30T02:00:00.000Z',
  sortOrder: 42,
  createdAt: '2026-09-30T02:00:00.000Z',
  updatedAt: '2026-09-30T02:00:00.000Z',
}

const articles: NewsArticleRecord[] = [
  targetArticle,
  ...Array.from({ length: 14 }, (_, index) => ({
    ...targetArticle,
    id: `news-${index + 1}`,
    slug: `bai-viet-${index + 1}`,
    title: `Bài viết tham khảo ${index + 1}`,
    sortOrder: index,
  })),
]

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    callback(0)
    return 1
  })
  vi.mocked(getAdminNewsArticles).mockResolvedValue(articles)
  vi.mocked(saveNewsArticle).mockResolvedValue({ ...targetArticle, isFeatured: true })
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

it('shows the total at the toolbar edge and saves a featured change without losing publication state or sort order', async () => {
  const onToast = vi.fn()
  const { container } = render(<AdminNewsView onToast={onToast} />)

  await screen.findByText(targetArticle.title)

  const toolbar = container.querySelector('.admin-content-toolbar')
  const total = toolbar?.querySelector('.admin-content-toolbar__total')

  expect(total?.textContent).toBe('Tổng số bài viết: 15')
  expect(total?.getAttribute('aria-live')).toBe('polite')
  expect(toolbar?.querySelector('.admin-content-toolbar__count')).toBeNull()

  fireEvent.change(screen.getByPlaceholderText('Tìm theo tiêu đề, nội dung hoặc chuyên mục...'), {
    target: { value: targetArticle.title },
  })

  expect(total?.textContent).toBe('Tổng số bài viết: 15')

  const featuredSelect = screen.getByRole('button', {
    name: `Cập nhật hiển thị ${targetArticle.title}`,
  })
  expect(featuredSelect.textContent).toContain('Thông thường')

  fireEvent.click(featuredSelect)
  fireEvent.click(await screen.findByRole('option', { name: 'Nổi bật' }))

  await waitFor(() => {
    expect(saveNewsArticle).toHaveBeenCalledWith(expect.objectContaining({
      id: targetArticle.id,
      isFeatured: true,
      status: targetArticle.status,
      sortOrder: targetArticle.sortOrder,
    }), false)
  })
})
