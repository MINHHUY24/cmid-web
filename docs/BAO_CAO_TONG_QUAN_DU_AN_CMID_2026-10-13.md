# Báo cáo tổng quan dự án CMID

**Ngày lập:** 13/10/2026  
**Phạm vi:** ứng dụng frontend tại `apps/frontend`  
**Trạng thái đánh giá:** mã nguồn hiện tại trong working tree, bao gồm các thay đổi chưa commit.

## 1. Tóm tắt điều hành

CMID là website thương mại/nội dung cho lĩnh vực vật liệu xây dựng và nội thất. Ứng dụng bao gồm website công khai, catalogue sản phẩm, trải nghiệm mô hình 3D/AR, giỏ hàng, thanh toán MoMo, tài khoản khách hàng, tin tức, dự án, showroom và một khu vực quản trị khá đầy đủ.

Frontend được xây dựng bằng React + TypeScript + Vite. Kiến trúc đã được tổ chức lại theo MVC phù hợp với React: View chịu trách nhiệm render, Controller là custom hook/Provider điều phối state, Service là cổng giao tiếp API và Model chứa kiểu dữ liệu/quy tắc nghiệp vụ. Hướng này phù hợp, dễ lần theo luồng dữ liệu và dễ bàn giao cho lập trình viên khác.

Kết quả kiểm tra gần nhất:

- `npm run test:typecheck`: đạt.
- `npm test -- --run`: **22 file test, 72 test đều đạt**.
- `npm run build`: đạt; Vite chỉ cảnh báo một số bundle lớn hơn 500 kB sau minify.
- `git diff --check`: không có lỗi khoảng trắng/định dạng diff.

## 2. Công nghệ và cách chạy

| Hạng mục | Công nghệ / trạng thái |
| --- | --- |
| Framework | React 19 + React DOM 19 |
| Ngôn ngữ | TypeScript 6 |
| Build/dev server | Vite 8 |
| Điều hướng | React Router 7 |
| Kiểm thử | Vitest 5 + Testing Library + JSDOM |
| Icon | Phosphor Icons và Lucide React |
| Bảng dữ liệu/xuất file | ExcelJS |
| Mô hình 3D | `@google/model-viewer`, luồng TRELLIS riêng |
| Ngôn ngữ | Việt/Anh qua `LanguageProvider` và Model content |
| Triển khai | Vercel, SPA rewrite và redirect URL cũ trong `vercel.json` |

Lệnh làm việc chính:

```bash
npm run dev             # Chạy Vite ở local
npm run test:typecheck  # Kiểm tra TypeScript của test
npm test                # Chạy test
npm run build           # Type-check app và build production
npm run preview         # Xem bản build local
```

## 3. Kiến trúc hiện tại

```text
Người dùng
  -> Route
  -> View (pages, components, layouts, CSS)
  -> Controller (custom hooks, Provider, hành động UI)
  -> Service (HTTP/API gateway)
  -> Backend API

Model (type, hằng số, dữ liệu chuẩn, phép tính)
  <- Service / Controller / View
```

| Lớp | Thư mục | Trách nhiệm |
| --- | --- | --- |
| Bootstrap | `src/main.tsx`, `src/UngDung.tsx` | Nạp font/CSS, theme, Provider toàn cục và Router. |
| Model | `src/models/` | Domain type sản phẩm, đơn, Admin, nội dung song ngữ, phép tính giá và asset tĩnh. |
| Controller | `src/controllers/` | Tải dữ liệu, loading/error/retry, theme, auth, cart, language và site settings. |
| Service | `src/services/` | HTTP client, auth token, endpoint sản phẩm/đơn/tin/dự án/Helpdesk/TRELLIS. |
| View | `src/views/` | Layout, component, Page, Admin Page, helper trình bày và stylesheet. |
| Route | `src/routes/` | Ánh xạ URL đến Page, lazy-load khu vực Admin, maintenance và fallback. |
| Kiểu ngoài | `src/@types/` | Khai báo TypeScript cho web component `model-viewer`. |

Lưu ý: MVC trong React không dùng class controller kiểu backend. Controller được triển khai bằng custom hook và Provider để vẫn đúng vòng đời React. Tài liệu chi tiết: [KIEN_TRUC_FRONTEND_MVC.md](./KIEN_TRUC_FRONTEND_MVC.md).

## 4. Chức năng đã có

### Website công khai

