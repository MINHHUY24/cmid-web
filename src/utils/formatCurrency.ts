export function formatCurrency(value: string | number | null): string {
  if (value === null || value === '') {
    return 'Liên hệ'
  }

  const amount = typeof value === 'number' ? value : Number(value)

  if (!Number.isFinite(amount)) {
    return 'Liên hệ'
  }

  return `${new Intl.NumberFormat('vi-VN', {
    maximumFractionDigits: 0,
  }).format(amount)} đ`
}
