# Bản đồ từng file frontend CMID

Tài liệu này là chú thích nhanh cho người mới vào dự án. Mỗi dòng trả lời ba câu hỏi: file thuộc lớp nào, chịu trách nhiệm gì, và nên tìm ở đâu khi cần sửa chức năng đó.

## Cách đọc luồng MVC

```text
Route -> View -> Controller -> Service -> Backend API
                 ^
                 |
          Model (kiểu dữ liệu, dữ liệu chuẩn, phép tính)
```

- **Model**: không render JSX, không gọi HTTP.
- **Service**: gateway giao tiếp API; không import từ `views`.
- **Controller**: hook/provider điều phối trạng thái, loading và hành động.
- **View**: JSX, accessibility, CSS và các helper chỉ dùng để hiển thị.
- Các file quản trị cũ có tên tiếng Việt để thống nhất với phần còn lại của ứng dụng; tên component export vẫn dùng tiếng Anh khi cần tương thích.

## Điểm khởi động và điều hướng

| File | Lớp | Chức năng |
| --- | --- | --- |
| `src/main.tsx` | Bootstrap | Gắn React vào DOM, import CSS gốc và dọn các cache phiên bản cũ trước khi chạy app. |
| `src/UngDung.tsx` | Composition root | Ghép các Provider toàn cục và router thành ứng dụng hoàn chỉnh. |
| `src/routes/DieuHuongUngDung.tsx` | Route | Khai báo URL -> Page, lazy-load Admin, cổng maintenance/3D và lưu-phục hồi vị trí cuộn. |
| `src/@types/model-viewer.d.ts` | External type | Khai báo TypeScript cho thẻ web component `<model-viewer>`. |

## Model — dữ liệu và quy tắc nghiệp vụ

| File | Chức năng |
| --- | --- |
| `src/models/product.ts` | Kiểu domain sản phẩm: category, brand, ảnh, model 3D, tồn kho, trạng thái và loại bán. Đây là nguồn type chuẩn cho toàn bộ sản phẩm. |
| `src/models/product.constants.ts` | Nhãn hiển thị và hằng số dùng chung cho `SaleType`/trạng thái sản phẩm. |
| `src/models/order.ts` | Quy tắc tính giá: chuyển chuỗi giá thành số và tính subtotal, VAT, phí giao hàng, tổng đơn. |
| `src/models/admin-workspace.ts` | Toàn bộ type của workspace Admin: danh mục, thương hiệu, đơn, khách, quyền, showroom, cấu hình. |
| `src/models/branches.ts` | Dữ liệu chi nhánh/showroom CMID tĩnh dùng cho giao diện. |
| `src/models/content/site-content.ts` | Nội dung UI song ngữ Việt/Anh và các type `AppLanguage`, `SiteContent`. |
| `src/models/content/admin-content.ts` | Từ điển chữ hiển thị trong Admin và hàm dịch text quản trị. |
| `src/models/content/news-articles.ts` | Danh mục/từ khóa bài viết và dữ liệu tin tức tĩnh làm fallback. |
| `src/models/assets/` | 70 ảnh/logo/banner tĩnh. Không chứa logic; chỉ được import bởi Model/Service/View khi hiển thị. |

## Controller — điều phối trạng thái và hành động

### Catalogue và nội dung

| File | Chức năng |
| --- | --- |
| `src/controllers/catalog/useProductController.ts` | Tải một sản phẩm theo ID; trả về `product`, loading, error và retry cho trang chi tiết/3D. |
| `src/controllers/catalog/useProductsController.ts` | Tải danh sách catalogue; gom trạng thái tải, lỗi và tải lại. |
| `src/controllers/content/useNewsArticlesController.ts` | Tải danh sách bài tin cho các View tin tức. |
| `src/controllers/content/useProjectsController.ts` | Tải danh sách dự án cho các View dự án. |
| `src/controllers/ui/useColorThemeController.ts` | Đọc/lưu/toggle sáng-tối, cập nhật `data-theme`, `color-scheme` và màu trình duyệt di động. |

### Shared state — các Provider toàn cục

