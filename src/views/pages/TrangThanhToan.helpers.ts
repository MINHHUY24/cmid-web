/*
 * Vai trò: Chuyển lỗi payment/API thành thông báo thanh toán dễ hiểu.
 */
/* Lỗi HTTP chuẩn hoá do apiFetch tạo ra. */
import { ApiError } from "../../services/api";

/* Chuyển mọi dạng lỗi thành câu dễ hiểu để View checkout hiển thị cho khách. */
export function getPaymentErrorMessage(error: unknown) {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error && error.message) return error.message;
  return "Không thể khởi tạo thanh toán. Vui lòng thử lại.";
}
