import { ArrowLeft, ArrowRight, MagnifyingGlass } from '@phosphor-icons/react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import interiorImage from '../assets/images/hero-tin-tuc-cmid.png'
import { CatalogSortDropdown } from '../components/product/CatalogSortDropdown'
import {
  getNewsArticles,
  newsCategoryKeys,
  type NewsArticle,
  type NewsCategoryKey,
} from '../content/news-articles'
import { useLanguage } from '../contexts/NgonNguContext'

const PAGE_SIZE = 6

function getCategoryLabel(article: NewsArticle, categoryLabels: string[]) {
  const categoryIndex = newsCategoryKeys.indexOf(article.category)
  return categoryLabels[categoryIndex] ?? article.category
}

export function TrangTinTucSuKienPage() {
  const { content, language } = useLanguage()
  const { news, common } = content
  const [activeCategory, setActiveCategory] = useState<NewsCategoryKey>('all')
  const [query, setQuery] = useState('')
  const [sortBy, setSortBy] = useState<'newest' | 'popular'>('newest')
  const [currentPage, setCurrentPage] = useState(1)
  const articles = getNewsArticles(language)

  const filteredArticles = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase()

    return [...articles]
      .filter((article) => activeCategory === 'all' || article.category === activeCategory)
      .filter((article) => {
        if (!normalizedQuery) return true
        return [article.title, article.summary, ...article.tags]
          .join(' ')
          .toLocaleLowerCase()
          .includes(normalizedQuery)
      })
      .sort((first, second) => {
        if (sortBy === 'popular') return second.readingMinutes - first.readingMinutes
        return second.publishedAt.localeCompare(first.publishedAt)
      })
  }, [activeCategory, articles, query, sortBy])

  const featuredArticle = filteredArticles.find((article) => article.featured)
  const regularArticles = filteredArticles.filter((article) => !article.featured)
  const totalPages = Math.ceil(regularArticles.length / PAGE_SIZE)
  const visibleArticles = regularArticles.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
  const showFeatured = currentPage === 1 && featuredArticle

  function changeCategory(category: NewsCategoryKey) {
    setActiveCategory(category)
    setCurrentPage(1)
  }

  function changeQuery(value: string) {
    setQuery(value)
    setCurrentPage(1)
  }

  function changeSort(value: 'newest' | 'popular') {
    setSortBy(value)
    setCurrentPage(1)
  }

  return (
    <main className="trang-tin-tuc">
      <section className="tin-tuc__hero" style={{ backgroundImage: `url(${interiorImage})` }}>
        <div className="tin-tuc__hero-overlay" />
        <div className="tin-tuc__hero-content">
          <div className="tin-tuc__hero-glass">
            <h1>{news.title}</h1>
            <p>{news.heroDescription}</p>
          </div>
        </div>
      </section>

      <div className="tin-tuc__khung">
        <aside className="tin-tuc__sidebar" aria-label="News search and categories">
          <label className="tin-tuc__search">
            <span className="sr-only">{news.search}</span>
            <input value={query} onChange={(event) => changeQuery(event.target.value)} placeholder={news.search} />
            <MagnifyingGlass size={17} aria-hidden="true" />
          </label>
          <section>
            <h2>{news.categoriesTitle}</h2>
            <nav aria-label={news.categoriesTitle}>
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
          </section>
          <section>
            <h2>{news.tagsTitle}</h2>
            <div className="tin-tuc__tags">
              {news.tags.map((tag) => (
                <button key={tag} type="button" onClick={() => changeQuery(tag)}>{tag}</button>
              ))}
            </div>
          </section>
        </aside>

        <section className="tin-tuc__feed" id="danh-sach-bai-viet">
          <div className="tin-tuc__feed-top">
            <p>{news.latest}</p>
            <div className="tin-tuc__feed-sort">
              <span>{news.sort}</span>
              <CatalogSortDropdown
                label={news.sort}
                value={sortBy}
                options={[
                  { value: 'newest', label: news.newest },
                  { value: 'popular', label: news.popular },
                ]}
                onChange={(value) => changeSort(value as 'newest' | 'popular')}
              />
            </div>
          </div>

          {showFeatured ? (
            <article className="tin-tuc__featured">
              <img src={showFeatured.image} alt={showFeatured.title} />
              <div>
                <p><time dateTime={showFeatured.publishedAt}>{showFeatured.date}</time>{getCategoryLabel(showFeatured, news.categories)}</p>
                <h2>{showFeatured.title}</h2>
                <p className="tin-tuc__featured-summary">{showFeatured.summary}</p>
                <Link to={`/tin-tuc-su-kien/${showFeatured.slug}`}>{common.readMore} <ArrowRight size={16} weight="bold" aria-hidden="true" /></Link>
              </div>
            </article>
          ) : null}

          {visibleArticles.length > 0 ? (
            <div className="tin-tuc__luoi">
              {visibleArticles.map((article) => (
                <NewsCard key={article.slug} article={article} categoryLabel={getCategoryLabel(article, news.categories)} readMore={common.readMore} />
              ))}
            </div>
          ) : filteredArticles.length === 0 ? (
            <p className="tin-tuc__no-results">{news.noResults}</p>
          ) : null}

          {totalPages > 1 ? (
            <nav className="tin-tuc__pagination" aria-label="News pagination">
              <button type="button" aria-label={news.previous} disabled={currentPage === 1} onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}><ArrowLeft size={15} /></button>
              {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                <button key={page} className={currentPage === page ? 'is-active' : ''} type="button" aria-current={currentPage === page ? 'page' : undefined} onClick={() => setCurrentPage(page)}>{page}</button>
              ))}
              <button type="button" aria-label={news.next} disabled={currentPage === totalPages} onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}><ArrowRight size={15} /></button>
            </nav>
          ) : null}
        </section>
      </div>
    </main>
  )
}

function NewsCard({ article, categoryLabel, readMore }: { article: NewsArticle; categoryLabel: string; readMore: string }) {
  return (
    <article className="bai-viet">
      <img src={article.image} alt={article.title} />
      <div>
        <p><time dateTime={article.publishedAt}>{article.date}</time>{categoryLabel}</p>
        <h2>{article.title}</h2>
        <p className="bai-viet__tom-tat">{article.summary}</p>
        <Link to={`/tin-tuc-su-kien/${article.slug}`}>{readMore} <ArrowRight size={14} weight="bold" aria-hidden="true" /></Link>
      </div>
    </article>
  )
}
