# Báo cáo xác thực, Admin và Supabase

Ngày cập nhật: 10/09/2026

Phạm vi: React frontend, NestJS backend, Prisma và PostgreSQL/Supabase.

## Kết luận

Trước đợt cập nhật này, Google Login và quyền admin chỉ tồn tại ở browser nên không phải server-side authentication. Hiện source code đã có luồng xác thực Google ở NestJS, JWT access token ngắn hạn, refresh cookie `HttpOnly`, session có thể thu hồi và RBAC phía server. Để kích hoạt trên môi trường thật, cần cấu hình biến môi trường và áp dụng migration theo quy trình staging trước production.

## Luồng xác thực hiện tại

```text
Google Identity Services
  -> React nhận Google ID credential
  -> POST /api/auth/google
  -> NestJS verify chữ ký, issuer, audience, hạn dùng và email_verified
  -> Prisma tìm/tạo User + AuthIdentity trong PostgreSQL
  -> role lấy từ database (tài khoản mới luôn CUSTOMER)
  -> access JWT trả về memory của React + refresh token ở cookie HttpOnly
```

React không dùng `localStorage` hay state của trình duyệt làm bằng chứng đăng nhập/quyền nữa. Access token chỉ sống trong memory; khi tải lại trang, frontend gọi `/api/auth/refresh` bằng cookie rồi gọi `/api/auth/me` để lấy user/role hiện tại từ server.

## API và phân quyền

| Method | Endpoint | Bảo vệ |
| --- | --- | --- |
| `POST` | `/api/auth/google` | Verify Google ID token; rate limit; chỉ nhận origin được cấu hình |
| `GET` | `/api/auth/me` | JWT access token |
| `POST` | `/api/auth/refresh` | Refresh cookie, rotation và kiểm tra session |
| `POST` | `/api/auth/logout` | Thu hồi session và xóa cookie |
| `GET` | `/api/auth/admin/me` | JWT + role `SALES`, `CONTENT_ADMIN` hoặc `SUPER_ADMIN` |

`RolesGuard` quyết định quyền trên backend. Giao diện React chỉ dùng role để hiển thị; sửa `localStorage`, query hay request body không thể biến khách hàng thành admin.

## Dữ liệu Prisma cần áp dụng

Migration mới `20260910100000_add_server_auth`:

- cho phép `users.passwordHash` rỗng với tài khoản Google-only;
- thêm `avatarUrl`, `emailVerified`, `lastLoginAt` cho `User`;
- thêm `AuthIdentity` để định danh Google bằng `provider + providerSubject`;
- thêm `AuthSession` chỉ lưu hash refresh token, thời hạn và trạng thái thu hồi.

Không chạy reset database, seed đè dữ liệu hay migration production tự động. Cần kiểm tra backup, migration đang pending và áp dụng lần lượt ở staging trước.

## Cấu hình bắt buộc

Backend cần tự cấu hình các biến không-secret và secret theo `.env.example`:

- `GOOGLE_CLIENT_ID`
- `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` (khác nhau, mỗi secret từ 32 ký tự)
- `JWT_ACCESS_EXPIRES_IN`, `JWT_REFRESH_EXPIRES_IN`
- `AUTH_COOKIE_SECURE`, `AUTH_COOKIE_SAME_SITE`
- `CORS_ORIGINS`, `FRONTEND_URL`, `DATABASE_URL`

Frontend cần `VITE_GOOGLE_CLIENT_ID` và `VITE_API_URL`; client ID không phải secret nhưng phải đăng ký đúng JavaScript origin trên Google Cloud. Không đưa password, database URL hay JWT secret vào frontend, README hoặc commit.

## Các điểm còn lại cần hoàn thiện

1. Khóa quyền Supabase: bật RLS/policy theo kiến trúc chọn hoặc thu hồi `anon`/`authenticated` grants rộng trên các bảng Prisma, sequence và `_prisma_migrations`.
2. Áp dụng các migration pending theo pipeline kiểm soát, sau đó tạo tài khoản admin bằng quy trình vận hành an toàn. Google Login không tự phong role admin.
3. Xây CRUD admin thật trên NestJS (`/api/admin/...`) và bảo vệ bằng `JwtAuthGuard` + `RolesGuard`; dữ liệu admin hiện hữu ở frontend vẫn là dữ liệu local/demo, chưa đồng bộ database.
4. Chuyển thông tin hồ sơ khách hàng đang để local browser (địa chỉ, điện thoại, v.v.) sang model/API có xác thực khi cần lưu thật.
5. Bổ sung database test tách biệt và E2E test cookie/CORS/refresh cho CI; test unit auth hiện mock Google verifier và không gọi dịch vụ Google thật.
6. Rotate credential database từng bị lộ ngoài hệ thống quản lý secret trước khi triển khai tiếp.
