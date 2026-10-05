import { lazy, Suspense, useEffect, useRef, useState } from "react";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigationType,
} from "react-router-dom";
import { AppLayout } from "../layouts/BoCucUngDung";
import { TrangChuPage } from "../pages/TrangChu";
import { TrangDichVuPage } from "../pages/TrangDichVu";
import { TrangDuAnPage } from "../pages/TrangDuAn";
import { TrangChiTietDuAnPage } from "../pages/TrangChiTietDuAn";
import { TrangGiaiPhapPage } from "../pages/TrangGiaiPhap";
import { TrangHeThongShowroomPage } from "../pages/TrangHeThongTrungBay";
import { TrangLienHePage } from "../pages/TrangLienHe";
import { TrangSanPhamPage } from "../pages/TrangSanPham";
import { TrangChiTietSanPham } from "../pages/TrangChiTietSanPham";
import { TrangTraiNghiem3D } from "../pages/TrangTraiNghiem3D";
import { TrangGioHangPage } from "../pages/TrangGioHang";
import { TrangThanhToanPage } from "../pages/TrangThanhToan";
import { TrangTinTucSuKienPage } from "../pages/TrangTinTucSuKien";
import { TrangChiTietTinTucPage } from "../pages/TrangChiTietTinTuc";
import { TrangVeCmidPage } from "../pages/TrangVeCmid";
import { TrangDangNhapPage } from "../pages/TrangDangNhap";
import { TrangTaiKhoanPage } from "../pages/TrangTaiKhoan";
import { TrangBaoTriPage } from "../pages/TrangBaoTri";
import { TrangKhongTimThayPage } from "../pages/TrangKhongTimThay";
import {
  ADMIN_DATABASE_UPDATED_EVENT,
  getAdminDatabase,
} from "../pages/admin/admin-database";
import {
  getSharedMaintenanceMode,
  usesSharedMaintenanceMode,
} from "../services/maintenance-mode.service";

const TrangQuanTriPage = lazy(() =>
  import("../pages/admin/TrangQuanTri").then(({ TrangQuanTriPage }) => ({
    default: TrangQuanTriPage,
  })),
);

export function AppRouter() {
  return (
    <BrowserRouter>
      <ScrollRestoration />
      <AppRoutes />
    </BrowserRouter>
  );
}

function AppRoutes() {
  const { pathname } = useLocation();

  if (pathname === "//admin") {
    return <Navigate to="/admin" replace />;
  }

  return (
    <Routes>
      <Route
        path="/admin"
        element={
          <Suspense fallback={<AdminRouteFallback />}>
            <TrangQuanTriPage />
          </Suspense>
        }
      />
      <Route element={<PublicWebsiteGate />}>
        <Route index element={<TrangChuPage />} />
        <Route path="products" element={<TrangSanPhamPage />} />
        <Route path="products/:id" element={<TrangChiTietSanPham />} />
        <Route path="products/:id/3d" element={<TrangTraiNghiem3D />} />
        <Route path="gio-hang" element={<TrangGioHangPage />} />
        <Route path="thanh-toan" element={<TrangThanhToanPage />} />
        <Route path="dang-nhap" element={<TrangDangNhapPage />} />
        <Route path="tai-khoan" element={<TrangTaiKhoanPage />} />
        <Route path="giai-phap" element={<TrangGiaiPhapPage />} />
        <Route path="du-an" element={<TrangDuAnPage />} />
        <Route path="du-an/:slug" element={<TrangChiTietDuAnPage />} />
        <Route path="dich-vu" element={<TrangDichVuPage />} />
        <Route path="ve-cmid" element={<TrangVeCmidPage />} />
        <Route path="lien-he" element={<TrangLienHePage />} />
        <Route path="tin-tuc-su-kien" element={<TrangTinTucSuKienPage />} />
        <Route
          path="tin-tuc-su-kien/:slug"
          element={<TrangChiTietTinTucPage />}
        />
        <Route
          path="he-thong-showroom"
          element={<TrangHeThongShowroomPage />}
        />
        <Route path="*" element={<TrangKhongTimThayPage />} />
      </Route>
    </Routes>
  );
}

function AdminRouteFallback() {
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        display: "grid",
        minHeight: "100dvh",
        placeItems: "center",
        background: "var(--cmid-palette-f4f1eb, #f4f1eb)",
        color: "var(--cmid-palette-25231f, #25231f)",
        fontFamily: "var(--cmid-font, system-ui)",
      }}
    >
      Đang tải trang quản trị…
    </div>
  );
}

function PublicWebsiteGate() {
  const usesSharedMode = usesSharedMaintenanceMode();
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(
    () => getAdminDatabase().settings.maintenanceMode,
  );
  const [isMaintenanceModeReady, setIsMaintenanceModeReady] = useState(
    () => !usesSharedMode,
  );

  useEffect(() => {
    let isCurrent = true;
    const syncMaintenanceMode = () => {
      if (!usesSharedMode) {
        setIsMaintenanceMode(getAdminDatabase().settings.maintenanceMode);
        setIsMaintenanceModeReady(true);
        return;
      }

      void getSharedMaintenanceMode()
        .then((maintenanceMode) => {
          if (isCurrent) setIsMaintenanceMode(maintenanceMode);
        })
        .catch(() => {
          if (isCurrent) {
            setIsMaintenanceMode(getAdminDatabase().settings.maintenanceMode);
          }
        })
        .finally(() => {
          if (isCurrent) setIsMaintenanceModeReady(true);
        });
    };

    window.addEventListener(ADMIN_DATABASE_UPDATED_EVENT, syncMaintenanceMode);
    window.addEventListener("storage", syncMaintenanceMode);
    syncMaintenanceMode();
    const refreshInterval = usesSharedMode
      ? window.setInterval(syncMaintenanceMode, 30_000)
      : undefined;
    return () => {
      isCurrent = false;
      window.removeEventListener(
        ADMIN_DATABASE_UPDATED_EVENT,
        syncMaintenanceMode,
      );
      window.removeEventListener("storage", syncMaintenanceMode);
      if (refreshInterval) window.clearInterval(refreshInterval);
    };
  }, [usesSharedMode]);

  if (!isMaintenanceModeReady) return null;
  return isMaintenanceMode ? <TrangBaoTriPage /> : <AppLayout />;
}

