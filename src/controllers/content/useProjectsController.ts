/*
 * Vai trò: Tải danh sách dự án cho các View dự án.
 */
/* Các hook React phục vụ việc lấy và tải lại dữ liệu dự án. */
import { useCallback, useEffect, useState } from "react";
/* Service và model dự án do tầng dữ liệu cung cấp. */
import { getProjects, type Project } from "../../services/project.service";

/* Dữ liệu mà View danh sách dự án cần để render và xử lý lỗi. */
interface UseProjectsResult {
  projects: Project[];
  isLoading: boolean;
  errorMessage: string | null;
  retry: () => void;
}

/* Controller điều phối danh sách dự án cho các View dự án. */
export function useProjectsController(): UseProjectsResult {
  /* State dữ liệu, trạng thái tải, lỗi và tín hiệu retry. */
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  /* Lấy lại danh sách khi Controller được mở hoặc khi View gọi `retry`. */
  useEffect(() => {
    let isCurrentRequest = true;

    /* Bao bọc API để tách luồng bất đồng bộ khỏi JSX của View. */
    async function loadProjects() {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const response = await getProjects();
        if (isCurrentRequest) setProjects(response);
      } catch (error: unknown) {
        if (isCurrentRequest) {
          setProjects([]);
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Không thể tải danh sách dự án.",
          );
        }
      } finally {
        if (isCurrentRequest) setIsLoading(false);
      }
    }

    void loadProjects();
    return () => {
      isCurrentRequest = false;
    };
  }, [reloadKey]);

  /* Tạo hành động tải lại ổn định để View truyền vào nút thử lại. */
  const retry = useCallback(
    () => setReloadKey((currentKey) => currentKey + 1),
    [],
  );

  /* Public API của Controller dành cho View. */
  return { projects, isLoading, errorMessage, retry };
}