| File | Chức năng |
| --- | --- |
| `src/controllers/state/GioHangContext.ts` | Khai báo type/context và hook `useCart`; không tự chứa UI. |
| `src/controllers/state/CartProvider.tsx` | Quản lý giỏ hàng, đồng bộ localStorage, thêm/xóa/cập nhật số lượng và toast giỏ hàng. |
| `src/controllers/state/NgonNguContext.ts` | Khai báo context ngôn ngữ và hook `useLanguage`. |
| `src/controllers/state/NgonNguProvider.tsx` | Chọn ngôn ngữ ban đầu từ trình duyệt/storage, cung cấp content Việt/Anh. |
| `src/controllers/state/NguoiDungContext.ts` | Type/context và hook cho khách hàng đăng nhập, hồ sơ và phiên auth. |
| `src/controllers/state/NguoiDungProvider.tsx` | Khôi phục phiên khách, Google Sign-In, đồng bộ/cập nhật hồ sơ với API và local cache an toàn. |
| `src/controllers/state/QuanTriAuthContext.ts` | Khai báo context xác thực Admin. |
| `src/controllers/state/QuanTriContext.tsx` | Provider xác thực Admin: đăng nhập, refresh phiên, đăng xuất và access token. |
| `src/controllers/state/useQuanTriAuth.ts` | Hook an toàn để đọc `AdminAuthContext`. |
| `src/controllers/state/ThongTinWebsiteContext.tsx` | Provider tải/cập nhật site settings công khai dùng bởi header, footer và SEO. |

## Service — giao tiếp backend/API

| File | Chức năng |
| --- | --- |
| `src/services/api.ts` | HTTP client dùng chung; gắn base URL/header/token, parse lỗi và cung cấp `ApiError`. |
| `src/services/auth-token.ts` | Lưu/đọc/xóa access token theo scope khách/Admin, đăng ký refresh token. |
| `src/services/auth-tab.ts` | Tạo ID riêng cho tab trình duyệt và header phân biệt phiên auth giữa các tab. |
| `src/services/auth.service.ts` | Endpoint login Google/Admin, refresh session, đọc user hiện tại và logout. |
| `src/services/customer-profile.service.ts` | Endpoint hồ sơ khách hàng: đọc, tạo/cập nhật profile và map dữ liệu server. |
| `src/services/product.service.ts` | CRUD sản phẩm catalogue và chuyển `Product` sang payload API. |
| `src/services/order.service.ts` | Endpoint đơn hàng khách/Admin, cập nhật trạng thái/thanh toán/hoàn tiền và type response đơn. |
| `src/services/payment.service.ts` | Tạo và kiểm tra giao dịch thanh toán MoMo. |
| `src/services/project.service.ts` | Lấy/ghi/xóa dự án, localize nội dung song ngữ và resolve URL ảnh dự án. |
| `src/services/news.service.ts` | Lấy/ghi/xóa tin tức, localize bài viết, normalize category và resolve ảnh tin. |
| `src/services/inquiry.service.ts` | Gửi form liên hệ/báo giá và quản lý yêu cầu liên hệ trong Admin. |
| `src/services/showroom.service.ts` | CRUD showroom công khai và quản trị. |
| `src/services/site-settings.service.ts` | Lấy/cập nhật thông tin website, giờ làm việc, liên hệ, VAT và maintenance. |
| `src/services/maintenance-mode.service.ts` | Đồng bộ trạng thái bảo trì dùng chung với backend. |
| `src/services/trellis.service.ts` | API tạo/poll/lưu/hủy mô hình 3D TRELLIS cùng các preset chất lượng. |
| `src/services/helpdesk.service.ts` | CRUD ticket Helpdesk, tin nhắn, ghi chú nội bộ, agent/notification và các type Helpdesk. |
| `src/services/helpdesk-realtime.service.ts` | Subscribe sự kiện realtime Helpdesk qua Server-Sent Events. |
| `src/services/admin-workspace.service.ts` | Lấy/thay toàn bộ dữ liệu workspace Admin demo/quản trị. |
| `src/services/admin-access.service.ts` | CRUD user, role, quyền và reset mật khẩu cho Admin. |
| `src/services/admin-customer.service.ts` | Lấy và cập nhật khách hàng được quản trị. |
| `src/services/admin-profile.service.ts` | Đọc/sửa hồ sơ cá nhân Admin và đổi mật khẩu. |
| `src/services/admin.service.ts` | Các tiện ích Admin hạ tầng: chọn data mode, upload ảnh và endpoint dùng chung. |

## View — layout và component tái sử dụng

### Khung ứng dụng

