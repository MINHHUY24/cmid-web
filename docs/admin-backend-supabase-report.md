# Báo cáo hiện trạng Admin Backend & Supabase

Ngày kiểm tra: 14/08/2026  
Phạm vi: `apps/backend`, cấu hình kết nối database, Prisma schema/migrations, API, xác thực, CORS và Supabase Storage.

> Đây là báo cáo kiểm tra ở chế độ chỉ đọc. Không có file backend, migration, dữ liệu database, quyền Supabase hay bucket Storage nào được thay đổi trong quá trình kiểm tra.

## 1. Kết luận nhanh

- Backend hiện dùng NestJS, Prisma 7 và PostgreSQL trên Supabase.
- Kết nối database đang hoạt động; migration hiện có đã được áp dụng đầy đủ.
- Backend mới chỉ cung cấp API đọc danh sách sản phẩm.
- Trang admin hiện lưu dữ liệu bổ sung trong `localStorage`, chưa ghi xuống backend hoặc Supabase.
- Chưa có đăng nhập quản trị thật, JWT/session, phân quyền, CRUD, đơn hàng, khách hàng, CMS hay upload file.
- Supabase Storage chưa có bucket và chưa có object.
- Rủi ro cần xử lý trước tiên: các bảng ứng dụng trong schema `public` chưa bật RLS nhưng role `anon` và `authenticated` đang có quyền bảng rất rộng.

## 2. Hiện trạng đã xác minh

### 2.1. Kết nối Supabase PostgreSQL

Hai biến kết nối database backend đều đã được cấu hình và trỏ tới Supabase:

- Kết nối runtime dùng transaction pooler ở cổng `6543`.
- Kết nối migration dùng session pooler ở cổng `5432`.
- Prisma migration báo database schema đang đồng bộ với migration trong repository.

Không có connection string, mật khẩu database, project reference hoặc secret nào được ghi vào tài liệu này.

### 2.2. Dữ liệu hiện có

Kết quả đếm trực tiếp từ database tại thời điểm kiểm tra:

| Nhóm dữ liệu | Số lượng |
| --- | ---: |
| Người dùng ứng dụng (`public.users`) | 0 |
| Người dùng Supabase Auth (`auth.users`) | 0 |
| Danh mục | 7 |
| Thương hiệu | 5 |
| Sản phẩm | 8 |
| Ảnh sản phẩm | 8 |
| Mô hình 3D | 4 |
| Bucket Supabase Storage | 0 |
| Object Supabase Storage | 0 |

### 2.3. Prisma schema hiện tại

Các model đang tồn tại:

- `User`
- `Category`
- `Brand`
- `Product`
- `ProductImage`
- `Product3DModel`

Các enum đang tồn tại:

- `UserRole`: `CUSTOMER`, `SALES`, `CONTENT_ADMIN`, `SUPER_ADMIN`
- `SaleType`: `DIRECT_ORDER`, `REQUEST_QUOTE`
- `ProductStatus`: `ACTIVE`, `INACTIVE`, `DRAFT`

### 2.4. API hiện tại

Backend chỉ có hai route đọc:

| Method | Route | Hiện trạng |
| --- | --- | --- |
| `GET` | `/api` | Route mẫu trả chuỗi kiểm tra |
| `GET` | `/api/products` | Trả toàn bộ sản phẩm kèm danh mục, thương hiệu, ảnh và model 3D |

Các điểm còn thiếu hoặc chưa đúng:

- Không có `GET /api/products/:id`, trong khi frontend đã khai báo sử dụng route này.
- API sản phẩm công khai chưa lọc `status = ACTIVE`; bản nháp hoặc sản phẩm ẩn vẫn có thể bị trả về.
- Không có phân trang, tìm kiếm, lọc hay sắp xếp tại backend.
- Không có DTO và validation đầu vào.
- Không có CRUD sản phẩm, danh mục hoặc thương hiệu.
- Không có API dành riêng cho admin.

### 2.5. Admin frontend hiện tại

Sản phẩm, tin tức và dự án tạo trong admin hiện được lưu bằng `localStorage` của trình duyệt. Điều này có nghĩa:

