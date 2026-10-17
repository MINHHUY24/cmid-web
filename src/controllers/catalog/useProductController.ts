/*
 * Vai trò: Tải một sản phẩm theo ID; trả về `product`, loading, error và retry cho trang chi tiết/3D.
 */
/* Các hook React quản lý trạng thái tải sản phẩm và vòng đời của yêu cầu API. */
import { useCallback, useEffect, useReducer, useState } from "react";
/* Service lấy chi tiết sản phẩm và kiểu dữ liệu sản phẩm dùng trong Controller. */
import { getProductById } from "../../services/product.service";
import type { Product } from "../../models/product";

/* Dữ liệu mà View nhận được để hiển thị trạng thái trang chi tiết sản phẩm. */
interface UseProductResult {
  product: Product | null;
  isLoading: boolean;
  errorMessage: string | null;
  retry: () => void;
}

/* Phần state nội bộ; bỏ `retry` vì đây là hành động, không phải dữ liệu. */
type ProductLoadState = Omit<UseProductResult, "retry">;

/* Các sự kiện làm thay đổi state trong quá trình gọi API. */
type ProductLoadAction =
  | { type: "start" }
  | { type: "success"; product: Product }
  | { type: "failure"; errorMessage: string };

/* Reducer gom quy tắc chuyển state tải, thành công và thất bại vào một nơi. */
function productLoadReducer(
  state: ProductLoadState,
  action: ProductLoadAction,
): ProductLoadState {
  switch (action.type) {
    case "start":
      return { ...state, isLoading: true, errorMessage: null };
    case "success":
      return { product: action.product, isLoading: false, errorMessage: null };
    case "failure":
      return {
        product: null,
        isLoading: false,
        errorMessage: action.errorMessage,
      };
  }
}

/* Tạo state ban đầu; ID không hợp lệ sẽ không hiển thị trạng thái đang tải. */
function initialProductLoadState(productId: number): ProductLoadState {
  return {
    product: null,
    isLoading: Number.isSafeInteger(productId) && productId > 0,
    errorMessage: null,
  };
}

/* Controller điều phối dữ liệu của View chi tiết sản phẩm. */
export function useProductController(productId: number): UseProductResult {
  /* Reducer quản lý state API; khoá này dùng để kích hoạt tải lại theo yêu cầu. */
  const [{ product, isLoading, errorMessage }, dispatch] = useReducer(
    productLoadReducer,
    productId,
    initialProductLoadState,
  );
  const [reloadKey, setReloadKey] = useState(0);

  /* Gọi API mỗi khi ID sản phẩm hoặc yêu cầu tải lại thay đổi. */
  useEffect(() => {
    const isValidProductId = Number.isSafeInteger(productId) && productId > 0;

    if (!isValidProductId) {
      return;
    }

    /* Chặn response cũ cập nhật state sau khi View đã đổi sản phẩm hoặc unmount. */
    let isCurrentRequest = true;
    dispatch({ type: "start" });

    void getProductById(productId)
      .then((response) => {
        if (isCurrentRequest) dispatch({ type: "success", product: response });
      })
      .catch((error: unknown) => {
        if (!isCurrentRequest) return;
        dispatch({
          type: "failure",
          errorMessage:
            error instanceof Error ? error.message : "Không thể tải sản phẩm.",
        });
      });

    return () => {
      isCurrentRequest = false;
    };
  }, [productId, reloadKey]);

  /* Tăng khoá tải lại để Effect thực thi API thêm một lần. */
  const retry = useCallback(() => {
    setReloadKey((currentKey) => currentKey + 1);
  }, []);

  /* Không để View nhận dữ liệu/loading sai khi URL chứa ID không hợp lệ. */
  const hasValidProductId = Number.isSafeInteger(productId) && productId > 0;

  /* Trả state và hành động tối thiểu mà View cần dùng. */
  return {
    product: hasValidProductId ? product : null,
    isLoading: hasValidProductId ? isLoading : false,
    errorMessage: hasValidProductId ? errorMessage : null,
    retry,
  };
}
