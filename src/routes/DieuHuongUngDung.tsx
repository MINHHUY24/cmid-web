import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from '../layouts/BoCucUngDung'
import { TrangChuPage } from '../pages/TrangChu'
import { TrangDichVuPage } from '../pages/TrangDichVu'
import { TrangDuAnPage } from '../pages/TrangDuAn'
import { TrangGiaiPhapPage } from '../pages/TrangGiaiPhap'
import { TrangHeThongShowroomPage } from '../pages/TrangHeThongTrungBay'
import { TrangLienHePage } from '../pages/TrangLienHe'
import { TrangSanPhamPage } from '../pages/TrangSanPham'
import { TrangChiTietSanPham } from '../pages/TrangChiTietSanPham'
import { TrangTinTucSuKienPage } from '../pages/TrangTinTucSuKien'
import { TrangVeCmidPage } from '../pages/TrangVeCmid'

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<TrangChuPage />} />
          <Route path="products" element={<TrangSanPhamPage />} />
          <Route path="products/:id" element={<TrangChiTietSanPham />} />
          <Route path="giai-phap" element={<TrangGiaiPhapPage />} />
          <Route path="du-an" element={<TrangDuAnPage />} />
          <Route path="dich-vu" element={<TrangDichVuPage />} />
          <Route path="ve-cmid" element={<TrangVeCmidPage />} />
          <Route path="lien-he" element={<TrangLienHePage />} />
          <Route path="tin-tuc-su-kien" element={<TrangTinTucSuKienPage />} />
          <Route path="he-thong-showroom" element={<TrangHeThongShowroomPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