- Dữ liệu chỉ tồn tại trên đúng trình duyệt/máy đang sử dụng.
- Đổi trình duyệt hoặc xóa dữ liệu website sẽ mất nội dung đã nhập.
- Nhân viên khác không nhìn thấy thay đổi.
- Không có lịch sử chỉnh sửa hoặc người thực hiện.
- Dữ liệu không được đồng bộ xuống Supabase.

### 2.6. Ảnh và mô hình 3D

- Ảnh seed hiện trỏ tới các file SVG tĩnh trong frontend.
- Database có bốn URL GLB mẫu nhưng repository không có các file GLB tương ứng.
- Backend chưa có API multipart upload.
- Backend chưa cài Supabase client để dùng Storage API.
- Chưa có cơ chế thay ảnh, xóa object cũ hoặc dọn file không còn được tham chiếu.

### 2.7. CORS và cấu hình runtime

Backend hiện:

- Có prefix toàn cục `/api`.
- Cho phép các origin localhost trong môi trường phát triển.
- Hỗ trợ danh sách production origin qua `CORS_ORIGINS`.
- Bật `credentials: true`.

Tuy nhiên:

- Backend chưa có `.env.example` mô tả đầy đủ các biến cần thiết.
- Môi trường hiện tại chưa khai báo `CORS_ORIGINS`.
- Frontend API wrapper chưa gửi `credentials: 'include'`; điều này phải bổ sung nếu dùng refresh token bằng cookie.

## 3. Rủi ro bảo mật Supabase cần xử lý trước

Kết quả kiểm tra quyền trực tiếp cho thấy:

- RLS đang tắt trên toàn bộ bảng ứng dụng trong schema `public`.
- Schema `public` không có policy nào.
- Role `anon` và `authenticated` đang có quyền rất rộng trên:
  - `users`
  - `categories`
  - `brands`
  - `products`
  - `product_images`
  - `product_3d_models`
  - `_prisma_migrations`
- Các quyền hiện gồm cả đọc, tạo, cập nhật, xóa và một số quyền quản trị bảng khác.

Frontend hiện chưa cấu hình Supabase anon key nên ứng dụng hiện tại chưa gọi trực tiếp Data API. Tuy vậy, nếu sau này đưa anon key vào frontend mà không khóa quyền trước, dữ liệu có thể bị đọc hoặc chỉnh sửa ngoài NestJS.

### Phương án khuyến nghị: mọi thao tác ghi đi qua NestJS

1. Thu hồi toàn bộ quyền của `anon` và `authenticated` trên các bảng Prisma, sequence và `_prisma_migrations`.
2. Thiết lập default privileges để bảng/migration tạo trong tương lai không tự mở quyền lại.
3. Frontend chỉ gọi NestJS qua `VITE_API_URL`.
4. NestJS sử dụng database connection riêng và thực hiện kiểm tra JWT/role trước CRUD.
5. Chỉ mở Data API/RLS cho những bảng thật sự cần frontend đọc trực tiếp.

### Phương án thay thế: frontend đọc trực tiếp Supabase

Nếu có nhu cầu dùng Data API trực tiếp:

1. Bật RLS trên từng bảng công khai.
2. Chỉ tạo policy `SELECT` cho bản ghi được phép công khai, ví dụ sản phẩm `ACTIVE`.
3. Không cho `anon` thực hiện `INSERT`, `UPDATE` hoặc `DELETE` dữ liệu admin.
4. Ghi dữ liệu quản trị vẫn đi qua NestJS hoặc Supabase Auth có custom claims/role rõ ràng.
5. Không cho phép truy cập `_prisma_migrations` qua Data API.

## 4. Xác thực và phân quyền quản trị cần bổ sung

Schema đã có `passwordHash` và role, nhưng chưa có logic xác thực.

### Tài khoản thử nghiệm

Tài khoản giao diện demo có thể là:

- Email: `admincmid@gmail.com`
- Mật khẩu thử: `cmid12345@`

Khi đưa xuống backend:

- Chỉ seed tài khoản này trong development/test.
- Mật khẩu phải được hash bằng Argon2 hoặc bcrypt.
- Không lưu mật khẩu thô trong source code, localStorage hoặc log.
- Production phải thay mật khẩu và quản lý qua secret manager hoặc quy trình tạo tài khoản an toàn.

### Module và API xác thực

Các endpoint tối thiểu:

