/*
 * Vai trò: Màn trải nghiệm 3D/AR, điều khiển model và bottom sheet mobile.
 */
import {
  ArrowLeftIcon,
  ArrowsClockwiseIcon,
  ArrowsOutSimpleIcon,
  ChairIcon,
  CircleNotchIcon,
  LeafIcon,
  MoonIcon,
  SparkleIcon,
  SunIcon,
} from "@phosphor-icons/react";
import {
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { Link, useParams } from "react-router-dom";
import darkStageBackground from "../../models/assets/images/san-khau-3d-toi-cmid.webp";
import darkStageMobileBackground from "../../models/assets/images/san-khau-3d-toi-mobile-v1.webp";
import lightStageBackground from "../../models/assets/images/san-khau-3d-sang-cmid.webp";
import lightStageMobileBackground from "../../models/assets/images/san-khau-3d-sang-mobile-v1.webp";
import { KhungXuong } from "../components/common/KhungXuong";
import { StatusPanel } from "../components/common/KhunTranThai";
import { Seo } from "../components/common/Seo";
import { PRODUCT_MODEL_CAMERA_LIMITS } from "../components/product/model-viewer-config";
import { useLanguage } from "../../controllers/state/NgonNguContext";
import { useProductController as useProduct } from "../../controllers/catalog/useProductController";
import {
  getCategoryName,
  getProductDescription,
  getProductName,
} from "../utils/localizeProduct";

type ModelViewerWithAR = HTMLElement & {
  canActivateAR?: boolean;
  activateAR?: () => Promise<void>;
};

type SheetSnap = "collapsed" | "expanded";

type SheetBounds = {
  collapsed: number;
  expanded: number;
};

type SheetDragState = {
  pointerId: number | null;
  startHeight: number;
  startSnap: SheetSnap;
  startY: number;
  lastTime: number;
  lastY: number;
  moved: boolean;
  velocityY: number;
};

const SHEET_SPRING = { stiffness: 350, damping: 32, mass: 0.9 };
const SHEET_SNAP_TRAVEL = 0.28;
const SHEET_VELOCITY_THRESHOLD = 600;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function applySheetResistance(value: number, min: number, max: number) {
  if (value < min) return min - (min - value) * 0.24;
  if (value > max) return max + (value - max) * 0.24;
  return value;
}

function requestSheetFrame(callback: FrameRequestCallback) {
  if (
    typeof window !== "undefined" &&
    typeof window.requestAnimationFrame === "function"
  ) {
    return window.requestAnimationFrame(callback);
  }
  return window.setTimeout(() => callback(Date.now()), 16);
}

function cancelSheetFrame(frame: number | null) {
  if (frame === null) return;
  if (
    typeof window !== "undefined" &&
    typeof window.cancelAnimationFrame === "function"
  ) {
    window.cancelAnimationFrame(frame);
    return;
  }
  window.clearTimeout(frame);
}

function TraiNghiem3DKhungXuong() {
  return (
    <main
      className="product-3d-experience product-3d-experience--loading"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <span className="sr-only">Đang tải trải nghiệm 3D</span>
      <header className="product-3d-experience__header" aria-hidden="true">
        <KhungXuong className="product-3d-experience__skeleton-back" />
        <div className="product-3d-experience__skeleton-title">
          <KhungXuong />
          <KhungXuong />
        </div>
        <KhungXuong className="product-3d-experience__skeleton-mode" />
      </header>
      <section className="product-3d-experience__stage" aria-hidden="true">
        <KhungXuong className="product-3d-experience__stage-skeleton" />
      </section>
    </main>
  );
}

export function TrangTraiNghiem3D() {
  const { id } = useParams();
  const productId = Number(id);
  const { product, isLoading, errorMessage, retry } = useProduct(productId);
  const { language } = useLanguage();
  const [viewerReady, setViewerReady] = useState(false);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [viewerError, setViewerError] = useState<string | null>(null);
  const [isOpeningAR, setIsOpeningAR] = useState(false);
  const [isDarkStage, setIsDarkStage] = useState(false);
  const [isMobileStoryCollapsed, setIsMobileStoryCollapsed] = useState(false);
  const viewerRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLElement>(null);
  const sheetRef = useRef<HTMLElement>(null);
  const sheetHandleRef = useRef<HTMLButtonElement>(null);
  const sheetContentRef = useRef<HTMLDivElement>(null);
  const sheetContentBodyRef = useRef<HTMLDivElement>(null);
  const sheetFooterRef = useRef<HTMLElement>(null);
  const sheetBoundsRef = useRef<SheetBounds>({ collapsed: 0, expanded: 0 });
  const sheetCurrentHeightRef = useRef(0);
  const sheetSnapRef = useRef<SheetSnap>("expanded");
  const sheetDragRef = useRef<SheetDragState>({
    pointerId: null,
    startHeight: 0,
    startSnap: "expanded",
    startY: 0,
    lastTime: 0,
    lastY: 0,
    moved: false,
    velocityY: 0,
  });
  const sheetSpringFrameRef = useRef<number | null>(null);
  const sheetWriteFrameRef = useRef<number | null>(null);
  const sheetPendingHeightRef = useRef<number | null>(null);
  const sheetReducedMotionRef = useRef(false);
  const suppressSheetHandleClickRef = useRef(false);
  const model = product?.models3D.find(
    (item) => item.isActive && item.modelUrl,
  );
  const productName = product ? getProductName(product, language) : "";
  const productDescription = product
    ? getProductDescription(product, language)
    : null;
  const categoryName = product
    ? getCategoryName(product.category, language)
    : undefined;
  const productPath = Number.isSafeInteger(productId)
    ? `/products/${productId}`
    : "/products";
  const highlights =
    product?.descriptionHighlights?.filter(Boolean).slice(0, 3) ?? [];
  const stageHighlights = highlights.length
    ? highlights
    : [
        "Hoàn thiện tỉ mỉ cho không gian sống hiện đại.",
        "Khám phá chất liệu và tỷ lệ ở mọi góc nhìn.",
        "Xoay và phóng to mô hình để xem chi tiết.",
      ];
  const keyFacts =
    product?.technicalSpecifications
      ?.filter((item) => item.label && item.value)
      .slice(0, 2) ?? [];

  useEffect(() => {
    let current = true;
    void import("@google/model-viewer")
      .then(() => {
        if (current) setViewerReady(true);
      })
      .catch(() => {
        if (current) setViewerError("Không tải được trình xem 3D.");
      });
    return () => {
      current = false;
    };
  }, []);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || !viewerReady) return undefined;

    const handleLoad = () => setModelLoaded(true);
    viewer.addEventListener("load", handleLoad);
    return () => viewer.removeEventListener("load", handleLoad);
  }, [viewerReady, model?.modelUrl]);

  async function openAR() {
    const viewer = viewerRef.current as ModelViewerWithAR | null;
    if (!viewer?.activateAR) {
      setViewerError("Thiết bị này chưa sẵn sàng để mở AR.");
      return;
    }

    setViewerError(null);
    setIsOpeningAR(true);
    try {
      await viewer.activateAR();
    } catch {
      setViewerError(
        "Không thể mở AR trên thiết bị này. Hãy dùng Chrome trên Android hoặc Safari trên iPhone/iPad.",
      );
    } finally {
      setIsOpeningAR(false);
    }
  }

  const isMobileStageViewport = useCallback(() => {
    if (typeof window === "undefined") return false;
    if (typeof window.matchMedia === "function")
      return window.matchMedia("(max-width: 820px)").matches;
    return window.innerWidth <= 820;
  }, []);

  const stopSheetSpring = useCallback(() => {
    cancelSheetFrame(sheetSpringFrameRef.current);
    sheetSpringFrameRef.current = null;
  }, []);

  const writeSheetHeight = useCallback(
    (height: number, immediately = false) => {
      const applyHeight = (nextHeight: number) => {
        sheetCurrentHeightRef.current = nextHeight;
        sheetRef.current?.style.setProperty(
          "--product-stage-sheet-current-height",
          `${nextHeight}px`,
        );
      };

      if (immediately) {
        cancelSheetFrame(sheetWriteFrameRef.current);
        sheetWriteFrameRef.current = null;
        sheetPendingHeightRef.current = null;
        applyHeight(height);
        return;
      }

      sheetPendingHeightRef.current = height;
      if (sheetWriteFrameRef.current !== null) return;

      sheetWriteFrameRef.current = requestSheetFrame(() => {
        sheetWriteFrameRef.current = null;
        const pendingHeight = sheetPendingHeightRef.current;
        sheetPendingHeightRef.current = null;
        if (pendingHeight !== null) applyHeight(pendingHeight);
      });
    },
    [],
  );

  const commitSheetSnap = useCallback((snap: SheetSnap) => {
    sheetSnapRef.current = snap;
    setIsMobileStoryCollapsed(snap === "collapsed");
  }, []);

  const snapSheetTo = useCallback(
    (snap: SheetSnap, initialVelocity = 0, immediately = false) => {
      const { collapsed, expanded } = sheetBoundsRef.current;
      const targetHeight = snap === "expanded" ? expanded : collapsed;

      stopSheetSpring();
      sheetSnapRef.current = snap;
      if (
        !targetHeight ||
        expanded <= collapsed ||
        immediately ||
        sheetReducedMotionRef.current
      ) {
        if (targetHeight) writeSheetHeight(targetHeight, true);
        commitSheetSnap(snap);
        return;
      }

      let position = clamp(
        sheetCurrentHeightRef.current || targetHeight,
        collapsed,
        expanded,
      );
      let velocity = clamp(initialVelocity, -1800, 1800);
      let previousTime: number | null = null;

      const animate = (time: number) => {
        const elapsed =
          previousTime === null
            ? 0.016
            : Math.min((time - previousTime) / 1000, 0.032);
        previousTime = time;

        const acceleration =
          (SHEET_SPRING.stiffness * (targetHeight - position) -
            SHEET_SPRING.damping * velocity) /
          SHEET_SPRING.mass;
        velocity += acceleration * elapsed;
        position += velocity * elapsed;
        writeSheetHeight(clamp(position, collapsed, expanded), true);

        if (Math.abs(targetHeight - position) < 0.5 && Math.abs(velocity) < 8) {
          writeSheetHeight(targetHeight, true);
          sheetSpringFrameRef.current = null;
          commitSheetSnap(snap);
          return;
        }

        sheetSpringFrameRef.current = requestSheetFrame(animate);
      };

      sheetSpringFrameRef.current = requestSheetFrame(animate);
    },
    [commitSheetSnap, stopSheetSpring, writeSheetHeight],
  );

  const measureSheet = useCallback(() => {
    if (!isMobileStageViewport()) {
      stopSheetSpring();
      sheetRef.current?.style.removeProperty(
        "--product-stage-sheet-current-height",
      );
      return;
    }

    const wasSpringing = sheetSpringFrameRef.current !== null;
    const stageHeight = stageRef.current?.clientHeight ?? 0;
    if (!stageHeight) {
      if (wasSpringing) stopSheetSpring();
      return;
    }

    const handleHeight = Math.max(
      sheetHandleRef.current?.offsetHeight ?? 0,
      30,
    );
    const footerHeight = Math.max(
      sheetFooterRef.current?.offsetHeight ?? 0,
      58,
    );
    const collapsed = Math.ceil(handleHeight + footerHeight);
    const contentStyles = sheetContentRef.current
      ? window.getComputedStyle(sheetContentRef.current)
      : null;
    const contentPadding =
      (Number.parseFloat(contentStyles?.paddingTop ?? "0") || 0) +
      (Number.parseFloat(contentStyles?.paddingBottom ?? "0") || 0);
    // `scrollHeight` on the scroll container includes its allocated empty
    // grid row. Measure the inner, natural-height body instead.
    const contentHeight = Math.ceil(
      (sheetContentBodyRef.current?.scrollHeight ?? 0) + contentPadding,
    );
    const maximumExpandedHeight = Math.min(
      Math.floor(stageHeight * 0.84),
      stageHeight - 8,
    );
    // Keep the expanded sheet as tall as its real content needs, rather than
    // always filling the available stage. The two extra pixels account for the
    // sheet's top border so the final line never gets clipped.
    const expanded = Math.max(
      collapsed,
      Math.min(collapsed + contentHeight + 2, maximumExpandedHeight),
    );
    const previousBounds = sheetBoundsRef.current;
    const isDragging = sheetDragRef.current.pointerId !== null;
    const previousRange = previousBounds.expanded - previousBounds.collapsed;
    const currentHeight = sheetCurrentHeightRef.current;

    if (wasSpringing) stopSheetSpring();
    sheetBoundsRef.current = { collapsed, expanded };

    if (isDragging && previousRange > 0 && currentHeight > 0) {
      const progress = clamp(
        (currentHeight - previousBounds.collapsed) / previousRange,
        0,
        1,
      );
      writeSheetHeight(collapsed + progress * (expanded - collapsed), true);
      return;
    }

    const targetHeight =
      sheetSnapRef.current === "expanded" ? expanded : collapsed;
    writeSheetHeight(targetHeight, true);
    if (wasSpringing) commitSheetSnap(sheetSnapRef.current);
  }, [
    commitSheetSnap,
    isMobileStageViewport,
    stopSheetSpring,
    writeSheetHeight,
  ]);

  useLayoutEffect(() => {
    if (typeof window === "undefined") return undefined;

    const updateSheetBounds = () => measureSheet();
    updateSheetBounds();

    // Do not observe the scroll container itself: its allocated grid row
    // changes on every drag frame, which would re-measure and fight the user's
    // finger. The inner body tells us when the actual product copy changes.
    const observedElements = [
      stageRef.current,
      sheetHandleRef.current,
      sheetContentBodyRef.current,
      sheetFooterRef.current,
    ].filter(Boolean) as Element[];
    const observer =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(updateSheetBounds);
    observedElements.forEach((element) => observer?.observe(element));

    window.addEventListener("resize", updateSheetBounds);
    window.addEventListener("orientationchange", updateSheetBounds);
    window.visualViewport?.addEventListener("resize", updateSheetBounds);

    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", updateSheetBounds);
      window.removeEventListener("orientationchange", updateSheetBounds);
      window.visualViewport?.removeEventListener("resize", updateSheetBounds);
    };
  }, [isLoading, measureSheet, model?.modelUrl]);

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      typeof window.matchMedia !== "function"
    )
      return undefined;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotionPreference = () => {
      sheetReducedMotionRef.current = reducedMotion.matches;
      if (reducedMotion.matches && isMobileStageViewport())
        snapSheetTo(sheetSnapRef.current, 0, true);
    };

    updateMotionPreference();
    reducedMotion.addEventListener("change", updateMotionPreference);
    return () =>
      reducedMotion.removeEventListener("change", updateMotionPreference);
  }, [isMobileStageViewport, snapSheetTo]);

  useEffect(() => {
    sheetSnapRef.current = "expanded";
    const resetFrame = requestSheetFrame(() => {
      setModelLoaded(false);
      setIsMobileStoryCollapsed(false);
      measureSheet();
      snapSheetTo("expanded", 0, true);
    });
    return () => cancelSheetFrame(resetFrame);
  }, [measureSheet, model?.modelUrl, snapSheetTo]);

  useEffect(
    () => () => {
      stopSheetSpring();
      cancelSheetFrame(sheetWriteFrameRef.current);
    },
    [stopSheetSpring],
  );

  const finishSheetDrag = useCallback(
    (target: SheetSnap, initialVelocity = 0) => {
      const drag = sheetDragRef.current;
      const wasMoved = drag.moved;
      sheetRef.current?.removeAttribute("data-sheet-dragging");
      sheetDragRef.current = {
        pointerId: null,
        startHeight: 0,
        startSnap: target,
        startY: 0,
        lastTime: 0,
        lastY: 0,
        moved: false,
        velocityY: 0,
      };
      suppressSheetHandleClickRef.current = wasMoved;
      snapSheetTo(target, initialVelocity);
    },
    [snapSheetTo],
  );

  const handleSheetPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLButtonElement>) => {
      if (!isMobileStageViewport() || event.isPrimary === false) return;

      suppressSheetHandleClickRef.current = false;

      const { collapsed, expanded } = sheetBoundsRef.current;
      if (expanded <= collapsed) {
        measureSheet();
      }

      const bounds = sheetBoundsRef.current;
      if (bounds.expanded <= bounds.collapsed) return;

      stopSheetSpring();
      const currentHeight = clamp(
        sheetCurrentHeightRef.current || bounds.expanded,
        bounds.collapsed,
        bounds.expanded,
      );
      const midpoint =
        bounds.collapsed + (bounds.expanded - bounds.collapsed) / 2;
      const startSnap: SheetSnap =
        currentHeight <= midpoint ? "collapsed" : "expanded";
      const now = performance.now();

      sheetDragRef.current = {
        pointerId: event.pointerId,
        startHeight: currentHeight,
        startSnap,
        startY: event.clientY,
        lastTime: now,
        lastY: event.clientY,
        moved: false,
        velocityY: 0,
      };
      sheetRef.current?.setAttribute("data-sheet-dragging", "true");
      event.currentTarget.setPointerCapture?.(event.pointerId);
    },
    [isMobileStageViewport, measureSheet, stopSheetSpring],
  );

  const handleSheetPointerMove = useCallback(
    (event: ReactPointerEvent<HTMLButtonElement>) => {
      const drag = sheetDragRef.current;
      if (drag.pointerId !== event.pointerId) return;

      const bounds = sheetBoundsRef.current;
      const dragDistance = event.clientY - drag.startY;
      const nextHeight = applySheetResistance(
        drag.startHeight - dragDistance,
        bounds.collapsed,
        bounds.expanded,
      );
      const now = performance.now();
      // Browser pointer events may be delivered together in one task. Clamp the
      // sample interval to 120 Hz so a tiny movement cannot turn into a false
      // high-velocity flick and make the sheet jump while opening or closing.
      const elapsed = Math.max((now - drag.lastTime) / 1000, 1 / 120);
      const nextVelocity = (event.clientY - drag.lastY) / elapsed;

      drag.velocityY = drag.velocityY * 0.72 + nextVelocity * 0.28;
      drag.lastY = event.clientY;
      drag.lastTime = now;
      if (Math.abs(dragDistance) > 4) drag.moved = true;

      writeSheetHeight(nextHeight);
      if (drag.moved) event.preventDefault();
    },
    [writeSheetHeight],
  );

  const handleSheetPointerUp = useCallback(
    (event: ReactPointerEvent<HTMLButtonElement>) => {
      const drag = sheetDragRef.current;
      if (drag.pointerId !== event.pointerId) return;

      const bounds = sheetBoundsRef.current;
      const range = Math.max(bounds.expanded - bounds.collapsed, 1);
      const releasedHeight = clamp(
        drag.startHeight - (event.clientY - drag.startY),
        bounds.collapsed,
        bounds.expanded,
      );
      const travelTowardOtherSnap =
        drag.startSnap === "expanded"
          ? (drag.startHeight - releasedHeight) / range
          : (releasedHeight - drag.startHeight) / range;
      let target = drag.startSnap;

      if (Math.abs(drag.velocityY) >= SHEET_VELOCITY_THRESHOLD) {
        target = drag.velocityY > 0 ? "collapsed" : "expanded";
      } else if (travelTowardOtherSnap >= SHEET_SNAP_TRAVEL) {
        target = drag.startSnap === "expanded" ? "collapsed" : "expanded";
      }

      writeSheetHeight(releasedHeight, true);
      finishSheetDrag(target, -drag.velocityY);
    },
    [finishSheetDrag, writeSheetHeight],
  );

  const handleSheetPointerCancel = useCallback(
    (event: ReactPointerEvent<HTMLButtonElement>) => {
      const drag = sheetDragRef.current;
      if (drag.pointerId !== event.pointerId) return;
      const bounds = sheetBoundsRef.current;
      const canceledHeight = clamp(
        drag.startHeight - (drag.lastY - drag.startY),
        bounds.collapsed,
        bounds.expanded,
      );
      writeSheetHeight(canceledHeight, true);
      finishSheetDrag(drag.startSnap);
    },
    [finishSheetDrag, writeSheetHeight],
  );

  const handleSheetHandleClick = useCallback(() => {
    if (!isMobileStageViewport()) return;
    if (suppressSheetHandleClickRef.current) {
      suppressSheetHandleClickRef.current = false;
      return;
    }
    snapSheetTo(
      sheetSnapRef.current === "collapsed" ? "expanded" : "collapsed",
    );
  }, [isMobileStageViewport, snapSheetTo]);

  if (isLoading) {
    return <TraiNghiem3DKhungXuong />;
  }

  if (errorMessage) {
    return (
      <main className="product-3d-experience product-3d-experience--status">
        <StatusPanel title="Không thể tải mô hình 3D" tone="error">
          <p>{errorMessage}</p>
          <button
            className="button button--small"
            type="button"
            onClick={retry}
          >
            Thử lại
          </button>
        </StatusPanel>
      </main>
    );
  }

  if (!product || !model) {
    return (
      <main className="product-3d-experience product-3d-experience--status">
        <StatusPanel title="Sản phẩm chưa có mô hình 3D">
          <p>CMID đang chuẩn bị trải nghiệm 3D cho sản phẩm này.</p>
          <Link className="button button--small button--gold" to={productPath}>
            Quay lại sản phẩm
          </Link>
        </StatusPanel>
      </main>
    );
  }

  return (
    <>
      <Seo
        title={`Trải nghiệm 3D ${productName} | CMID`}
        description={`Xem mô hình 3D của ${productName} tại CMID.`}
        language={language}
        canonicalPath={`${productPath}/3d`}
        image={model.posterUrl ?? undefined}
        robots="noindex,nofollow"
      />
      <main
        className={`product-3d-experience${modelLoaded ? " is-model-loaded" : " is-model-loading"}${isDarkStage ? " product-3d-experience--dark-stage" : ""}${isMobileStoryCollapsed ? " is-mobile-story-collapsed" : ""}`}
      >
        <header className="product-3d-experience__header">
          <Link
            className="product-3d-experience__back"
            to={productPath}
            aria-label={`Quay lại ${productName}`}
          >
            <ArrowLeftIcon size={21} /> <span>Quay lại sản phẩm</span>
          </Link>
          <div className="product-3d-experience__title">
            <b>CMID</b>
            <span>{productName}</span>
          </div>
          <div className="product-3d-experience__stage-actions">
            <button
              className="color-theme-switch"
              type="button"
              data-theme={isDarkStage ? "dark" : "light"}
              aria-pressed={isDarkStage}
              aria-label={
                isDarkStage
                  ? "Chuyển sang sân khấu sáng"
                  : "Chuyển sang sân khấu tối"
              }
              onClick={() => setIsDarkStage((current) => !current)}
            >
              <span className="color-theme-switch__thumb" aria-hidden="true" />
              <SunIcon size={14} weight="bold" aria-hidden="true" />
              <MoonIcon size={14} weight="fill" aria-hidden="true" />
            </button>
          </div>
        </header>

        <section
          ref={stageRef}
          className="product-3d-experience__stage"
          aria-label={`Mô hình 3D ${productName}`}
          style={
            {
              "--product-stage-backdrop": `url(${isDarkStage ? darkStageBackground : lightStageBackground})`,
              "--product-stage-backdrop-mobile": `url(${isDarkStage ? darkStageMobileBackground : lightStageMobileBackground})`,
            } as CSSProperties
          }
        >
          <div className="product-3d-experience__ambient" aria-hidden="true" />
          {viewerError ? (
            <p className="product-3d-experience__error" role="alert">
              {viewerError}
            </p>
          ) : null}
          {viewerReady ? (
            <model-viewer
              ref={viewerRef}
              src={model.modelUrl}
              poster={model.posterUrl ?? undefined}
              alt={`Mô hình 3D ${productName}`}
              camera-controls=""
              disable-tap=""
              disable-pan=""
              touch-action="pan-y"
              camera-orbit="0deg 75deg 145%"
              field-of-view="30deg"
              {...PRODUCT_MODEL_CAMERA_LIMITS}
              shadow-intensity="1"
              exposure="0.95"
              ar
              ar-modes="webxr scene-viewer quick-look"
              ar-scale="auto"
              xr-environment=""
              loading="eager"
              reveal="auto"
              onLoad={() => setModelLoaded(true)}
              onError={() =>
                setViewerError(
                  "Không mở được mô hình 3D. Hãy quay lại trang sản phẩm và thử lại.",
                )
              }
            />
          ) : (
            <div
              className="product-3d-experience__stage-loading"
              role="status"
              aria-live="polite"
              aria-busy="true"
            >
              <span className="sr-only">Đang tải mô hình 3D</span>
              <KhungXuong className="product-3d-experience__stage-skeleton" />
            </div>
          )}

          <aside ref={sheetRef} className="product-3d-experience__story">
            <button
              ref={sheetHandleRef}
              className="product-3d-experience__sheet-handle"
              type="button"
              aria-controls="product-stage-story-content"
              aria-expanded={!isMobileStoryCollapsed}
              aria-label={
                isMobileStoryCollapsed
                  ? "Mở thông tin sản phẩm"
                  : "Thu gọn thông tin sản phẩm"
              }
              onClick={handleSheetHandleClick}
              onPointerCancel={handleSheetPointerCancel}
              onPointerDown={handleSheetPointerDown}
              onPointerMove={handleSheetPointerMove}
              onPointerUp={handleSheetPointerUp}
            >
              <span className="sr-only">
                {isMobileStoryCollapsed
                  ? "Mở thông tin sản phẩm"
                  : "Thu gọn thông tin sản phẩm"}
              </span>
            </button>
            <div
              ref={sheetContentRef}
              id="product-stage-story-content"
              className="product-3d-experience__story-content"
            >
              <div
                ref={sheetContentBodyRef}
                className="product-3d-experience__story-content-body"
              >
                <span>{categoryName ?? "Bộ sưu tập CMID"}</span>
                <h1>{productName}</h1>
                <p>
                  {productDescription ??
                    `Khám phá ${productName} trong không gian trưng bày của CMID.`}
                </p>
                {keyFacts.length ? (
                  <dl className="product-3d-experience__story-facts">
                    {keyFacts.map((fact) => (
                      <div key={fact.label}>
                        <dt>{fact.label}</dt>
                        <dd>{fact.value}</dd>
                      </div>
                    ))}
                  </dl>
                ) : null}
                <ul>
                  {stageHighlights.map((highlight, index) => (
                    <li key={highlight}>
                      {index === 0 ? (
                        <LeafIcon size={21} weight="light" />
                      ) : index === 1 ? (
                        <ChairIcon size={21} weight="light" />
                      ) : (
                        <SparkleIcon size={21} weight="light" />
                      )}
                      <span>{highlight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <footer
              ref={sheetFooterRef}
              className="product-3d-experience__story-footer"
            >
              <button
                className="product-3d-experience__ar product-3d-experience__story-ar"
                type="button"
                disabled={!viewerReady || isOpeningAR}
                onClick={() => void openAR()}
              >
                <ArrowsOutSimpleIcon size={19} />
                {isOpeningAR ? "Đang mở AR…" : "Xem trong không gian"}
              </button>
              <div
                className="product-3d-experience__story-services"
                aria-label="Cam kết dịch vụ CMID"
              >
                <span>Giao hàng toàn quốc</span>
                <span>Bảo hành chính hãng</span>
                <span>Tư vấn chuyên nghiệp</span>
              </div>
              <p className="product-3d-experience__hint product-3d-experience__hint--footer">
                <ArrowsClockwiseIcon size={14} /> Kéo để xoay · Cuộn để thu
                phóng
              </p>
            </footer>
          </aside>

          <p className="product-3d-experience__hint product-3d-experience__hint--stage">
            <ArrowsClockwiseIcon size={16} /> Kéo để xoay · Cuộn để thu phóng
          </p>
        </section>

        <div
          className="product-3d-experience__model-loader"
          aria-hidden={modelLoaded}
          aria-live="polite"
          aria-busy={!modelLoaded}
        >
          {viewerError ? (
            <div
              className="product-3d-experience__model-loader-content product-3d-experience__model-loader-content--error"
              role="alert"
            >
              <strong>Không thể tải mô hình 3D</strong>
              <p>{viewerError}</p>
              <Link to={productPath}>Quay lại sản phẩm</Link>
            </div>
          ) : (
            <div
              className="product-3d-experience__model-loader-content"
              role="status"
            >
              <CircleNotchIcon
                className="is-spinning"
                size={28}
                weight="bold"
                aria-hidden="true"
              />
              <strong>Vui lòng chờ</strong>
              <p>Đang tải mô hình 3D…</p>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
