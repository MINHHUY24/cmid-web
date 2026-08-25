export function getProductPrice(price: string | null): number {
  const value = Number(price)

  return Number.isFinite(value) ? value : 0
}

export function getOrderCosts(subtotal: number) {
  const delivery = 0
  const vat = Math.round(subtotal * 0.1)

  return {
    delivery,
    vat,
    total: subtotal + delivery + vat,
  }
}