| Method | Endpoint | Chức năng |
| --- | --- | --- |
| `POST` | `/api/auth/admin/login` | Xác thực email/mật khẩu |
| `POST` | `/api/auth/refresh` | Cấp access token mới |
| `POST` | `/api/auth/logout` | Thu hồi phiên đăng nhập |
| `GET` | `/api/auth/me` | Lấy hồ sơ và quyền hiện tại |

Khuyến nghị kỹ thuật:

- Access token ngắn hạn.
- Refresh token lưu trong cookie `HttpOnly`, `Secure`, `SameSite` phù hợp.
- Hash refresh token trong database nếu cần quản lý nhiều phiên.
- JWT guard cho `/api/admin/**`.
- Roles guard cho `SALES`, `CONTENT_ADMIN`, `SUPER_ADMIN`.
- Rate limit đăng nhập.
- Khóa hoặc trì hoãn tạm thời sau nhiều lần nhập sai.
- Ghi `AuditLog` cho đăng nhập, đăng xuất và thay đổi dữ liệu quan trọng.

> Chặn route `/admin` ở React chỉ bảo vệ giao diện, không bảo vệ API. Mọi endpoint ghi dữ liệu vẫn phải có guard ở backend.

## 5. Schema cần nâng cấp

### 5.1. Sản phẩm, danh mục và thương hiệu

`Product` cần bổ sung tối thiểu:

- `nameEn`
- `descriptionEn`
- `stockQuantity`
- `isFeatured`
- `publishedAt`
- `seoTitleVi`, `seoTitleEn`
- `seoDescriptionVi`, `seoDescriptionEn`
- `specifications` dạng JSON hoặc bảng thuộc tính riêng
- `createdById`, `updatedById`
- `deletedAt` nếu dùng soft-delete

`Category` cần:

- `nameEn`, `descriptionEn`
- `parentId` để tạo cây danh mục
- `sortOrder`
- `icon` hoặc `imageAssetId`
- `seoTitle`, `seoDescription`

`Brand` cần:

- `nameEn`, `descriptionEn`
- `logoAssetId`
- `websiteUrl`
- `sortOrder`

Nên bổ sung:

- `Inventory`
- `InventoryMovement`
- `ProductSpecification`
- `ProductVariant` nếu có màu/kích thước/quy cách khác nhau
- `MediaAsset`

### 5.2. Đơn hàng và yêu cầu báo giá

Các model đề xuất:

- `Order`
- `OrderItem`
- `OrderAddress`
- `Payment`
- `OrderStatusHistory`
- `QuoteRequest`
- `QuoteItem`
- `ReturnRequest`
- `Refund`

Các trạng thái cần được định nghĩa thành enum để frontend và backend dùng thống nhất, ví dụ:

- Chờ xác nhận
- Đã xác nhận
- Đang xử lý
- Đang giao
- Hoàn thành
- Đã hủy

### 5.3. Khách hàng

Các model đề xuất:

- `CustomerProfile`
- `CustomerAddress`
- `CustomerGroup`
- `CustomerNote`
- `Gift` hoặc `RewardTransaction` nếu dùng quà tặng/điểm thưởng

### 5.4. Quản lý nội dung

Các model đề xuất:

- `NewsArticle`
- `NewsCategory`
- `Project`
- `ProjectImage`
- `Banner`
- `Document`
- `Material`
- `Supplier`

Tin tức cần hỗ trợ:

- Nội dung VI/EN
- Slug
- Tóm tắt
- Body
- Highlights
- Tags
- Ảnh bìa
- Nháp, lên lịch, xuất bản, ẩn
- Tác giả
- SEO
- Ngày xuất bản

Dự án cần hỗ trợ:

- Tiêu đề và mô tả VI/EN
- Chủ đầu tư
- Địa điểm
- Trạng thái và tiến độ
- Thời gian triển khai
- Ảnh đại diện và gallery
- Vật liệu/sản phẩm liên quan
- Nội dung SEO

### 5.5. Hệ thống

Các model đề xuất:

- `SiteSetting`
- `AdminSession` hoặc `RefreshToken`
- `RolePermission` nếu enum role chưa đủ chi tiết
- `AuditLog`
- `Notification`

## 6. Module và endpoint admin cần triển khai

Tất cả route sau nên nằm dưới `/api/admin` và được bảo vệ bằng auth/role guard.

