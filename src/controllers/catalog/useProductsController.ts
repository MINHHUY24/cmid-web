/*
 * Vai trò: Tải danh sách catalogue; gom trạng thái tải, lỗi và tải lại.
 */
/* Các hook React phục vụ việc tải và cập nhật danh sách catalogue. */
import { useCallback, useEffect, useState } from "react";
/* Service lấy danh sách và model mô tả từng sản phẩm. */
import { getProducts } from "../../services/product.service";
import type { Product } from "../../models/product";

/* Dữ liệu và hành động mà các View catalogue có thể sử dụng. */
interface UseProductsResult {
  products: Product[];
  isLoading: boolean;
  errorMessage: string | null;
  retry: () => void;
  removeProduct: (productId: number) => void;
}

/* Tuỳ chọn tránh tải model 3D khi View không cần tới dữ liệu nặng này. */
interface UseProductsOptions {
  includeModels?: boolean;
}

/* Controller dùng chung cho catalogue, trang chủ và khu vực quản trị. */
export function useProductsController({
  includeModels = false,
}: UseProductsOptions = {}): UseProductsResult {
  /* State cho danh sách, trạng thái xử lý, lỗi và tín hiệu tải lại. */
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  /* Tải lại danh sách khi View thay đổi tuỳ chọn hoặc gọi `retry`. */
  useEffect(() => {
    let isCurrentRequest = true;

    /* Đưa lời gọi service vào hàm async để xử lý loading/lỗi rõ ràng. */
    async function loadProducts() {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const response = await getProducts({ includeModels });

        if (isCurrentRequest) {
          setProducts(response);
        }
      } catch (error: unknown) {
        if (isCurrentRequest) {
          setProducts([]);
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Không thể tải danh sách sản phẩm.",
          );
        }
      } finally {
        if (isCurrentRequest) {
          setIsLoading(false);
        }
      }
    }

    void loadProducts();

    return () => {
      isCurrentRequest = false;
    };
  }, [includeModels, reloadKey]);

  /* Cho View thử tải lại mà không cần biết chi tiết API. */
  const retry = useCallback(() => {
    setReloadKey((currentKey) => currentKey + 1);
  }, []);

  /* Loại sản phẩm vừa xoá khỏi state cục bộ để giao diện phản hồi ngay. */
  const removeProduct = useCallback((productId: number) => {
    setProducts((currentProducts) =>
      currentProducts.filter((product) => product.id !== productId),
    );
  }, []);

  /* Public API duy nhất của Controller dành cho View. */
  return { products, isLoading, errorMessage, retry, removeProduct };
}
