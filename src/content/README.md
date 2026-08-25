# Quản lý nội dung VI / EN

Chỉnh nội dung giao diện tại [`site-content.ts`](./site-content.ts).

- `siteContent.vi`: toàn bộ chuỗi tiếng Việt.
- `siteContent.en`: bản tiếng Anh tương ứng.
- Nút `VI | EN` trên thanh đầu trang đổi ngôn ngữ và lưu lựa chọn trong trình duyệt.

Tên, mô tả, danh mục và thương hiệu của sản phẩm đang đến từ API. Để các dữ liệu đó có tiếng Anh, API cần trả thêm các trường tùy chọn `nameEn`, `descriptionEn`, `category.nameEn` và `brand.nameEn`. Khi chưa có những trường này, giao diện tự hiển thị bản tiếng Việt để không bị trống nội dung.

Nội dung bài viết Tin tức được quản lý riêng ở [`news-articles.ts`](./news-articles.ts). Mỗi bài có `slug`, tiêu đề, tóm tắt, ngày đăng, danh mục, ảnh, nội dung chi tiết, điểm nổi bật và thẻ chủ đề cho cả `vi` và `en`. Chỉ cần thêm bài vào danh sách tương ứng; giao diện tự tạo phân trang khi số bài vượt quá một trang.