- Trang chủ: hero, nhóm sản phẩm, dự án nổi bật, tin tức và CTA.
- Catalogue: tìm kiếm/lọc/sắp xếp/phân trang, tối ưu riêng cho mobile.
- Chi tiết sản phẩm: gallery, thông số, mô tả, tồn kho, giá, sản phẩm liên quan và thêm giỏ.
- Trải nghiệm 3D/AR bằng `<model-viewer>`, gồm điều khiển camera và hỗ trợ mobile.
- Giỏ hàng: thêm/xoá/cập nhật số lượng, tổng tiền/VAT, localStorage và toast xác nhận.
- Checkout: dữ liệu người mua/địa chỉ, tạo đơn, MoMo QR/deeplink và theo dõi trạng thái thanh toán.
- Tài khoản khách: Google Sign-In, refresh session, cập nhật profile, lịch sử đơn hàng và cache local có cơ chế đồng bộ lại server.
- Tin tức và dự án: danh sách, chi tiết theo slug, bản địa hoá, SEO, gallery và bài/dự án liên quan.
- Liên hệ và showroom: gửi inquiry, đặt lịch/hiển thị showroom, thông tin liên hệ.
- Song ngữ Việt/Anh, light/dark theme, responsive, Zalo action, SEO meta/canonical/Open Graph/JSON-LD.
- Maintenance page và 404 page.

### Khu vực quản trị

- Login Admin và session riêng với khách hàng.
- Dashboard, quản lý sản phẩm, ảnh/model 3D, danh mục, thương hiệu, vật liệu và nhà cung cấp.
- Quản lý đơn hàng, thanh toán, hoàn tiền, khách hàng, nhóm khách và ưu đãi.
- Biên tập tin tức, dự án, banner, showroom, liên hệ/báo giá và cấu hình website.
- Quản lý user, role/permission, activity log, profile nhân viên và đổi mật khẩu.
- Helpdesk: ticket, hội thoại, ghi chú nội bộ, SLA, phân công, thông báo và SSE realtime.
- Workspace demo/cache phía client; API Admin thực có thể bật qua cấu hình môi trường.

## 5. Dữ liệu, API và xác thực

### HTTP và session

`src/services/api.ts` là HTTP client duy nhất cho API. Nó ghép `VITE_API_URL`, thêm header JSON/token, dùng cookie HttpOnly, chuẩn hoá `ApiError`, tự refresh access token một lần khi gặp HTTP 401 rồi gửi lại request gốc.

Hai vùng token được tách riêng:

- `customer`: phiên khách hàng.
- `admin`: phiên quản trị.

`auth-tab.ts` tạo ID theo `sessionStorage` để backend có thể phân biệt cookie phiên theo từng tab. ID này không phải credential.

### Biến môi trường

| Biến | Vai trò |
| --- | --- |
| `VITE_API_URL` | URL API backend, bắt buộc khi gọi server. |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth Web Client ID. |
| `VITE_TRELLIS_API_URL` | URL bridge TRELLIS khi deploy; local dùng proxy Vite. |
| `VITE_ADMIN_API_ENABLED` | Bật dữ liệu/API quản trị thật thay vì demo. |
| `VITE_ADMIN_DEMO_ENABLED` | Chế độ review demo Admin; phải tắt khi vận hành thật. |
| `VITE_PAYMENT_MODE` | `mock` chỉ dành cho local review, không dùng để thu tiền thật. |
| `VITE_ZALO_URL`, `VITE_ZALO_PHONE` | Liên kết/thông tin liên hệ Zalo công khai. |

File `.env.example` có sẵn mẫu cấu hình. Không đưa thông tin bí mật vào biến có tiền tố `VITE_`, vì chúng được đóng gói vào frontend.

## 6. Responsive, theme và chuyển động

- Theme sáng/tối được lưu trong localStorage; `applyPreferredColorTheme()` chạy trước React để hạn chế chớp giao diện.
- `meta[name="theme-color"]` được đồng bộ để Chrome/Safari mobile đổi màu browser chrome theo theme.
- Header/footer/menu có breakpoint desktop-mobile riêng.
- Card dự án/tin có scroll reveal bằng `IntersectionObserver`; animation chỉ chạy khi người dùng không bật `prefers-reduced-motion`.
- Cấu hình reveal hiện tại: dịch nhẹ 16px, opacity thấp ban đầu, thời lượng 560ms và stagger ngắn để không xuất hiện đột ngột.
- Timeline “Quá trình phát triển” đã được canh đường line theo tâm marker.

## 7. Chất lượng mã nguồn và kiểm thử

### Phạm vi test hiện có

22 file test đang bao phủ các nhóm sau:

- Authentication khách/Admin và bootstrap phiên.
- Lỗi API, service đơn hàng/tin tức/dự án/TRELLIS.
- Catalogue: filter, pagination và giao diện mobile.
- Sản phẩm: 3D, media, model ownership và quan hệ sản phẩm.
- Các thao tác inline ở Admin: login, news, project, product delete/filter/media.
- Scroll reveal và dialog chọn ngôn ngữ.