| File | Chức năng |
| --- | --- |
| `src/views/layouts/BoCucUngDung.tsx` | Layout website công khai: header, footer, toast, action nổi và vùng render route. |
| `src/views/components/layout/DauTrang.tsx` | Header desktop/mobile: hotline, ngôn ngữ, theme, menu, tài khoản và giỏ hàng. |
| `src/views/components/layout/ChanTrang.tsx` | Footer: liên hệ, navigation, mạng xã hội và thông tin doanh nghiệp. |

### Component dùng chung

| File | Chức năng |
| --- | --- |
| `src/views/components/common/CamKetDichVu.tsx` | Dải cam kết dịch vụ/bảo hành/giao hàng. |
| `src/views/components/common/ChonNgonNguDialog.tsx` | Dialog chào lần đầu để người dùng chọn ngôn ngữ. |
| `src/views/components/common/DanhMucNhanh.tsx` | Ô shortcut danh mục có icon và link. |
| `src/views/components/common/FloatingActions.tsx` | Nút Zalo/liên hệ và cuộn lên đầu trang. |
| `src/views/components/common/KhunTranThai.tsx` | Panel trạng thái/trống/lỗi dùng lại cho nhiều Page. |
| `src/views/components/common/KhungDauTrang.tsx` | Khung hero/đầu trang tái sử dụng. |
| `src/views/components/common/KhungXuong.tsx` | Skeleton cơ bản và skeleton trang tải dữ liệu. |
| `src/views/components/common/PullToRefresh.tsx` | Tương tác kéo để tải lại trên mobile. |
| `src/views/components/common/Seo.tsx` | Cập nhật title, meta, canonical, Open Graph và JSON-LD. |
| `src/views/components/common/SiteSeo.tsx` | Chọn SEO phù hợp theo route, ngôn ngữ và site settings. |
| `src/views/components/common/TheDuAn.tsx` | Card dự án dùng ở danh sách/trang chủ. |
| `src/views/components/common/TieuDeMuc.tsx` | Heading section có tiêu đề, mô tả và action. |
| `src/views/components/common/TrangGioiThieu.tsx` | Khối intro trang đơn giản gồm title/description. |
| `src/views/components/common/TrangThaiPhienDangNhap.tsx` | Trạng thái skeleton/đang khôi phục phiên đăng nhập. |

### Giỏ hàng, thanh toán và sản phẩm

| File | Chức năng |
| --- | --- |
| `src/views/components/cart/DonHangTomTat.tsx` | Tóm tắt sản phẩm, số lượng, phí và tổng tiền trước thanh toán. |
| `src/views/components/cart/ThongBaoGioHang.tsx` | Toast xác nhận khi một sản phẩm được thêm vào giỏ. |
| `src/views/components/payment/PaymentQrDialog.tsx` | Dialog QR thanh toán và đồng hồ đếm hạn giao dịch. |
| `src/views/components/product/BoLocSanPham.tsx` | UI lọc catalogue theo danh mục, thương hiệu, giá và trạng thái. |
| `src/views/components/product/CatalogSortDropdown.tsx` | Dropdown sắp xếp sản phẩm. |
| `src/views/components/product/TheSanPham.tsx` | Card sản phẩm catalogue/featured với ảnh, giá và action. |
| `src/views/components/product/TheSanPhamLienQuan.tsx` | Card compact cho phần sản phẩm liên quan. |
| `src/views/components/product/ThuVienAnhSanPham.tsx` | Gallery ảnh, thumbnail và thao tác chọn ảnh sản phẩm. |
| `src/views/components/product/ProductModelViewer.tsx` | Bọc `<model-viewer>` để xem GLB/AR an toàn trong React. |
| `src/views/components/product/model-viewer-config.ts` | Giới hạn camera/zoom dùng chung cho trải nghiệm model 3D. |

## View — Page công khai

