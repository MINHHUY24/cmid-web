# Tiến độ xử lý dự án CMID

_Cập nhật gần nhất: 03/09/2026_

## Trạng thái hiện tại

Dự án đã được rà soát ở mức source code, API cục bộ và build/test. Ngày 03/09/2026 đã bổ sung luồng kỹ thuật MoMo (chưa deploy): UI chọn Ví MoMo/thẻ qua MoMo, API tạo phiên thanh toán, IPN xác thực chữ ký, schema đơn hàng/giao dịch và migration Prisma. Chưa thể thanh toán sandbox/production cho đến khi cấu hình tài khoản merchant và áp dụng migration.

## Việc đã thực hiện

1. Xác định lệnh chạy backend: `npm run start:dev` (script `dev:api` không tồn tại).
2. Rà soát frontend, backend, schema Prisma, seed data và các tài liệu nội bộ.
3. Đối chiếu với 4 yêu cầu lõi đọc được từ đề án: website kinh doanh nội thất/vật liệu, báo giá, đơn hàng và trải nghiệm 3D.
4. Kiểm tra kỹ thuật:
   - Frontend: `npm run build` và `npx eslint .` đạt.
   - Backend: `npm run build` đạt.
   - API `GET /api/products` trả HTTP 200 với 8 sản phẩm.
   - API chi tiết `GET /api/products/1` chưa có (HTTP 404).
   - Unit/E2E backend đang lỗi do môi trường Jest không có `DATABASE_URL`; chưa có test nghiệp vụ cho báo giá, đơn hàng, auth hoặc 3D.
5. Lập báo cáo hiện trạng Word: `Bao_cao_danh_gia_hien_trang_website_CMID_2026-09-02.docx`.
6. Bổ sung nền tảng thanh toán MoMo:
   - Checkout có lựa chọn **Ví MoMo / QR** và **Thanh toán bằng thẻ qua MoMo**; thông tin thẻ được nhập tại cổng MoMo, không tại CMID.
   - Backend có `POST /api/payments/momo`, `POST /api/payments/momo/ipn` và `GET /api/payments/momo/:orderId`.
   - Thêm các bảng `orders`, `order_items`, `payment_transactions` cùng migration `20260903110000_add_momo_payments`.
   - Xác minh `prisma validate`, build frontend/backend và lint các tệp thay đổi đều đạt.
   - Checkout phân tách hiển thị **VNPAY-QR**, **Ví MoMo**, COD và **thanh toán bằng thẻ**; không còn gắn thẻ hoặc VNPAY-QR vào MoMo.
   - Có `VITE_PAYMENT_MODE=mock` chỉ cho local development: mô phỏng thanh toán VNPAY-QR/MoMo/thẻ thành công hoặc thất bại, không kết nối cổng thanh toán và không dùng tiền thật.

## Kết luận nghiệp vụ

Website có UI/catalogue, giỏ hàng, checkout, nội dung, SEO cơ bản và admin demo. Tuy nhiên chưa thể nghiệm thu ở mức vận hành thật vì:

- Form liên hệ/báo giá chỉ hiển thị thành công, không lưu/gửi API.
- Đơn hàng/thanh toán: đã có API và schema cho riêng luồng MoMo, nhưng chưa áp dụng migration, cấu hình merchant, auth backend hay đồng bộ vào admin thật. Các phương thức chuyển khoản/COD vẫn là luồng demo `localStorage`.
- 3D mới có metadata/badge/poster; không có viewer hoặc tài sản GLB thực.
- Admin dùng tài khoản/mật khẩu demo hard-code; chưa có auth backend, JWT/session hoặc phân quyền thật.

## Kế hoạch triển khai đề xuất

| Giai đoạn | Nội dung | Trạng thái | Kết quả cần có |
| --- | --- | --- | --- |
| 0. Chốt phạm vi | Bổ sung SRS, use case, tiêu chí nghiệm thu và quyết định cổng thanh toán/nguồn file 3D. | Chưa bắt đầu | Backlog và acceptance criteria được duyệt. |
| 1. Nền tảng bảo mật & dữ liệu | Auth backend, JWT/refresh token, RBAC, models Order/Quote/Payment/Address, migration và validation. | Đang thực hiện một phần | Đã có schema Order/Payment và migration cho MoMo; còn auth, RBAC, Address/Quote và deploy migration. |
| 2. Báo giá | Form báo giá có prefill sản phẩm, lưu QuoteRequest/QuoteItem, workflow trạng thái và thông báo. | Chưa bắt đầu | Sales tiếp nhận/xử lý báo giá từ dữ liệu dùng chung. |
| 3. Đơn hàng & thanh toán | Cart/checkout gọi API, quản lý trạng thái/tồn kho/lịch sử đơn; tích hợp payment callback theo phương án đã chọn. | Đang thực hiện một phần | MoMo create/IPN/status đã có code; cần cấu hình sandbox, áp dụng migration, test E2E, lịch sử đơn và đồng bộ admin. |
| 4. Trải nghiệm 3D | Upload/host GLB, viewer 3D, xoay/zoom, fallback poster và kiểm tra mobile. | Chưa bắt đầu | Người dùng tương tác được với mô hình 3D thật. |
| 5. Đồng bộ admin/public | CRUD backend cho catalogue/CMS/showroom/banner; public site đọc từ API. | Chưa bắt đầu | Dữ liệu admin phản ánh ra website công khai. |
| 6. QA & release | Unit/integration/E2E, test env, Swagger, security/rate limit, tối ưu bundle/ảnh, CI/CD. | Chưa bắt đầu | Các luồng cốt lõi pass trước release. |

## Việc nên làm ngay tiếp theo

1. Tạo tài khoản merchant MoMo sandbox, điền biến trong `apps/backend/.env`, dùng URL HTTPS công khai cho `MOMO_IPN_URL`, rồi áp dụng `npx prisma migrate deploy` tại backend.
2. Test MoMo end-to-end với tài khoản test; chỉ xác nhận đơn sau IPN có chữ ký hợp lệ. Không đưa `MOMO_SECRET_KEY` vào frontend.
3. Triển khai auth/RBAC backend trước khi hỗ trợ lưu thẻ bằng tokenization hoặc lịch sử thanh toán theo tài khoản; không lưu số thẻ/CVV.
4. Kết nối đơn hàng server-side với admin, báo giá và các phương thức chuyển khoản/COD còn đang demo.