### Tài liệu hoá mã nguồn

- `docs/GHI_CHU_TUNG_FILE_FRONTEND.md`: bản đồ file và trách nhiệm từng phần.
- `docs/KIEN_TRUC_FRONTEND_MVC.md`: quy tắc kiến trúc MVC và mẫu thêm tính năng.
- Nhiều Controller, Model, Service, Page public và stylesheet dùng chung đã có comment `/* ... */` tiếng Việt theo nhóm import, type, state, effect, API, JSX và CSS.

Nguyên tắc comment: giải thích **ý định và luồng xử lý** theo khối logic; không comment lặp lại từng dòng cú pháp đơn giản vì điều đó làm source khó đọc và khó bảo trì.

## 8. Tình trạng working tree

Tại thời điểm lập báo cáo, repository có **256 thay đổi chưa commit** (bao gồm đổi tên do tái cấu trúc MVC, file mới và file chỉnh sửa). Vì vậy đây chưa phải trạng thái sạch để phát hành/đánh tag.

Các thay đổi lớn đang hiện diện:

- Di chuyển code cũ `contexts`, `hooks`, `content`, `constants`, `utils` sang `controllers`, `models`, `views` theo MVC.
- Cập nhật toàn bộ import liên quan và thêm khai báo type `model-viewer`.
- Bổ sung animation reveal, điều chỉnh timeline và giao diện theme mobile.
- Bổ sung/chỉnh sửa comment tài liệu tiếng Việt.
- Cập nhật test tương ứng với đường dẫn MVC mới.

Khuyến nghị: review theo từng nhóm thay đổi, chạy đủ test/build rồi chia thành các commit nhỏ theo chủ đề thay vì commit tất cả một lần.

## 9. Rủi ro và việc cần ưu tiên

| Mức độ | Hạng mục | Khuyến nghị |
| --- | --- | --- |
| Cao trước production | Admin demo | Tắt `VITE_ADMIN_DEMO_ENABLED`, không dùng credential demo trong README và bắt buộc backend phân quyền thật. |
| Cao trước production | Thanh toán | Tắt `VITE_PAYMENT_MODE=mock`; xác thực giao dịch từ webhook backend, không xác nhận đơn chỉ bằng timer/redirect frontend. |
| Cao trước production | Biến môi trường | Cấu hình `VITE_API_URL`, Google OAuth origin/redirect, Zalo chính thức và kiểm tra không có secret ở `VITE_*`. |
| Trung bình | Bundle lớn | Build cảnh báo một số chunk >500 kB, đặc biệt model-viewer/ExcelJS/assets ảnh. Lazy-load 3D/Admin/ExcelJS và tối ưu ảnh để giảm tải lần đầu. |
| Trung bình | MVC migration | Một số Page lớn vẫn có state/form handler. Khi sửa Page, tách logic mới sang Controller cùng pull request; không đưa thêm HTTP trực tiếp vào View. |
| Trung bình | Test UI | Bổ sung E2E cho login thật, checkout thật, route mobile Safari, theme browser chrome, phân quyền Admin và SSE Helpdesk. |
| Thấp | README | Cập nhật README theo kiến trúc mới vì vẫn còn nội dung mẫu Vite và đường dẫn cũ `src/content`. |

## 10. Kế hoạch đề xuất

1. Hoàn tất review và commit riêng phần tái cấu trúc MVC.
2. Chia bundle: lazy-load model viewer, ExcelJS và các Page Admin nặng; chuyển ảnh hero lớn sang kích thước/định dạng tối ưu hơn.
3. Hoàn thiện backend production cho Admin, upload, payment webhook và phân quyền server-side.
4. Thiết lập CI chạy `npm run test:typecheck`, `npm test`, `npm run build` cho mỗi pull request.
5. Bổ sung Playwright hoặc công cụ E2E tương đương cho luồng thương mại quan trọng.
6. Cập nhật README, tài liệu môi trường và checklist deploy/Vercel.

## 11. Kết luận

Dự án đã có phạm vi tính năng lớn và cấu trúc frontend rõ ràng hơn sau khi chuyển sang MVC. Các luồng công khai, thương mại, tài khoản, 3D và Admin đã tách được Model/Controller/View/Service ở mức phù hợp với React. Kiểm thử unit/integration hiện có đang xanh.

Điểm cần tập trung trước khi đưa vào vận hành thật là loại bỏ chế độ demo/mock, hoàn thiện backend và payment webhook, giảm bundle/ảnh lớn, kiểm thử E2E trên mobile, rồi chốt working tree thành các commit nhỏ có thể review.
