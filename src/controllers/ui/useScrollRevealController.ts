/*
 * Vai trò: Theo dõi khi một phần tử View đi vào vùng nhìn thấy để kích hoạt hiệu ứng xuất hiện một lần.
 */
/* Hook React lưu phần tử cần quan sát và trạng thái đã xuất hiện. */
import { useEffect, useRef, useState } from "react";

/* Ngưỡng quan sát để card xuất hiện sớm, nhẹ nhàng nhưng không giật. */
const REVEAL_OBSERVER_OPTIONS: IntersectionObserverInit = {
  rootMargin: "0px 0px 4% 0px",
  threshold: 0.04,
};

/* Bỏ animation khi SSR, trình duyệt cũ hoặc người dùng bật giảm chuyển động. */
function shouldShowWithoutAnimation() {
  if (typeof window === "undefined") return true;

  const prefersReducedMotion =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  return prefersReducedMotion || !("IntersectionObserver" in window);
}

/* Controller kích hoạt animation một lần khi phần tử đi vào khung nhìn. */
export function useScrollRevealController<T extends HTMLElement>() {
  /* Ref nối vào phần tử View; state quyết định class CSS đã hiện hay chưa. */
  const elementRef = useRef<T>(null);
  const [isRevealed, setIsRevealed] = useState(shouldShowWithoutAnimation);

  /* Gắn IntersectionObserver và tự ngắt sau lần xuất hiện đầu tiên. */
  useEffect(() => {
    const element = elementRef.current;
    if (!element || isRevealed) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (!entry?.isIntersecting) return;

      setIsRevealed(true);
      observer.unobserve(entry.target);
    }, REVEAL_OBSERVER_OPTIONS);

    observer.observe(element);
    return () => observer.disconnect();
  }, [isRevealed]);

  /* View dùng ref/state này để gắn class CSS; `reveal` dành cho trigger thủ công. */
  return {
    elementRef,
    isRevealed,
    reveal: () => setIsRevealed(true),
  };
}