const SCROLL_POSITION_PREFIX = "cmid-scroll-position:";

function ScrollRestoration() {
  const location = useLocation();
  const navigationType = useNavigationType();
  const lastHandledLocationKey = useRef<string | null>(null);
  const previousPathname = useRef(location.pathname);
  const restoringUrl = useRef<string | null>(null);
  const locationUrl = `${location.pathname}${location.search}`;

  useEffect(() => {
    if (location.pathname.startsWith("/admin")) {
      document.title = "CMID | Quản trị";
      const robots =
        document.head.querySelector<HTMLMetaElement>('meta[name="robots"]') ??
        document.head.appendChild(document.createElement("meta"));
      robots.name = "robots";
      robots.content = "noindex,nofollow,noarchive";
    }
  }, [location.pathname]);

  useEffect(() => {
    const previousRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";
    return () => {
      window.history.scrollRestoration = previousRestoration;
    };
  }, []);

  useEffect(() => {
    let frame = 0;

    const savePosition = () => {
      if (frame || restoringUrl.current === locationUrl) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        writeScrollPosition(locationUrl, window.scrollY);
      });
    };

    const saveBeforeLeave = () => {
      if (restoringUrl.current !== locationUrl) {
        writeScrollPosition(locationUrl, window.scrollY);
      }
    };
    window.addEventListener("scroll", savePosition, { passive: true });
    window.addEventListener("pagehide", saveBeforeLeave);

    return () => {
      window.removeEventListener("scroll", savePosition);
      window.removeEventListener("pagehide", saveBeforeLeave);
      if (frame) window.cancelAnimationFrame(frame);
      saveBeforeLeave();
    };
  }, [locationUrl]);

  useEffect(() => {
    const isInitialLocation = lastHandledLocationKey.current === null;
    const isNewLocation = lastHandledLocationKey.current !== location.key;

    // Effects run twice in development Strict Mode. Only react once for each
    // router location so the initial `POP` does not get mistaken for Back.
    if (!isNewLocation) return;

    const pathnameBeforeNavigation = previousPathname.current;
    lastHandledLocationKey.current = location.key;
    previousPathname.current = location.pathname;

    if (location.hash) {
      const frame = window.requestAnimationFrame(() => {
        document.getElementById(location.hash.slice(1))?.scrollIntoView();
      });
      return () => window.cancelAnimationFrame(frame);
    }

    // A page opened directly, or reached through a normal route link, starts
    // at the beginning. Back/Forward and an explicit opt-in can still restore
    // the saved position. Search-param changes on the same page deliberately
    // do nothing, which keeps account tabs and filters at their current scroll.
    if (isInitialLocation) {
      restoringUrl.current = null;
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      return;
    }

    const shouldRestore = navigationType === "POP" || location.state?.restoreScroll === true;

    if (shouldRestore) {
      restoringUrl.current = locationUrl;
      return restoreScrollPosition(locationUrl, () => {
        if (restoringUrl.current === locationUrl) restoringUrl.current = null;
      });
    }

    restoringUrl.current = null;
    if (pathnameBeforeNavigation !== location.pathname) {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }
  }, [location.hash, location.key, location.pathname, location.state, locationUrl, navigationType]);

  return null;
}

function readScrollPosition(url: string) {
  try {
    const stored = window.sessionStorage.getItem(`${SCROLL_POSITION_PREFIX}${url}`);
    const value = Number(stored);
    return Number.isFinite(value) && value > 0 ? value : 0;
  } catch {
    return 0;
  }
}

function writeScrollPosition(url: string, position: number) {
  try {
    window.sessionStorage.setItem(`${SCROLL_POSITION_PREFIX}${url}`, String(Math.max(0, position)));
  } catch {
    // Browsing still works when session storage is blocked.
  }
}

function restoreScrollPosition(url: string, onFinished: () => void) {
  const target = readScrollPosition(url);
  if (!target) {
    onFinished();
    return undefined;
  }

  let attempts = 0;
  let finished = false;
  let timer = 0;
  let observer: ResizeObserver | undefined;
  const finish = () => {
    if (finished) return;
    finished = true;
    window.clearInterval(timer);
    observer?.disconnect();
    window.removeEventListener("wheel", finish);
    window.removeEventListener("touchstart", finish);
    onFinished();
  };
  const restore = () => {
    attempts += 1;
    const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    window.scrollTo({ top: Math.min(target, maxScroll), left: 0, behavior: "auto" });

    if (Math.abs(window.scrollY - target) <= 2 || attempts >= 300) finish();
  };
  timer = window.setInterval(restore, 50);
  if (typeof ResizeObserver !== "undefined") {
    observer = new ResizeObserver(restore);
    observer.observe(document.documentElement);
  }
  window.addEventListener("wheel", finish, { passive: true });
  window.addEventListener("touchstart", finish, { passive: true });
  restore();

  return finish;
}
