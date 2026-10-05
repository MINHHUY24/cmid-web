import type { AppLanguage } from '../../content/site-content'

type LocalizedMessage = {
  vi: string
  en: string
}

const validationMessages: Record<string, LocalizedMessage> = {
  'admin.validation.fullName.minLength': {
    vi: 'Họ và tên phải có ít nhất 2 ký tự.',
    en: 'The full name must be at least 2 characters long.',
  },
  'admin.validation.fullName.maxLength': {
    vi: 'Họ và tên không được dài quá 120 ký tự.',
    en: 'The full name cannot be longer than 120 characters.',
  },
  'admin.validation.username.format': {
    vi: 'Phần tên email chỉ dùng chữ thường không dấu, số và các ký tự . _ -; độ dài từ 2 đến 63 ký tự.',
    en: 'The email username may only use lowercase letters, numbers, and . _ -; it must be 2–63 characters long.',
  },
  'admin.validation.password.minLength': {
    vi: 'Mật khẩu phải có ít nhất 10 ký tự.',
    en: 'The password must be at least 10 characters long.',
  },
  'admin.validation.password.maxLength': {
    vi: 'Mật khẩu không được dài quá 128 ký tự.',
    en: 'The password cannot be longer than 128 characters.',
  },
  'admin.validation.roleCode.maxLength': {
    vi: 'Vai trò không hợp lệ.',
    en: 'The role is invalid.',
  },
  'admin.validation.role.codeFormat': {
    vi: 'Mã vai trò không hợp lệ.',
    en: 'The role code is invalid.',
  },
  'admin.validation.role.name.minLength': {
    vi: 'Tên vai trò phải có ít nhất 2 ký tự.',
    en: 'The role name must be at least 2 characters long.',
  },
  'admin.validation.role.name.maxLength': {
    vi: 'Tên vai trò không được dài quá 100 ký tự.',
    en: 'The role name cannot be longer than 100 characters.',
  },
  'admin.validation.role.description.maxLength': {
    vi: 'Mô tả vai trò không được dài quá 500 ký tự.',
    en: 'The role description cannot be longer than 500 characters.',
  },
  'helpdesk.validation.subject.minLength': {
    vi: 'Tiêu đề yêu cầu phải có ít nhất 4 ký tự.',
    en: 'The request title must be at least 4 characters long.',
  },
  'helpdesk.validation.subject.maxLength': {
    vi: 'Tiêu đề yêu cầu không được dài quá 180 ký tự.',
    en: 'The request title cannot be longer than 180 characters.',
  },
  'helpdesk.validation.category.invalid': {
    vi: 'Vui lòng chọn một danh mục hỗ trợ hợp lệ.',
    en: 'Please select a valid support category.',
  },
  'helpdesk.validation.priority.invalid': {
    vi: 'Vui lòng chọn mức độ ưu tiên hợp lệ.',
    en: 'Please select a valid priority.',
  },
  'helpdesk.validation.message.minLength': {
    vi: 'Nội dung hỗ trợ không được để trống.',
    en: 'The support message cannot be empty.',
  },
  'helpdesk.validation.message.maxLength': {
    vi: 'Nội dung hỗ trợ không được dài quá 8.000 ký tự.',
    en: 'The support message cannot be longer than 8,000 characters.',
  },
  'helpdesk.validation.status.invalid': {
    vi: 'Trạng thái hỗ trợ không hợp lệ.',
    en: 'The support status is invalid.',
  },
  'helpdesk.validation.assignee.invalid': {
    vi: 'Người phụ trách không hợp lệ.',
    en: 'The assignee is invalid.',
  },
}

function chooseCopy(language: AppLanguage, message: LocalizedMessage) {
  return language === 'vi' ? message.vi : message.en
}

/**
 * ValidationPipe returns class-validator's English implementation details.
 * Keep those technical strings out of the admin UI and present the field rule
 * in the language currently selected for administration instead.
 */
export function localizeAdminErrorMessage(message: string, language: AppLanguage) {
  const normalized = message.trim()
  const messages: string[] = []
  const add = (copy: LocalizedMessage) => {
    const value = chooseCopy(language, copy)
    if (!messages.includes(value)) messages.push(value)
  }

  Object.entries(validationMessages).forEach(([key, copy]) => {
    if (normalized.includes(key)) add(copy)
  })

  if (messages.length > 0) return messages.join(' ')

  if (/^internal server error\.?$/i.test(normalized)) {
    return language === 'vi'
      ? 'Máy chủ đang gặp lỗi tạm thời. Vui lòng thử lại sau ít phút.'
      : 'The server is temporarily unavailable. Please try again shortly.'
  }

  if (/\busername must match\b/i.test(normalized)) {
    add({
      vi: 'Phần tên email chỉ dùng chữ thường không dấu, số và các ký tự . _ -; độ dài từ 2 đến 63 ký tự.',
      en: 'The email username may only use lowercase letters, numbers, and . _ -; it must be 2–63 characters long.',
    })
  }
  if (/\busername must be longer than or equal to\b/i.test(normalized)) {
    add({
      vi: 'Phần tên email phải có ít nhất 2 ký tự.',
      en: 'The email username must be at least 2 characters long.',
    })
  }
  if (/\busername must be shorter than or equal to\b/i.test(normalized)) {
    add({
      vi: 'Phần tên email không được dài quá 63 ký tự.',
      en: 'The email username cannot be longer than 63 characters.',
    })
  }
  if (/\bpassword must be longer than or equal to\b/i.test(normalized)) {
    add({
      vi: 'Mật khẩu phải có ít nhất 10 ký tự.',
      en: 'The password must be at least 10 characters long.',
    })
  }
  if (/\bpassword must be shorter than or equal to\b/i.test(normalized)) {
    add({
      vi: 'Mật khẩu không được dài quá 128 ký tự.',
      en: 'The password cannot be longer than 128 characters.',
    })
  }
  if (/\bfullName must be longer than or equal to\b/i.test(normalized)) {
    add({
      vi: 'Họ và tên phải có ít nhất 2 ký tự.',
      en: 'The full name must be at least 2 characters long.',
    })
  }
  if (/\bfullName must be shorter than or equal to\b/i.test(normalized)) {
    add({
      vi: 'Họ và tên không được dài quá 120 ký tự.',
      en: 'The full name cannot be longer than 120 characters.',
    })
  }
  if (/\broleCode must be a string\b/i.test(normalized)) {
    add({
      vi: 'Vui lòng chọn một vai trò hợp lệ.',
      en: 'Please select a valid role.',
    })
  }

  return messages.length > 0 ? messages.join(' ') : normalized
}

export function getLocalizedAdminError(
  error: unknown,
  language: AppLanguage,
  fallback: string,
) {
  const message = error instanceof Error ? error.message : fallback
  return localizeAdminErrorMessage(message, language)
}
