import { ArrowRight, CaretLeft, CaretRight, MagnifyingGlass } from '@phosphor-icons/react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import interiorImage from '../assets/images/hero-tin-tuc-cmid.png'
import { KhungXuong, TrangDangTaiKhungXuong } from '../components/common/KhungXuong'
import { StatusPanel } from '../components/common/KhunTranThai'
import {
  newsCategoryKeys,
  type NewsArticle,
  type NewsCategoryKey,
} from '../content/news-articles'
import { useLanguage } from '../contexts/NgonNguContext'
import { useNewsArticles } from '../hooks/useNewsArticles'
import { localizeNewsArticle } from '../services/news.service'
import { getCatalogPaginationItems } from '../utils/catalogPagination'

const PAGE_SIZE = 5

function getCategoryLabel(article: NewsArticle, categoryLabels: string[]) {
  const categoryIndex = newsCategoryKeys.indexOf(article.category)
  return categoryLabels[categoryIndex] ?? article.category
}

export function TrangTinTucSuKienPage() {
  const { content, language } = useLanguage()
  const { news, common } = content
  const { articles: articleRecords, isLoading, errorMessage, retry } = useNewsArticles()
  const [activeCategory, setActiveCategory] = useState<NewsCategoryKey>('all')
  const [query, setQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const articles = useMemo(
    () => articleRecords.map((article) => localizeNewsArticle(article, language)),
    [articleRecords, language],
  )

  const filteredArticles = useMemo(() => {
    const locale = language === 'vi' ? 'vi' : 'en'
    const normalizedQuery = query.trim().toLocaleLowerCase(locale)

    return articles
      .filter((article) => activeCategory === 'all' || article.category === activeCategory)
      .filter((article) => {
        if (!normalizedQuery) return true
        return [article.title, article.summary, ...article.tags]
          .join(' ')
          .toLocaleLowerCase(locale)
          .includes(normalizedQuery)
      })
      .sort((first, second) => second.publishedAt.localeCompare(first.publishedAt))
  }, [activeCategory, articles, language, query])

  const featuredArticle = filteredArticles.find((article) => article.featured) ?? filteredArticles[0]
  const regularArticles = featuredArticle
    ? filteredArticles.filter((article) => article.slug !== featuredArticle.slug)
    : filteredArticles
  const totalPages = Math.max(1, Math.ceil(regularArticles.length / PAGE_SIZE))
  const safeCurrentPage = Math.min(currentPage, Math.max(1, totalPages))
  const visibleArticles = regularArticles.slice(
    (safeCurrentPage - 1) * PAGE_SIZE,
    safeCurrentPage * PAGE_SIZE,
  )
  const paginationItems = useMemo(
    () => getCatalogPaginationItems(totalPages, safeCurrentPage),
    [safeCurrentPage, totalPages],
  )
  const showFeatured = safeCurrentPage === 1 ? featuredArticle : undefined

  function changeCategory(category: NewsCategoryKey) {
    setActiveCategory(category)
    setCurrentPage(1)
  }

  function changeQuery(value: string) {
    setQuery(value)
    setCurrentPage(1)
  }

  const heroTitle = language === 'vi'
    ? 'Cảm hứng kiến tạo không gian sống'
    : 'Ideas shaping thoughtful living'
  const heroEyebrow = language === 'vi' ? 'Tin tức & sự kiện' : 'News & events'
  const exploreLabel = language === 'vi' ? 'Khám phá ngay' : 'Explore stories'
  const featuredLabel = language === 'vi' ? 'Bài viết nổi bật' : 'Featured story'

  return (
    <main className="trang-tin-tuc">
      <section className="tin-tuc__hero" style={{ backgroundImage: `url(${interiorImage})` }}>
        <div className="tin-tuc__hero-overlay" />
        <div className="tin-tuc__hero-content">
          <div className="tin-tuc__hero-editorial">
            <span className="tin-tuc__hero-eyebrow">{heroEyebrow}</span>
            <h1>{heroTitle}</h1>
            <p>{news.heroDescription}</p>
            <a className="button cmid-hero-action tin-tuc__hero-action" href="#danh-sach-bai-viet">
              {exploreLabel}<ArrowRight size={17} weight="bold" aria-hidden="true" />
            </a>
          </div>
        </div>
      </section>

      <section className="tin-tuc__khung" id="danh-sach-bai-viet" aria-label={news.latest}>
        <div className="tin-tuc__toolbar">
          <nav className="tin-tuc__categories" aria-label={news.categoriesTitle}>
            {newsCategoryKeys.map((category, index) => (
              <button
                key={category}
                type="button"
                className={activeCategory === category ? 'is-active' : ''}
                aria-pressed={activeCategory === category}
                onClick={() => changeCategory(category)}
              >
                {news.categories[index]}
              </button>
            ))}
          </nav>
          <label className="tin-tuc__search">
            <span className="sr-only">{news.search}</span>
            <input value={query} onChange={(event) => changeQuery(event.target.value)} placeholder={news.search} />
            <MagnifyingGlass size={18} aria-hidden="true" />
          </label>
        </div>

        {isLoading ? (
          <NewsListingSkeleton label={language === 'vi' ? 'Đang tải bài viết' : 'Loading articles'} />
        ) : null}

        {errorMessage ? (
          <StatusPanel title={errorMessage} tone="error">
            <button className="button button--gold" type="button" onClick={retry}>{common.retry}</button>
          </StatusPanel>
        ) : null}

        {!isLoading && !errorMessage && showFeatured ? (
          <article className="tin-tuc__featured">
            <Link className="tin-tuc__featured-media" to={`/tin-tuc-su-kien/${showFeatured.slug}`}>
              <img src={showFeatured.image} alt={showFeatured.title} />
              <span>{featuredLabel}</span>
            </Link>
            <div className="tin-tuc__featured-copy">
              <p className="tin-tuc__meta">
                <time dateTime={showFeatured.publishedAt}>{showFeatured.date}</time>
                <span aria-hidden="true" />
                {getCategoryLabel(showFeatured, news.categories)}
              </p>
              <h2><Link to={`/tin-tuc-su-kien/${showFeatured.slug}`}>{showFeatured.title}</Link></h2>
              <p className="tin-tuc__featured-summary">{showFeatured.summary}</p>
              <Link className="tin-tuc__read-more" to={`/tin-tuc-su-kien/${showFeatured.slug}`}>
                {common.readMore}<ArrowRight size={16} weight="bold" aria-hidden="true" />
              </Link>
            </div>
          </article>
        ) : null}

        {!isLoading && !errorMessage && visibleArticles.length > 0 ? (
          <div className="tin-tuc__luoi">
            {visibleArticles.map((article, index) => (
              <NewsCard
                key={article.slug}
                article={article}
                categoryLabel={getCategoryLabel(article, news.categories)}
                readMore={common.readMore}
                lead={index === 0}
              />
            ))}
          </div>
        ) : null}

        {!isLoading && !errorMessage && filteredArticles.length === 0 ? (
          <p className="tin-tuc__no-results">{news.noResults}</p>
        ) : null}

        {!isLoading && !errorMessage && visibleArticles.length > 0 && totalPages > 1 ? (
          <nav className="tin-tuc__pagination" aria-label="News pagination">
            <button type="button" aria-label={news.previous} disabled={safeCurrentPage === 1} onClick={() => setCurrentPage(safeCurrentPage - 1)}>
              <CaretLeft size={18} aria-hidden="true" />
            </button>
            {paginationItems.map((item, index) => item === 'ellipsis' ? (
              <span className="tin-tuc__pagination-ellipsis" aria-hidden="true" key={`ellipsis-${index}`}>…</span>
            ) : (
              <button
                key={item}
                className={item === safeCurrentPage ? 'is-active' : undefined}
                type="button"
                aria-current={item === safeCurrentPage ? 'page' : undefined}
                aria-label={`Page ${item}`}
                onClick={() => setCurrentPage(item)}
              >
                {item}
              </button>
            ))}
            <button type="button" aria-label={news.next} disabled={safeCurrentPage === totalPages} onClick={() => setCurrentPage(safeCurrentPage + 1)}>
              <CaretRight size={18} aria-hidden="true" />
            </button>
          </nav>
        ) : null}
      </section>
    </main>
  )
}

function NewsCard({
  article,
  categoryLabel,
  readMore,
  lead,
}: {
  article: NewsArticle
  categoryLabel: string
  readMore: string
  lead: boolean
}) {
  return (
    <article className={`bai-viet${lead ? ' bai-viet--lead' : ''}`}>
      <Link className="bai-viet__media" to={`/tin-tuc-su-kien/${article.slug}`}>
        <img src={article.image} alt={article.title} loading="lazy" decoding="async" />
      </Link>
      <div>
        <p className="tin-tuc__meta"><time dateTime={article.publishedAt}>{article.date}</time><span aria-hidden="true" />{categoryLabel}</p>
        <h2><Link to={`/tin-tuc-su-kien/${article.slug}`}>{article.title}</Link></h2>
        <p className="bai-viet__tom-tat">{article.summary}</p>
        <Link className="tin-tuc__read-more" to={`/tin-tuc-su-kien/${article.slug}`}>
          {readMore}<ArrowRight size={14} weight="bold" aria-hidden="true" />
        </Link>
      </div>
    </article>
  )
}

function NewsListingSkeleton({ label }: { label: string }) {
  return (
    <TrangDangTaiKhungXuong label={label} className="news-listing-skeleton">
      <div className="news-featured-skeleton">
        <KhungXuong className="news-featured-skeleton__image" />
        <div>
          <KhungXuong className="news-skeleton__meta" />
          <KhungXuong className="news-skeleton__title" />
          <KhungXuong className="news-skeleton__title news-skeleton__title--short" />
          <KhungXuong className="news-skeleton__line" />
          <KhungXuong className="news-skeleton__line news-skeleton__line--short" />
          <KhungXuong className="news-skeleton__action" />
        </div>
      </div>
      <div className="news-grid-skeleton">
        {Array.from({ length: 5 }, (_, index) => (
          <div className={`news-card-skeleton${index === 0 ? ' news-card-skeleton--lead' : ''}`} key={index}>
            <KhungXuong className="news-card-skeleton__image" />
            <div>
              <KhungXuong className="news-skeleton__meta" />
              <KhungXuong className="news-skeleton__title" />
              <KhungXuong className="news-skeleton__line" />
              <KhungXuong className="news-skeleton__action" />
            </div>
          </div>
        ))}
      </div>
    </TrangDangTaiKhungXuong>
  )
}
