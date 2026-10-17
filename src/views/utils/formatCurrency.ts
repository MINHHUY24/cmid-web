/*
 * Vai trò: Định dạng giá theo ngôn ngữ Việt/Anh.
 */
import type { AppLanguage } from '../../models/content/site-content'

export function formatCurrency(value: string | number | null, language: AppLanguage = 'vi'): string {
  if (value === null || value === '') {
    return language === 'en' ? 'Contact us' : 'Liên hệ'
  }

  const amount = typeof value === 'number' ? value : Number(value)

  if (!Number.isFinite(amount)) {
    return language === 'en' ? 'Contact us' : 'Liên hệ'
  }

  return `${new Intl.NumberFormat(language === 'en' ? 'en-US' : 'vi-VN', {
    maximumFractionDigits: 0,
  }).format(amount)} ${language === 'en' ? 'VND' : 'đ'}`
}
