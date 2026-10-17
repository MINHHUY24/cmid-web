/*
 * Vai trò: Tạo và kiểm tra giao dịch thanh toán MoMo.
 */
/* HTTP client cho các endpoint thanh toán cần gắn phiên khách hàng. */
import { apiFetch } from "./api";

/* Hai phương thức thanh toán MoMo được backend hỗ trợ. */
export type MomoPaymentMethod = "MOMO_WALLET" | "MOMO_CARD";

/* Dữ liệu cần để backend tạo đơn và URL thanh toán MoMo. */
export interface CreateMomoPaymentInput {
  paymentMethod: MomoPaymentMethod;
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  address: string;
  note?: string;
  items: Array<{
    productId: number;
    quantity: number;
  }>;
}

/* Thông tin điều hướng/QR được backend trả về sau khi tạo giao dịch. */
export interface CreateMomoPaymentResponse {
  orderId: string;
  payUrl: string;
  deeplink: string | null;
  qrCodeUrl: string | null;
}

/* Trạng thái thanh toán và trạng thái đơn tương ứng để View cập nhật. */
export interface MomoPaymentStatus {
  orderId: string;
  paymentStatus: "PENDING" | "PAID" | "FAILED";
  orderStatus:
    | "PENDING_PAYMENT"
    | "PENDING_CONFIRMATION"
    | "PAYMENT_FAILED"
    | "CANCELLED";
  total: number;
}

/* Khởi tạo giao dịch MoMo từ dữ liệu checkout đã được kiểm tra. */
export function createMomoPayment(input: CreateMomoPaymentInput) {
  return apiFetch<CreateMomoPaymentResponse>("/payments/momo", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

/* Poll trạng thái đơn, mã hoá orderId trước khi chèn vào URL. */
export function getMomoPaymentStatus(orderId: string) {
  return apiFetch<MomoPaymentStatus>(
    `/payments/momo/${encodeURIComponent(orderId)}`,
  );
}
