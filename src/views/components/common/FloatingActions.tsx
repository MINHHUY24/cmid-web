/*
 * Vai trò: Nút Zalo/liên hệ và cuộn lên đầu trang.
 */
import { ArrowUpIcon } from '@phosphor-icons/react'
import { useEffect, useRef, useState } from 'react'
import { useLanguage } from '../../../controllers/state/NgonNguContext'

const SCROLL_TOP_THRESHOLD = 320
const zaloContactUrl = import.meta.env.VITE_ZALO_URL?.trim() || 'https://zalo.me/'
const zaloPhone = import.meta.env.VITE_ZALO_PHONE?.trim() || '1800 6868'

function easeInOutCubic(progress: number) {
  return progress < 0.5
    ? 4 * progress * progress * progress
    : 1 - Math.pow(-2 * progress + 2, 3) / 2
}

export function FloatingActions() {
  const { language } = useLanguage()
  const [isScrollTopVisible, setIsScrollTopVisible] = useState(false)
  const scrollAnimationFrameRef = useRef<number | null>(null)
  const previousScrollBehaviorRef = useRef<string | null>(null)
  const isVietnamese = language === 'vi'
  const zaloLabel = isVietnamese ? 'Liên hệ qua Zalo' : 'Contact via Zalo'
  const scrollTopLabel = isVietnamese ? 'Cuộn lên đầu trang' : 'Back to top'

  useEffect(() => {
    const updateScrollTopVisibility = () => {
      setIsScrollTopVisible(window.scrollY >= SCROLL_TOP_THRESHOLD)
    }

    updateScrollTopVisibility()
    window.addEventListener('scroll', updateScrollTopVisibility, { passive: true })

    return () => window.removeEventListener('scroll', updateScrollTopVisibility)
  }, [])

  useEffect(() => () => {
    if (scrollAnimationFrameRef.current !== null) {
      window.cancelAnimationFrame(scrollAnimationFrameRef.current)
    }

    if (previousScrollBehaviorRef.current !== null) {
      document.documentElement.style.scrollBehavior = previousScrollBehaviorRef.current
    }
  }, [])

  const scrollToTop = () => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const startY = window.scrollY

    if (prefersReducedMotion || startY === 0) {
      window.scrollTo({ top: 0, behavior: 'auto' })
      return
    }

    if (scrollAnimationFrameRef.current !== null) {
      window.cancelAnimationFrame(scrollAnimationFrameRef.current)
    }

    if (previousScrollBehaviorRef.current !== null) {
      document.documentElement.style.scrollBehavior = previousScrollBehaviorRef.current
    }

    previousScrollBehaviorRef.current = document.documentElement.style.scrollBehavior
    document.documentElement.style.scrollBehavior = 'auto'

    const duration = Math.min(1_800, Math.max(1_100, startY * 0.32))
    const startedAt = window.performance.now()
    const animate = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / duration)
      const nextY = Math.round(startY * (1 - easeInOutCubic(progress)))

      window.scrollTo({ top: nextY, behavior: 'auto' })

      if (progress < 1) {
        scrollAnimationFrameRef.current = window.requestAnimationFrame(animate)
        return
      }

      scrollAnimationFrameRef.current = null
      document.documentElement.style.scrollBehavior = previousScrollBehaviorRef.current ?? ''
      previousScrollBehaviorRef.current = null
    }

    scrollAnimationFrameRef.current = window.requestAnimationFrame(animate)
  }

  return (
    <div className="site-floating-actions" role="group" aria-label={isVietnamese ? 'Tiện ích nhanh' : 'Quick actions'}>
      <a
        className="site-floating-actions__button site-floating-actions__button--zalo"
        href={zaloContactUrl}
        target="_blank"
        rel="noreferrer"
        aria-label={`${zaloLabel}: ${zaloPhone}`}
        title={zaloLabel}
      >
        <span className="site-floating-actions__zalo-mark" aria-hidden="true">Zalo</span>
        <span className="site-floating-actions__phone" aria-hidden="true">{zaloPhone}</span>
      </a>

      {isScrollTopVisible ? (
        <button
          type="button"
          className="site-floating-actions__button site-floating-actions__button--scroll-top"
          aria-label={scrollTopLabel}
          title={scrollTopLabel}
          onClick={scrollToTop}
        >
          <ArrowUpIcon size={22} weight="bold" aria-hidden="true" />
        </button>
      ) : null}
    </div>
  )
}
