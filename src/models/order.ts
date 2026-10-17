/*
 * Vai trò: Quy tắc tính giá: chuyển chuỗi giá thành số và tính subtotal, VAT, phí giao hàng, tổng đơn.
 */
/* Chuyển giá API dạng chuỗi về số an toàn; giá không hợp lệ được xem là 0. */
export function getProductPrice(price: string | null): number {
  const value = Number(price)

  return Number.isFinite(value) ? value : 0
}

/* Tính các thành phần đơn hàng hiện hành từ giá trị tạm tính. */
export function getOrderCosts(subtotal: number) {
  /* Chính sách hiện tại miễn phí giao hàng và áp dụng VAT 10%. */
  const delivery = 0
  const vat = Math.round(subtotal * 0.1)

  /* Trả object đã tách từng loại chi phí để View hiển thị minh bạch. */
  return {
    delivery,
    vat,
    total: subtotal + delivery + vat,
  }
}
