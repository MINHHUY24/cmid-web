import { useCallback, useEffect, useState } from 'react'
import { getNewsArticles, type NewsArticleRecord } from '../services/news.service'

interface UseNewsArticlesResult {
  articles: NewsArticleRecord[]
  isLoading: boolean
  errorMessage: string | null
  retry: () => void
}

export function useNewsArticles(): UseNewsArticlesResult {
  const [articles, setArticles] = useState<NewsArticleRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let isCurrentRequest = true

    async function loadArticles() {
      setIsLoading(true)
      setErrorMessage(null)

      try {
        const response = await getNewsArticles()
        if (isCurrentRequest) setArticles(response)
      } catch (error: unknown) {
        if (isCurrentRequest) {
          setArticles([])
          setErrorMessage(error instanceof Error ? error.message : 'Không thể tải danh sách tin tức.')
        }
      } finally {
        if (isCurrentRequest) setIsLoading(false)
      }
    }

    void loadArticles()
    return () => { isCurrentRequest = false }
  }, [reloadKey])

  const retry = useCallback(() => setReloadKey((currentKey) => currentKey + 1), [])

  return { articles, isLoading, errorMessage, retry }
}