### Dashboard

- `GET /api/admin/dashboard/summary`
- `GET /api/admin/dashboard/revenue`
- `GET /api/admin/dashboard/recent-orders`
- `GET /api/admin/dashboard/low-stock`
- `GET /api/admin/dashboard/activity`

### Sản phẩm

- `GET /api/admin/products`
- `POST /api/admin/products`
- `GET /api/admin/products/:id`
- `PATCH /api/admin/products/:id`
- `DELETE /api/admin/products/:id`
- `PATCH /api/admin/products/:id/status`
- `PATCH /api/admin/products/:id/featured`
- `POST /api/admin/products/:id/images`
- `PATCH /api/admin/products/:id/images/reorder`

API công khai:

- `GET /api/products` chỉ trả sản phẩm `ACTIVE`.
- `GET /api/products/:id-or-slug` chỉ trả sản phẩm được công khai.

### Danh mục, thương hiệu, vật liệu và nhà cung cấp

- CRUD `/api/admin/categories`
- CRUD `/api/admin/brands`
- CRUD `/api/admin/materials`
- CRUD `/api/admin/suppliers`
- Endpoint sắp xếp và bật/tắt trạng thái.

### Đơn hàng, đổi trả và hoàn tiền

- `GET /api/admin/orders`
- `GET /api/admin/orders/:id`
- `PATCH /api/admin/orders/:id/status`
- `POST /api/admin/orders/:id/notes`
- `GET /api/admin/returns`
- `PATCH /api/admin/returns/:id/status`
- `GET /api/admin/refunds`
- `POST /api/admin/refunds/:id/process`

### Khách hàng

- CRUD `/api/admin/customers`
- CRUD `/api/admin/customer-groups`
- `GET /api/admin/customers/:id/orders`
- `POST /api/admin/customers/:id/notes`

### Nội dung

- CRUD `/api/admin/news`
- CRUD `/api/admin/projects`
- CRUD `/api/admin/banners`
- CRUD `/api/admin/documents`
- Endpoint publish, unpublish và schedule riêng.

### Hệ thống

- CRUD `/api/admin/settings`
- CRUD `/api/admin/users`
- CRUD `/api/admin/permissions`
- `GET /api/admin/audit-logs`
- `GET /api/admin/notifications`

## 7. Luồng upload ảnh và Supabase Storage

### 7.1. Cấu hình backend cần thêm

