/*
 * Vai trò: Dịch validation/API error Admin sang đúng Việt/Anh.
 */
import { describe, expect, it } from 'vitest'
import { localizeAdminErrorMessage } from '../src/views/pages/admin/ThongBaoLoiQuanTri'

describe('localizeAdminErrorMessage', () => {
  it('turns legacy class-validator details into friendly Vietnamese copy', () => {
    expect(localizeAdminErrorMessage(
      'username must match /^[a-z0-9][a-z0-9._-]{1,62}$/ regular expression, password must be longer than or equal to 10 characters',
      'vi',
    )).toBe(
      'Phần tên email chỉ dùng chữ thường không dấu, số và các ký tự . _ -; độ dài từ 2 đến 63 ký tự. Mật khẩu phải có ít nhất 10 ký tự.',
    )
  })

  it('uses the selected language for stable API validation keys', () => {
    expect(localizeAdminErrorMessage(
      'admin.validation.username.format, admin.validation.password.minLength',
      'en',
    )).toBe(
      'The email username may only use lowercase letters, numbers, and . _ -; it must be 2–63 characters long. The password must be at least 10 characters long.',
    )
  })

  it('keeps Helpdesk validation feedback in Vietnamese when Vietnamese is selected', () => {
    expect(localizeAdminErrorMessage(
      'helpdesk.validation.subject.minLength, helpdesk.validation.message.minLength',
      'vi',
    )).toBe(
      'Tiêu đề yêu cầu phải có ít nhất 4 ký tự. Nội dung hỗ trợ không được để trống.',
    )
  })

  it('does not leave generic server errors in English in the Vietnamese admin', () => {
    expect(localizeAdminErrorMessage('Internal server error', 'vi')).toBe(
      'Máy chủ đang gặp lỗi tạm thời. Vui lòng thử lại sau ít phút.',
    )
  })
})
