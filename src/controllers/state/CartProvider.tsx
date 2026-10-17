/*
 * Vai trò: Quản lý giỏ hàng, đồng bộ localStorage, thêm/xóa/cập nhật số lượng và toast giỏ hàng.
 */
/* Hook React quản lý giỏ hàng, callback ổn định và Context value. */
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
/* Model sản phẩm và hàm tính giá bán đã chuẩn hoá. */
import type { Product } from "../../models/product";
import { getProductPrice } from "../../models/order";
import {
  CartContext,
  type CartContextValue,
  type CartItem,
} from "./GioHangContext";

/* Khoá localStorage giúp giỏ hàng còn nguyên sau khi khách tải lại trang. */
const CART_STORAGE_KEY = "cmid-cart";

/* Đọc và kiểm tra dữ liệu cũ; dữ liệu hỏng luôn được thay bằng giỏ rỗng. */
function readStoredCart(): CartItem[] {
  try {
    const storedCart = window.localStorage.getItem(CART_STORAGE_KEY);

    if (!storedCart) {
      return [];
    }

    const parsedCart: unknown = JSON.parse(storedCart);

    if (!Array.isArray(parsedCart)) {
      return [];
    }

    return parsedCart.filter(
      (item): item is CartItem =>
        typeof item === "object" &&
        item !== null &&
        "product" in item &&
        "quantity" in item &&
        typeof item.quantity === "number" &&
        item.quantity > 0,
    );
  } catch {
    return [];
  }
}

/* Provider cung cấp giỏ hàng và các thao tác cập nhật cho tất cả View con. */
export function CartProvider({ children }: { children: ReactNode }) {
  /* State dòng hàng và tên sản phẩm dùng để hiển thị toast thêm vào giỏ. */
  const [items, setItems] = useState<CartItem[]>(readStoredCart);
  const [cartToastProductName, setCartToastProductName] = useState<
    string | null
  >(null);

  /* Lưu lại toàn bộ giỏ mỗi khi người dùng thay đổi số lượng hoặc sản phẩm. */
  useEffect(() => {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  /* Thêm sản phẩm mới hoặc cộng dồn số lượng nếu nó đã có trong giỏ. */
  const addItem = useCallback((product: Product, quantity = 1) => {
    const safeQuantity = Math.max(1, Math.floor(quantity));

    setItems((currentItems) => {
      const currentItem = currentItems.find(
        (item) => item.product.id === product.id,
      );

      if (!currentItem) {
        return [...currentItems, { product, quantity: safeQuantity }];
      }

      return currentItems.map((item) =>
        item.product.id === product.id
          ? { ...item, quantity: item.quantity + safeQuantity }
          : item,
      );
    });
    setCartToastProductName(product.name);
  }, []);

  /* Đóng toast sau khi View đã thông báo sản phẩm vừa được thêm. */
  const dismissCartToast = useCallback(() => {
    setCartToastProductName(null);
  }, []);

  /* Cập nhật số lượng; số lượng không dương đồng nghĩa xoá dòng hàng đó. */
  const updateQuantity = useCallback((productId: number, quantity: number) => {
    setItems((currentItems) =>
      currentItems.flatMap((item) => {
        if (item.product.id !== productId) {
          return [item];
        }

        return quantity > 0
          ? [{ ...item, quantity: Math.floor(quantity) }]
          : [];
      }),
    );
  }, []);

  /* Xoá một sản phẩm cụ thể khỏi giỏ. */
  const removeItem = useCallback((productId: number) => {
    setItems((currentItems) =>
      currentItems.filter((item) => item.product.id !== productId),
    );
  }, []);

  /* Làm trống giỏ, thường dùng sau khi đơn hàng được tạo thành công. */
  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  /* Tính tổng số lượng/tạm tính và memo hoá Context value để giảm render lại. */
  const value = useMemo<CartContextValue>(
    () => ({
      items,
      itemCount: items.reduce((total, item) => total + item.quantity, 0),
      subtotal: items.reduce(
        (total, item) =>
          total + getProductPrice(item.product.price) * item.quantity,
        0,
      ),
      cartToastProductName,
      addItem,
      dismissCartToast,
      updateQuantity,
      removeItem,
      clearCart,
    }),
    [
      addItem,
      cartToastProductName,
      clearCart,
      dismissCartToast,
      items,
      removeItem,
      updateQuantity,
    ],
  );

  /* Phân phối giỏ hàng cho mọi component phía dưới Provider. */
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
