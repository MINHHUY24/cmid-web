import { ApiError } from '../services/api'

export function getPaymentErrorMessage(error: unknown) {
  if (error instanceof ApiError) return error.message
  if (error instanceof Error && error.message) return error.message
  return 'Không thể khởi tạo thanh toán. Vui lòng thử lại.'
}
