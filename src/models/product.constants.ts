/*
 * Vai trò: Nhãn hiển thị và hằng số dùng chung cho `SaleType`/trạng thái sản phẩm.
 */
/* Kiểu loại hình bán hàng do Model sản phẩm định nghĩa. */
import type { SaleType } from './product'

/* Ánh xạ mã nghiệp vụ sang nhãn tiếng Việt hiển thị trên giao diện. */
export const SALE_TYPE_LABELS: Record<SaleType, string> = {
  DIRECT_ORDER: 'Mua trực tiếp',
  REQUEST_QUOTE: 'Yêu cầu báo giá',
}
