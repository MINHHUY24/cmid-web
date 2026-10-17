/*
 * Vai trò: Tương tác kéo để tải lại trên mobile.
 */
import { CircleNotchIcon } from '@phosphor-icons/react'
import { useEffect, useRef, useState } from 'react'

const PULL_TO_REFRESH_THRESHOLD = 78
const MAX_PULL_DISTANCE = 116

type PullState = {
  distance: number
  isRefreshing: boolean
}

function resetPullState(
  setPullState: (state: PullState) => void,
  distanceRef: { current: number },
) {
  distanceRef.current = 0
  setPullState({ distance: 0, isRefreshing: false })
}

export function PullToRefresh() {
  const [pullState, setPullState] = useState<PullState>({
    distance: 0,
    isRefreshing: false,
  })
  const startYRef = useRef(0)
  const distanceRef = useRef(0)
  const isPullingRef = useRef(false)
  const isRefreshingRef = useRef(false)

  useEffect(() => {
    const mobileMediaQuery = window.matchMedia('(max-width: 1024px)')
    let isSupportedViewport = mobileMediaQuery.matches
    let refreshTimeout: number | undefined

    const clearPull = () => {
      isPullingRef.current = false
      resetPullState(setPullState, distanceRef)
    }

    const refreshPage = () => {
      isRefreshingRef.current = true
      distanceRef.current = PULL_TO_REFRESH_THRESHOLD
      setPullState({
        distance: PULL_TO_REFRESH_THRESHOLD,
        isRefreshing: true,
      })

      refreshTimeout = window.setTimeout(() => {
        window.location.reload()
      }, 260)
    }

    const handleTouchStart = (event: TouchEvent) => {
      if (
        !isSupportedViewport ||
        isRefreshingRef.current ||
        event.touches.length !== 1 ||
        window.scrollY > 0
      ) {
        return
      }

      const target = event.target instanceof Element ? event.target : null

      if (target?.closest('[data-pull-to-refresh-ignore]')) {
        return
      }

      isPullingRef.current = true
      startYRef.current = event.touches[0].clientY
    }

    const handleTouchMove = (event: TouchEvent) => {
      if (!isPullingRef.current || isRefreshingRef.current) {
        return
      }

      const touch = event.touches[0]

      if (!touch || window.scrollY > 0) {
        clearPull()
        return
      }

      const verticalDistance = touch.clientY - startYRef.current

      if (verticalDistance <= 0) {
        clearPull()
        return
      }

      event.preventDefault()

      const distance = Math.min(MAX_PULL_DISTANCE, verticalDistance * 0.55)
      distanceRef.current = distance
      setPullState({ distance, isRefreshing: false })
    }

    const handleTouchEnd = () => {
      if (!isPullingRef.current || isRefreshingRef.current) {
        return
      }

      const shouldRefresh = distanceRef.current >= PULL_TO_REFRESH_THRESHOLD
      isPullingRef.current = false

      if (shouldRefresh) {
        refreshPage()
        return
      }

      resetPullState(setPullState, distanceRef)
    }

    const handleViewportChange = (event: MediaQueryListEvent) => {
      isSupportedViewport = event.matches

      if (!isSupportedViewport && !isRefreshingRef.current) {
        clearPull()
      }
    }

    document.addEventListener('touchstart', handleTouchStart, { passive: true })
    document.addEventListener('touchmove', handleTouchMove, { passive: false })
    document.addEventListener('touchend', handleTouchEnd, { passive: true })
    document.addEventListener('touchcancel', handleTouchEnd, { passive: true })
    mobileMediaQuery.addEventListener('change', handleViewportChange)

    return () => {
      document.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleTouchEnd)
      document.removeEventListener('touchcancel', handleTouchEnd)
      mobileMediaQuery.removeEventListener('change', handleViewportChange)

      if (refreshTimeout !== undefined) {
        window.clearTimeout(refreshTimeout)
      }
    }
  }, [])

  const isVisible = pullState.distance > 0
  const isReady = pullState.distance >= PULL_TO_REFRESH_THRESHOLD
  const progress = Math.min(1, pullState.distance / PULL_TO_REFRESH_THRESHOLD)
  const translateY = -60 + Math.min(pullState.distance, 76)
  const className = [
    'pull-to-refresh',
    isVisible ? 'pull-to-refresh--visible' : '',
    isReady ? 'pull-to-refresh--ready' : '',
    pullState.isRefreshing ? 'pull-to-refresh--refreshing' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div
      className={className}
      role="status"
      aria-live="polite"
      aria-label={pullState.isRefreshing ? 'Đang làm mới trang' : 'Kéo xuống để làm mới trang'}
      style={{ transform: `translate(-50%, ${translateY}px)` }}
    >
      <CircleNotchIcon
        size={24}
        weight="bold"
        aria-hidden="true"
        style={{ transform: `rotate(${Math.round(progress * 180)}deg)` }}
      />
      <span className="sr-only">
        {pullState.isRefreshing
          ? 'Đang làm mới trang'
          : isReady
            ? 'Thả tay để làm mới trang'
            : 'Kéo xuống để làm mới trang'}
      </span>
    </div>
  )
}
