/*
 * Vai trò: Dialog chọn ngôn ngữ lần đầu.
 */
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { LanguageWelcomeDialog } from '../src/views/components/common/ChonNgonNguDialog'
import { LanguageProvider } from '../src/controllers/state/NgonNguProvider'

function renderDialog() {
  return render(
    <LanguageProvider>
      <LanguageWelcomeDialog />
    </LanguageProvider>,
  )
}

beforeEach(() => {
  window.localStorage.clear()
  window.sessionStorage.clear()
  document.documentElement.dataset.theme = 'light'
})

afterEach(() => {
  cleanup()
  window.localStorage.clear()
  window.sessionStorage.clear()
  document.body.style.overflow = ''
  delete document.documentElement.dataset.theme
})

describe('language welcome dialog', () => {
  it('appears once per browser tab and stays hidden after it is completed', () => {
    window.localStorage.setItem('cmid-language', 'vi')
    const firstRender = renderDialog()

    expect(screen.getByRole('dialog', { name: 'Chọn ngôn ngữ hiển thị' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: /Tiếng Việt/ }))

    expect(screen.queryByRole('dialog')).toBeNull()
    expect(window.sessionStorage.getItem('cmid-language-welcome-complete')).toBe('true')

    firstRender.unmount()
    renderDialog()

    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('keeps the saved language while showing the welcome on a new visit', () => {
    window.localStorage.setItem('cmid-language', 'en')

    renderDialog()

    expect(screen.getByRole('dialog', { name: 'Choose display language' })).toBeTruthy()
    expect(screen.getByRole('button', { name: /English/ }).getAttribute('aria-pressed')).toBe('true')
  })
})
