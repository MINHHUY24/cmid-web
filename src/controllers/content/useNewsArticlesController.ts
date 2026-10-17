/*
 * Vai trò: Tải danh sách bài tin cho các View tin tức.
 */
/* Các hook React phục vụ việc lấy và tải lại dữ liệu tin tức. */
import { useCallback, useEffect, useState } from "react";
/* Service và record chuẩn của bài viết từ Model/API. */
import {
  getNewsArticles,
  type NewsArticleRecord,
} from "../../services/news.service";

/* Dữ liệu mà View danh sách và chi tiết tin tức sử dụng. */
interface UseNewsArticlesResult {
  articles: NewsArticleRecord[];
  isLoading: boolean;
  errorMessage: string | null;
  retry: () => void;
}

/* Controller điều phối dữ liệu tin tức cho các View liên quan. */
export function useNewsArticlesController(): UseNewsArticlesResult {
  /* State dữ liệu, trạng thái tải, thông báo lỗi và tín hiệu retry. */
  const [articles, setArticles] = useState<NewsArticleRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  /* Lấy danh sách ngay khi mount và mỗi lần người dùng yêu cầu tải lại. */
  useEffect(() => {
    let isCurrentRequest = true;

    /* Bao bọc API để thống nhất luồng loading, thành công và lỗi. */
    async function loadArticles() {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const response = await getNewsArticles();
        if (isCurrentRequest) setArticles(response);
      } catch (error: unknown) {
        if (isCurrentRequest) {
          setArticles([]);
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Không thể tải danh sách tin tức.",
          );
        }
      } finally {
        if (isCurrentRequest) setIsLoading(false);
      }
    }

    void loadArticles();
    return () => {
      isCurrentRequest = false;
    };
  }, [reloadKey]);

  /* Tăng khoá tải lại để Effect gọi API thêm lần nữa. */
  const retry = useCallback(
    () => setReloadKey((currentKey) => currentKey + 1),
    [],
  );

  /* Chỉ xuất ra dữ liệu và hành động cần thiết cho View. */
  return { articles, isLoading, errorMessage, retry };
}
