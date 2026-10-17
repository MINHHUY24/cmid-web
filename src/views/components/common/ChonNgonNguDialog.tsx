/*
 * Vai trò: Dialog chào lần đầu để người dùng chọn ngôn ngữ.
 */
import { CaretRightIcon, XIcon } from '@phosphor-icons/react'
import { useEffect, useState } from 'react'
import logoImage from '../../../models/assets/images/logo.webp'
import type { AppLanguage } from '../../../models/content/site-content'
import { useLanguage } from '../../../controllers/state/NgonNguContext'

const LANGUAGE_WELCOME_SESSION_KEY = 'cmid-language-welcome-complete'

const dialogCopy = {
  vi: {
    eyebrow: 'CHÀO MỪNG',
    title: 'Chọn ngôn ngữ hiển thị',
    description: 'Bạn có thể thay đổi ngôn ngữ bất cứ lúc nào trên thanh điều hướng.',
    groupLabel: 'Chọn ngôn ngữ giao diện',
    closeLabel: 'Đóng',
    options: { vi: 'Tiếng Việt', en: 'Tiếng Anh' },
  },
  en: {
    eyebrow: 'WELCOME',
    title: 'Choose display language',
    description: 'You can change your language anytime from the navigation bar.',
    groupLabel: 'Choose interface language',
    closeLabel: 'Close',
    options: { vi: 'Vietnamese', en: 'English' },
  },
} satisfies Record<AppLanguage, {
  eyebrow: string
  title: string
  description: string
  groupLabel: string
  closeLabel: string
  options: Record<AppLanguage, string>
}>

function shouldShowLanguageWelcome(): boolean {
  try {
    return window.sessionStorage.getItem(LANGUAGE_WELCOME_SESSION_KEY) !== 'true'
  } catch {
    return true
  }
}

function rememberWelcomeForCurrentVisit() {
  try {
    window.sessionStorage.setItem(LANGUAGE_WELCOME_SESSION_KEY, 'true')
  } catch {
    // The dialog still closes for this visit when storage is unavailable.
  }
}

export function LanguageWelcomeDialog() {
  const { language, setLanguage } = useLanguage()
  const [isOpen, setIsOpen] = useState(shouldShowLanguageWelcome)
  const copy = dialogCopy[language]

  useEffect(() => {
    if (!isOpen) return undefined

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [isOpen])

  function chooseLanguage(language: AppLanguage) {
    rememberWelcomeForCurrentVisit()
    setLanguage(language)
    setIsOpen(false)
  }

  function closeDialog() {
    rememberWelcomeForCurrentVisit()
    setIsOpen(false)
  }

  if (!isOpen) return null

  return (
    <div className="language-welcome" role="presentation">
      <section
        className="language-welcome__dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="language-welcome-title"
        aria-describedby="language-welcome-description"
      >
        <button
          className="language-welcome__close"
          type="button"
          onClick={closeDialog}
          aria-label={copy.closeLabel}
        >
          <XIcon size={18} weight="bold" aria-hidden="true" />
        </button>

        <div className="language-welcome__brand">
          <img src={logoImage} alt="CMID" />
          <span>STONE &amp; INTERIOR</span>
        </div>

        <div className="language-welcome__heading">
          <p>{copy.eyebrow}</p>
          <h1 id="language-welcome-title">{copy.title}</h1>
          <p id="language-welcome-description">{copy.description}</p>
        </div>

        <div className="language-welcome__options" role="group" aria-label={copy.groupLabel}>
          <button
            className={language === 'vi' ? 'is-selected' : ''}
            type="button"
            autoFocus={language === 'vi'}
            aria-pressed={language === 'vi'}
            onClick={() => chooseLanguage('vi')}
          >
            <span className="language-welcome__code" lang="vi">VI</span>
            <strong>{copy.options.vi}</strong>
            <CaretRightIcon size={19} weight="bold" aria-hidden="true" />
          </button>

          <button
            className={language === 'en' ? 'is-selected' : ''}
            type="button"
            autoFocus={language === 'en'}
            aria-pressed={language === 'en'}
            onClick={() => chooseLanguage('en')}
          >
            <span className="language-welcome__code" lang="en">EN</span>
            <strong>{copy.options.en}</strong>
            <CaretRightIcon size={19} weight="bold" aria-hidden="true" />
          </button>
        </div>
      </section>
    </div>
  )
}
