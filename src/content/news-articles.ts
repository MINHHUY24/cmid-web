export const newsCategoryKeys = [
  'all',
  'material-trends',
  'design-insights',
  'new-products',
  'featured-projects',
  'cmid-news',
] as const

export type NewsCategoryKey = (typeof newsCategoryKeys)[number]
export type ArticleCategoryKey = Exclude<NewsCategoryKey, 'all'>

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
