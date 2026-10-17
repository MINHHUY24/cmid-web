/*
 * Vai trò: Khai báo type/context và hook `useCart`; không tự chứa UI.
 */
/* API React để tạo Context toàn cục và đọc Context trong View. */
import { createContext, useContext } from "react";
/* Model sản phẩm được lưu cùng số lượng trong giỏ. */
import type { Product } from "../../models/product";

/* Một dòng hàng trong giỏ: sản phẩm gốc và số lượng khách chọn. */
export interface CartItem {
  product: Product;
  quantity: number;
}

/* Hợp đồng dữ liệu và thao tác của giỏ hàng dành cho mọi View con. */
export interface CartContextValue {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  cartToastProductName: string | null;
  addItem: (product: Product, quantity?: number) => void;
  dismissCartToast: () => void;
  updateQuantity: (productId: number, quantity: number) => void;
  removeItem: (productId: number) => void;
  clearCart: () => void;
}

/* Context mặc định là null để phát hiện trường hợp quên bọc CartProvider. */
export const CartContext = createContext<CartContextValue | null>(null);

/* Hook tiện dụng, đồng thời báo lỗi rõ ràng nếu được gọi ngoài Provider. */
export function useCart(): CartContextValue {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used within CartProvider.");
  }

  return context;
}
