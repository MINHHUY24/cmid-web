import { useEffect, useState } from "react";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import { AppLayout } from "../layouts/BoCucUngDung";
import { TrangChuPage } from "../pages/TrangChu";
import { TrangDichVuPage } from "../pages/TrangDichVu";
import { TrangDuAnPage } from "../pages/TrangDuAn";
import { TrangGiaiPhapPage } from "../pages/TrangGiaiPhap";
import { TrangHeThongShowroomPage } from "../pages/TrangHeThongTrungBay";
import { TrangLienHePage } from "../pages/TrangLienHe";
import { TrangSanPhamPage } from "../pages/TrangSanPham";
import { TrangChiTietSanPham } from "../pages/TrangChiTietSanPham";
import { TrangGioHangPage } from "../pages/TrangGioHang";
import { TrangThanhToanPage } from "../pages/TrangThanhToan";
import { TrangTinTucSuKienPage } from "../pages/TrangTinTucSuKien";
import { TrangChiTietTinTucPage } from "../pages/TrangChiTietTinTuc";
import { TrangVeCmidPage } from "../pages/TrangVeCmid";
import { TrangDangNhapPage } from "../pages/TrangDangNhap";
import { TrangTaiKhoanPage } from "../pages/TrangTaiKhoan";
import { TrangBaoTriPage } from "../pages/TrangBaoTri";
import { TrangQuanTriPage } from "../pages/admin/TrangQuanTri";
import {
  ADMIN_DATABASE_UPDATED_EVENT,
  getAdminDatabase,
} from "../pages/admin/admin-database";

export function AppRouter() {
  return (
    <BrowserRouter>
      <ScrollToTop />
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
      <Route path="/admin" element={<TrangQuanTriPage />} />
      <Route element={<PublicWebsiteGate />}>
        <Route index element={<TrangChuPage />} />
        <Route path="products" element={<TrangSanPhamPage />} />
        <Route path="products/:id" element={<TrangChiTietSanPham />} />
        <Route path="gio-hang" element={<TrangGioHangPage />} />
        <Route path="thanh-toan" element={<TrangThanhToanPage />} />
        <Route path="dang-nhap" element={<TrangDangNhapPage />} />
        <Route path="tai-khoan" element={<TrangTaiKhoanPage />} />
        <Route path="giai-phap" element={<TrangGiaiPhapPage />} />
        <Route path="du-an" element={<TrangDuAnPage />} />
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
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

function PublicWebsiteGate() {
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(
    () => getAdminDatabase().settings.maintenanceMode,
  );

  useEffect(() => {
    const syncMaintenanceMode = () =>
      setIsMaintenanceMode(getAdminDatabase().settings.maintenanceMode);

    window.addEventListener(ADMIN_DATABASE_UPDATED_EVENT, syncMaintenanceMode);
    window.addEventListener("storage", syncMaintenanceMode);
    return () => {
      window.removeEventListener(
        ADMIN_DATABASE_UPDATED_EVENT,
        syncMaintenanceMode,
      );
      window.removeEventListener("storage", syncMaintenanceMode);
    };
  }, []);

  return isMaintenanceMode ? <TrangBaoTriPage /> : <AppLayout />;
}

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = pathname.startsWith("/admin")
      ? "CMID | Quản trị"
      : "CMID | Website";
  }, [pathname]);

  return null;
}
