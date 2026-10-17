# Kiến trúc MVC cho frontend CMID

Frontend CMID sử dụng MVC phù hợp với React. `Controller` được triển khai bằng custom Hook thay vì lớp controller kiểu backend; Hook vẫn tuân thủ vòng đời và state của React, còn View giữ trách nhiệm render.

```text
View (pages, components)
  -> Controller (custom hooks, hành động UI)
    -> Service (HTTP/API gateway)
      -> API backend

Model (domain types, dữ liệu chuẩn)
  <- Controller, Service, View
```

```text
src/
  models/                 # M: domain data, static content/assets, business calculations
    assets/ content/
  controllers/            # C: catalog, content, UI and shared application state
    state/                 #   cart, auth, language, site-settings providers
  views/                  # V: mọi thứ chỉ phục vụ hiển thị
    components/           #   reusable presentation components
    layouts/              #   application shells
    pages/                #   route-level screens, including admin/
    styles/ utils/        #   CSS and presentation helpers
  services/               # API gateway / infrastructure
  routes/                 # URL -> View mapping
  @types/                 # ambient declarations for third-party libraries
```

## Vai trò thư mục

| Lớp | Vị trí | Trách nhiệm |
| --- | --- | --- |
| Model | `src/models/` | Kiểu dữ liệu domain, hằng số nghiệp vụ, tính toán đơn hàng và nguồn nội dung/ảnh tĩnh đang được Service sử dụng. Không chứa JSX hoặc gọi HTTP. |
| View | `src/views/` | Page, component, layout, CSS và presentation utility. Render JSX, accessibility và định dạng dữ liệu cho giao diện. |
| Controller | `src/controllers/` | Điều phối state, tải dữ liệu, xử lý tương tác và trả về view model/callback cho View. `controllers/state/` chứa Cart/Auth/Language/Site settings provider xuyên nhiều View. |
| Gateway | `src/services/` | Gọi API, chuyển đổi request/response. Không import từ `views/`. |
| Routing | `src/routes/` | Ánh xạ URL sang View; không đặt nghiệp vụ tại đây. |
| External declarations | `src/@types/` | Khai báo kiểu cho thư viện bên thứ ba; không phải domain Model. |

## Các module đã chuyển

- Product model: `models/product.ts`.
- Admin workspace model: `models/admin-workspace.ts`.
- Catalogue controllers: `controllers/catalog/`.
- News và projects controllers: `controllers/content/`.
- Theme controller: `controllers/ui/useColorThemeController.ts`.
- Shared state controllers: `controllers/state/`.
- Static product/branch/order data: `models/`.
- Toàn bộ page, component, layout, CSS và presentation utility đã ở dưới `views/`.

## Quy tắc khi thêm chức năng

1. Khai báo entity, enum và DTO frontend trong `models/<feature>.ts`.
2. Đặt gọi HTTP trong `services/<feature>.service.ts`.
3. Đặt state, retry, loading, validation tương tác và callback trong `controllers/<feature>/`.
4. View chỉ import Controller/Model/Component và render dữ liệu được trả về; không thêm gọi HTTP trực tiếp vào View.
5. Service không được import từ `views/`. Điều này ngăn phụ thuộc ngược và giúp một coder mới lần theo luồng dữ liệu dễ dàng.

## Mẫu module mới

```text
src/
  models/inquiries.ts
  services/inquiry.service.ts
  controllers/inquiries/useInquiryController.ts
  views/
    pages/TrangLienHe.tsx
    components/inquiries/InquiryForm.tsx
```

## Lộ trình migration legacy

Các page lớn hiện hữu vẫn chứa một phần state/form handler. Khi chỉnh sửa một màn hình, hãy tách logic của đúng màn hình đó sang Controller trong cùng pull request. Không đưa thêm nghiệp vụ mới vào View.