Các biến chỉ đặt ở backend:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_MEDIA_BUCKET`
- Có thể tách thêm `SUPABASE_MODEL_BUCKET` cho GLB.

Tuyệt đối không đặt service role key trong biến có tiền tố `VITE_`.

### 7.2. Bucket đề xuất

- `cmid-media`: ảnh sản phẩm, tin tức, dự án, banner, logo.
- `cmid-models`: GLB và poster 3D nếu cần giới hạn riêng.

Cấu hình bucket nên có:

- Giới hạn dung lượng.
- Danh sách MIME hợp lệ.
- Quy định public/private rõ ràng.
- Tên object theo UUID, không dùng trực tiếp tên file người dùng.

### 7.3. API upload đề xuất

| Method | Endpoint | File |
| --- | --- | --- |
| `POST` | `/api/admin/uploads/images` | JPEG, PNG, WebP, AVIF; SVG chỉ khi có bước sanitize |
| `POST` | `/api/admin/uploads/models` | GLB theo giới hạn dung lượng riêng |
| `DELETE` | `/api/admin/uploads/:assetId` | Xóa object và record liên kết an toàn |

### 7.4. Luồng xử lý

1. Admin chọn file bằng `<input type="file">`.
2. Frontend gửi `multipart/form-data` tới NestJS.
3. JWT guard và role guard xác thực quyền upload.
4. NestJS kiểm tra MIME thực, phần mở rộng, kích thước và tên file.
5. Ảnh được resize/nén nếu cần.
6. Backend tạo object path duy nhất và upload qua Supabase Storage API.
7. Backend ghi `MediaAsset` và quan hệ với sản phẩm/bài viết/dự án.
8. API trả `assetId`, `url`, `altText`, kích thước và metadata.
9. Khi thay file, backend chỉ xóa object cũ sau khi transaction dữ liệu thành công.
10. Job định kỳ dọn object không còn tham chiếu.

Không được thao tác `INSERT/DELETE` trực tiếp vào bảng metadata trong schema `storage`; file phải được quản lý qua Storage API.

## 8. Nâng cấp nền tảng NestJS

Trước khi mở các API admin cần thêm:

- `ValidationPipe` toàn cục với whitelist và transform.
- DTO dùng `class-validator` và `class-transformer`.
- `helmet`.
- Rate limiting cho login, export và upload.
- Chuẩn hóa response/error.
- Pagination, filter, sort thống nhất.
- Transaction cho product + image + inventory.
- Swagger/OpenAPI.
- Structured logging nhưng không log password/token/secret.
- Unit test, integration test và e2e cho auth, guard, CRUD, upload.
- `.env.example` backend chỉ chứa tên biến và giá trị placeholder.

## 9. Lộ trình triển khai khuyến nghị

### Giai đoạn 0 — Khóa quyền Supabase

- Chụp backup/schema snapshot.
- Thu hồi quyền thừa hoặc bật RLS/policy theo kiến trúc đã chọn.
- Đảm bảo `_prisma_migrations` không truy cập được từ Data API.
- Xác nhận frontend chỉ dùng NestJS cho dữ liệu quản trị.

### Giai đoạn 1 — Auth và bảo vệ admin

- Tạo auth module.
- Seed tài khoản development đã hash.
- JWT/refresh token/logout/me.
- Guard và phân quyền.
- Protected route ở frontend.
- Audit đăng nhập.

### Giai đoạn 2 — Supabase Storage

- Tạo bucket.
- Thêm Supabase Storage service ở backend.
- Xây API upload ảnh/GLB.
- Thay trường nhập URL bằng nút upload và preview.
- Thêm `MediaAsset` và cleanup.

### Giai đoạn 3 — Hoàn chỉnh catalogue

- Migration i18n, tồn kho, featured, SEO và media.
- CRUD sản phẩm, danh mục, thương hiệu, vật liệu, nhà cung cấp.
- Tách public API và admin API.
- Bỏ cơ chế merge `localStorage` khi backend đã ổn định.

### Giai đoạn 4 — Thương mại

- Order, order item, payment, quote request.
- Trạng thái và lịch sử đơn hàng.
- Đổi trả/hoàn tiền.
- Dashboard doanh thu và báo cáo.

### Giai đoạn 5 — Khách hàng và CMS

- Hồ sơ/nhóm khách hàng.
- Tin tức, dự án, banner, tài liệu.
- Publish workflow, lịch đăng và SEO.

### Giai đoạn 6 — Hệ thống và vận hành

- Cấu hình website.
- Người dùng quản trị và quyền chi tiết.
- Audit log, notification.
- Export báo cáo.
- Backup, monitoring, test và triển khai production.

## 10. Ảnh hưởng dự kiến khi bắt đầu sửa backend

Những thay đổi sau sẽ cần được thực hiện ở lượt triển khai riêng:

- Tạo migration Prisma mới; không sửa trực tiếp migration cũ đã chạy.
- Regenerate Prisma client.
- Thêm module NestJS và package auth/upload/validation.
- Thêm backend `.env.example`.
- Tạo bucket và policy hoặc cấu hình service-role upload.
- Cập nhật frontend API service, auth context và admin forms.
- Di chuyển dữ liệu admin đang có trong `localStorage` nếu cần giữ lại.
- Bổ sung test và kiểm tra lại toàn bộ trang khách hàng.

## 11. Trạng thái thay đổi của lần kiểm tra này

- Không chỉnh `apps/backend`.
- Không tạo hoặc chạy migration mới.
- Không sửa dữ liệu Supabase.
- Không tạo user Auth.
- Không tạo Storage bucket.
- Không thay đổi RLS, grants hoặc policy.
- Không đọc hoặc ghi lại giá trị secret trong báo cáo.

Tài liệu tham khảo chính thức:

- [Supabase Storage access control](https://supabase.com/docs/guides/storage/security/access-control)
- [Supabase với Prisma](https://supabase.com/docs/guides/database/prisma)
- [Kết nối Supabase Postgres](https://supabase.com/docs/guides/database/connecting-to-postgres)
- [Supabase Storage schema](https://supabase.com/docs/guides/storage/schema/design)
