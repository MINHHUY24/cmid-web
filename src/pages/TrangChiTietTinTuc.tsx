import { ArrowLeft, ArrowRight, CalendarBlank, Clock } from '@phosphor-icons/react'
import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getNewsArticles, newsCategoryKeys } from '../content/news-articles'
import { useLanguage } from '../contexts/NgonNguContext'

export function TrangChiTietTinTucPage() {
  const { slug } = useParams()
  const { content, language } = useLanguage()
  const { news, common } = content
  const articles = getNewsArticles(language)
  const article = articles.find((item) => item.slug === slug)

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [slug])

  if (!article) {
    return (
      <main className="news-detail news-detail--not-found">
        <section className="news-detail__not-found">
          <h1>{news.articleNotFound}</h1>
          <p>{news.articleNotFoundDescription}</p>
          <Link className="button button--gold" to="/tin-tuc-su-kien">{news.browseNews}</Link>
        </section>
      </main>
    )
  }

  const categoryIndex = newsCategoryKeys.indexOf(article.category)
  const categoryLabel = news.categories[categoryIndex] ?? article.category
  const relatedArticles = articles
    .filter((item) => item.slug !== article.slug)
    .sort((first, second) => Number(second.category === article.category) - Number(first.category === article.category))
    .slice(0, 3)

  return (
    <main className="news-detail">
      <div className="news-detail__shell">
        <nav className="news-detail__breadcrumb" aria-label="Breadcrumb">
          <Link to="/">{common.home}</Link>
          <span aria-hidden="true">/</span>
          <Link to="/tin-tuc-su-kien">{news.title}</Link>
          <span aria-hidden="true">/</span>
          <span>{article.title}</span>
        </nav>

        <article className="news-article">
          <header className="news-article__header">
            <p className="news-article__category">{categoryLabel}</p>
            <h1>{article.title}</h1>
            <p className="news-article__summary">{article.summary}</p>
            <div className="news-article__meta">
              <span><CalendarBlank size={17} aria-hidden="true" />{article.date}</span>
              <span><Clock size={17} aria-hidden="true" />{news.readingTime(article.readingMinutes)}</span>
            </div>
          </header>

          <img className="news-article__image" src={article.image} alt={article.title} />

          <div className="news-article__body">
            <div>
              {article.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            </div>
            <aside className="news-article__highlights">
              <h2>CMID NOTE</h2>
              <ul>{article.highlights.map((highlight) => <li key={highlight}>{highlight}</li>)}</ul>
            </aside>
          </div>

          <footer className="news-article__footer">
            <div className="news-article__tags">{article.tags.map((tag) => <span key={tag}>#{tag}</span>)}</div>
            <Link to="/tin-tuc-su-kien" className="news-detail__back"><ArrowLeft size={16} aria-hidden="true" />{news.backToNews}</Link>
          </footer>
        </article>

        {relatedArticles.length > 0 ? (
          <section className="news-detail__related" aria-labelledby="related-news-title">
            <div className="news-detail__related-heading">
              <h2 id="related-news-title">{news.related}</h2>
              <Link to="/tin-tuc-su-kien">{news.browseNews} <ArrowRight size={15} aria-hidden="true" /></Link>
            </div>
            <div className="news-detail__related-grid">
              {relatedArticles.map((related) => {
                const relatedCategoryIndex = newsCategoryKeys.indexOf(related.category)
                return (
                  <article key={related.slug} className="news-related-card">
                    <Link to={`/tin-tuc-su-kien/${related.slug}`}>
                      <img src={related.image} alt={related.title} />
                      <div>
                        <p><span>{related.date}</span>{news.categories[relatedCategoryIndex] ?? related.category}</p>
                        <h3>{related.title}</h3>
                      </div>
                    </Link>
                  </article>
                )
              })}
            </div>
          </section>
        ) : null}
      </div>
    </main>
  )
}