| File | Chức năng |
| --- | --- |
| `src/views/pages/TrangChu.tsx` | Trang chủ: hero, nhóm sản phẩm, dự án, tin và CTA. |
| `src/views/pages/TrangSanPham.tsx` | Catalogue: dùng controller sản phẩm, lọc, sort, phân trang và responsive mobile. |
| `src/views/pages/TrangChiTietSanPham.tsx` | Chi tiết sản phẩm: gallery, giá, tồn kho, mô tả, sản phẩm liên quan và thêm giỏ. |
| `src/views/pages/TrangTraiNghiem3D.tsx` | Màn trải nghiệm 3D/AR, điều khiển model và bottom sheet mobile. |
| `src/views/pages/TrangGioHang.tsx` | Xem/sửa giỏ hàng và chuyển sang checkout. |
| `src/views/pages/TrangThanhToan.tsx` | Checkout: thông tin người mua, địa chỉ, phương thức thanh toán, tạo đơn và QR. |
| `src/views/pages/TrangThanhToan.helpers.ts` | Chuyển lỗi payment/API thành thông báo thanh toán dễ hiểu. |
| `src/views/pages/TrangTaiKhoan.tsx` | Trang hồ sơ khách: trạng thái auth, profile, địa chỉ và lịch sử đơn. |
| `src/views/pages/TrangDangNhap.tsx` | Trang Google Sign-In của khách hàng và trạng thái phục hồi phiên. |
| `src/views/pages/TrangDuAn.tsx` | Danh sách/ lọc dự án, lấy dữ liệu qua project controller. |
| `src/views/pages/TrangChiTietDuAn.tsx` | Chi tiết một dự án theo slug, gallery và nội dung song ngữ. |
| `src/views/pages/TrangTinTucSuKien.tsx` | Danh sách tin tức, category/tag, loading và fallback. |
| `src/views/pages/TrangChiTietTinTuc.tsx` | Chi tiết bài tin theo slug, blocks nội dung, SEO và bài liên quan. |
| `src/views/pages/TrangLienHe.tsx` | Form liên hệ, lịch showroom và gửi inquiry. |
| `src/views/pages/TrangHeThongTrungBay.tsx` | Hiển thị hệ thống showroom/không gian trưng bày. |
| `src/views/pages/TrangDichVu.tsx` | Trang giới thiệu dịch vụ của CMID. |
| `src/views/pages/TrangGiaiPhap.tsx` | Trang giải pháp theo nhu cầu/dự án. |
| `src/views/pages/TrangVeCmid.tsx` | Trang giới thiệu thương hiệu CMID. |
| `src/views/pages/TrangBaoTri.tsx` | Trang hiển thị khi website đang maintenance. |
| `src/views/pages/TrangKhongTimThay.tsx` | Trang 404 khi URL không khớp route. |

## View — Admin

| File | Chức năng |
| --- | --- |
| `src/views/pages/admin/TrangQuanTri.tsx` | Page điều phối Admin chính: kiểm tra quyền, đồng bộ workspace, đọc URL/filter và chọn màn hình con. |
| `src/views/pages/admin/BoCucQuanTri.tsx` | Khung Admin: sidebar, topbar, notification Helpdesk, responsive và animation chuyển màn. |
| `src/views/pages/admin/DieuHuongQuanTri.tsx` | Danh sách menu Admin, type `AdminView`, metadata mô tả và hàm kiểm tra view hợp lệ. |
| `src/views/pages/admin/TrangDangNhapQuanTri.tsx` | Form đăng nhập Admin bằng username/password. |
| `src/views/pages/admin/GiaoDienThuongMaiQuanTri.tsx` | Các View thương mại Admin: dashboard, danh sách sản phẩm, đơn hàng, báo cáo và chi tiết đơn. |
| `src/views/pages/admin/GiaoDienNoiDungQuanTri.tsx` | Các View biên tập tin tức và dự án: tìm kiếm, lọc, editor và trạng thái publish/featured. |
| `src/views/pages/admin/GiaoDienVanHanhQuanTri.tsx` | Các View vận hành: danh mục, thương hiệu, kho, showroom, inquiry và cấu hình. |
| `src/views/pages/admin/GiaoDienHoTroQuanTri.tsx` | Màn Helpdesk: danh sách ticket, lọc, realtime và mở chi tiết ticket. |
| `src/views/pages/admin/ChiTietHelpdeskQuanTri.tsx` | Chi tiết ticket: hội thoại, internal note, SLA, attachment, assignee và hành động xử lý. |
| `src/views/pages/admin/HelpdeskBoardQuanTri.tsx` | Kanban/list Helpdesk, card ticket, đổi priority/stage. |
| `src/views/pages/admin/helpdesk-utils.ts` | Label, màu, thời gian tương đối và formatter riêng cho Helpdesk. |
| `src/views/pages/admin/TrinhSuaSanPhamQuanTri.tsx` | Editor tạo/sửa sản phẩm: thông tin, giá, kho, mô tả, ảnh và model 3D. |
| `src/views/pages/admin/HinhAnhSanPhamQuanTri.ts` | Chuẩn hóa slot ảnh trước/trái/phải/sau/ảnh thêm và chuyển slot sang `ProductImage`. |
| `src/views/pages/admin/TaiAnhLenQuanTri.tsx` | UI upload ảnh Admin, hiển thị progress/lỗi/xóa ảnh. |
| `src/views/pages/admin/MoHinhTrellisQuanTri.tsx` | UI tạo/poll/lưu/hủy model 3D TRELLIS cho sản phẩm. |
| `src/views/pages/admin/ThanhPhanCoBanQuanTri.tsx` | Primitive UI Admin: panel, heading, modal, select, status, skeleton, pagination và confirm dialog. |
| `src/views/pages/admin/DropdownQuanTri.tsx` | Dropdown select có type generic dùng trong Admin. |
| `src/views/pages/admin/HoSoNhanVienQuanTri.tsx` | Màn hồ sơ nhân viên Admin và đổi mật khẩu cá nhân. |
| `src/views/pages/admin/NgonNguQuanTri.tsx` | Provider ngôn ngữ cục bộ cho phần Admin. |
| `src/views/pages/admin/NguCanhNgonNguQuanTri.ts` | Context/hook lấy bản dịch ngôn ngữ Admin. |
| `src/views/pages/admin/ThongBaoLoiQuanTri.ts` | Chuyển validation/API error kỹ thuật thành câu lỗi Việt/Anh thân thiện. |
| `src/views/pages/admin/PhanQuyenQuanTri.ts` | Kiểm tra permission và quyết định user có được vào `AdminView` hay không. |
| `src/views/pages/admin/XacThucQuanTri.ts` | Map session server thành Admin session UI, kiểm tra user Admin và tên role. |
| `src/views/pages/admin/XacThucMauQuanTri.ts` | Cờ bật/tắt demo access cho thao tác Admin. |
| `src/views/pages/admin/CoSoDuLieuQuanTri.ts` | Seed/cache workspace Admin phía client, đồng bộ persistence và helper mutate dữ liệu. Type domain thật nằm ở `models/admin-workspace.ts`. |

