/*
 * Vai trò: Danh mục/từ khóa bài viết và dữ liệu tin tức tĩnh làm fallback.
 */
/* Danh sách mã danh mục hợp lệ, dùng cho filter và dữ liệu bài viết. */
export const newsCategoryKeys = [
  'all',
  'material-trends',
  'design-insights',
  'new-products',
  'featured-projects',
  'cmid-news',
] as const

/* Kiểu được suy ra từ danh sách danh mục, tránh khai báo chuỗi lặp lại. */
export type NewsCategoryKey = (typeof newsCategoryKeys)[number]
export type ArticleCategoryKey = Exclude<NewsCategoryKey, 'all'>

/* Cấu trúc bài viết cho trang tin tức khi dùng dữ liệu tĩnh/fallback. */
export interface NewsArticle {
  slug: string
  title: string
  summary: string
  date: string
  publishedAt: string
  category: ArticleCategoryKey
  image: string
  body: string[]
  highlights: string[]
  tags: string[]
  readingMinutes: number
  featured?: boolean
}
