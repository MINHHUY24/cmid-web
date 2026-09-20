# Quản lý nội dung VI / EN

Chỉnh nội dung giao diện tại [`site-content.ts`](./site-content.ts).

- `siteContent.vi`: toàn bộ chuỗi tiếng Việt.
- `siteContent.en`: bản tiếng Anh tương ứng.
- Nút `VI | EN` trên thanh đầu trang đổi ngôn ngữ và lưu lựa chọn trong trình duyệt.

Tên, mô tả, danh mục và thương hiệu của sản phẩm đang đến từ API. Để các dữ liệu đó có tiếng Anh, API cần trả thêm các trường tùy chọn `nameEn`, `descriptionEn`, `category.nameEn` và `brand.nameEn`. Khi chưa có những trường này, giao diện tự hiển thị bản tiếng Việt để không bị trống nội dung.

Danh mục chuyên mục và kiểu dữ liệu bài viết nằm ở [`news-articles.ts`](./news-articles.ts). Nội dung Tin tức thực tế được đọc và quản trị qua API/Supabase; mỗi bản ghi có `slug`, nội dung song ngữ, ngày đăng, ảnh, điểm nổi bật, thẻ chủ đề và trạng thái xuất bản. Giao diện tự lọc, phân trang và hiển thị skeleton trong lúc chờ dữ liệu.