## View — utility và CSS

### Utility hiển thị

| File | Chức năng |
| --- | --- |
| `src/views/utils/catalogPagination.ts` | Quy tắc số sản phẩm/trang và danh sách nút phân trang có dấu `…`. |
| `src/views/utils/formatCurrency.ts` | Định dạng giá theo ngôn ngữ Việt/Anh. |
| `src/views/utils/localizeProduct.ts` | Chọn tên/mô tả/category/brand đúng ngôn ngữ để render sản phẩm. |
| `src/views/utils/seo.ts` | Chuẩn hóa site URL và tạo absolute URL cho SEO. |

### CSS

| File | Chức năng |
| --- | --- |
| `src/views/styles/index.css` | Entry CSS: import các stylesheet còn lại. |
| `src/views/styles/global.css` | Reset, font, token CSS và style nền tảng toàn site. |
| `src/views/styles/site-theme.css` | Biến màu dark/light và style chuyển theme. |
| `src/views/styles/layout.css` | Khung header/footer/container và layout dùng chung. |
| `src/views/styles/components.css` | Style cho component tái sử dụng. |
| `src/views/styles/dau-trang.css` | Style chi tiết header/menu desktop-mobile. |
| `src/views/styles/responsive.css` | Breakpoint và điều chỉnh responsive dùng chung. |
| `src/views/styles/mobile-catalog.css` | Tinh chỉnh catalogue chỉ dành cho mobile. |
| `src/views/styles/hero-actions.css` | CTA/hero action dùng lại trên các trang. |
| `src/views/styles/news-editorial.css` | Typography/bố cục kiểu editorial của trang tin. |
| `src/views/styles/screenshot-button-restore.css` | Style phục hồi cho nút/chi tiết phát sinh từ yêu cầu screenshot cũ. |
| `src/views/styles/trang-chu.css` | Style riêng trang chủ. |
| `src/views/styles/trang-san-pham.css` | Style catalogue/list sản phẩm. |
| `src/views/styles/trang-chi-tiet-san-pham.css` | Style chi tiết sản phẩm và gallery/3D. |
| `src/views/styles/trang-thuong-mai.css` | Style giỏ hàng, checkout và thanh toán. |
| `src/views/styles/trang-tai-khoan.css` | Style login, account và lịch sử đơn. |
| `src/views/styles/trang-du-an.css` | Style danh sách dự án. |
| `src/views/styles/trang-chi-tiet-du-an.css` | Style chi tiết dự án. |
| `src/views/styles/trang-tin-tuc.css` | Style danh sách/chi tiết tin tức. |
| `src/views/styles/trang-noi-dung.css` | Style khối nội dung dài/rich content. |
| `src/views/styles/trang-lien-he.css` | Style trang liên hệ và form. |
| `src/views/styles/trang-dich-vu.css` | Style trang dịch vụ. |
| `src/views/styles/trang-giai-phap.css` | Style trang giải pháp. |
| `src/views/styles/trang-gioi-thieu.css` | Style trang giới thiệu. |
| `src/views/styles/trang-ve-cmid.css` | Style riêng trang Về CMID. |
| `src/views/styles/trang-bao-tri.css` | Style trang maintenance. |
| `src/views/styles/admin-styles/trang-quan-tri.css` | Toàn bộ style riêng của workspace Admin: sidebar, toolbar, form, bảng, editor, Helpdesk và responsive quản trị. |

## Test — mỗi file đang bảo vệ điều gì

| File | Chức năng kiểm thử |
| --- | --- |
| `tests/admin-error-message.test.ts` | Dịch validation/API error Admin sang đúng Việt/Anh. |
| `tests/admin-login.test.tsx` | Form login Admin, đặc biệt thao tác hiện/ẩn mật khẩu. |
| `tests/admin-news-inline-controls.test.tsx` | Cập nhật featured/publication của bài tin không làm mất sort order/trạng thái. |
| `tests/admin-project-inline-controls.test.tsx` | Tương tự cho dự án Admin. |
| `tests/admin-product-delete.test.tsx` | Xác nhận xóa sản phẩm và skeleton trong lúc request xóa chờ. |
| `tests/admin-product-filters.test.tsx` | Giữ filter catalogue Admin khi mở rồi quay lại editor. |
| `tests/admin-product-media.test.tsx` | Ảnh sản phẩm, save API, fields kỹ thuật và luồng TRELLIS 3D. |
| `tests/admin-product-model-ownership.test.tsx` | Mỗi draft sản phẩm phải có namespace job 3D riêng. |
| `tests/admin-select.test.tsx` | Select Admin đóng khi click ngoài và scroll đến option đang chọn. |
| `tests/api-errors.test.ts` | Chuẩn hóa lỗi từ `apiFetch`. |
| `tests/catalog-pagination.test.ts` | Số item/trang và các nút phân trang. |
| `tests/customer-auth-bootstrap.test.tsx` | Trạng thái UI khi đang restore phiên khách hàng. |
| `tests/customer-orders.test.tsx` | Hiển thị/điều hướng đơn hàng của khách. |
| `tests/language-welcome-dialog.test.tsx` | Dialog chọn ngôn ngữ lần đầu. |
| `tests/mobile-product-filters.test.tsx` | Filter catalogue ở giao diện mobile. |
| `tests/news-service.test.ts` | Request/normalize dữ liệu service tin tức. |
| `tests/order-service.test.ts` | Request/normalize dữ liệu service đơn hàng. |
| `tests/product-3d-experience.test.tsx` | Trải nghiệm 3D/AR, bottom sheet và responsive mobile. |
| `tests/product-relations.test.ts` | Quy tắc tìm sản phẩm liên quan. |
| `tests/project-service.test.ts` | Request/normalize dữ liệu service dự án. |
| `tests/trellis-service.test.ts` | API TRELLIS tạo/poll/lưu/hủy model 3D. |
| `tests/tsconfig.json` | Project TypeScript riêng cho test; giúp VS Code và `test:typecheck` bắt lỗi props/type trong test. |

## File cấu hình quan trọng

| File | Chức năng |
| --- | --- |
| `package.json` | Script dự án: `dev`, `build`, `lint`, `test`, `test:typecheck`, `preview`. |
| `tsconfig.app.json` | TypeScript cho mã app trong `src/`. |
| `tests/tsconfig.json` | TypeScript cho test và `src/` mà test import. |
| `vite.config.ts` | Cấu hình Vite, React và môi trường test/dev. |
| `.env.example` | Mẫu các biến môi trường cần cho frontend. |

## Khi cần sửa một chức năng

1. Đọc type trong `models/` trước để biết dữ liệu chuẩn.
2. Tìm API trong `services/<feature>.service.ts`.
3. Nếu có state/loading/retry dùng lại được, đặt hoặc tìm hook ở `controllers/`.
4. Chỉ sau đó sửa Page/component ở `views/` và CSS tương ứng.
5. Cập nhật test cùng feature, chạy:

```bash
npm run test:typecheck
npm test
npm run build
```
