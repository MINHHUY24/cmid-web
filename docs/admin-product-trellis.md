# Ảnh sản phẩm và tạo 3D với TRELLIS

Trong `/admin?view=product-editor`, bốn ô đầu luôn là Mặt trước, Mặt trái, Mặt phải, Mặt sau. Ảnh mặt trước là ảnh chính bắt buộc; ba góc còn lại có thể bổ sung sau. Nút **Thêm ảnh khác** thêm ảnh cho thư viện sản phẩm. Khi lưu, nhãn góc chụp được giữ riêng để việc bỏ ảnh mặt trái không đẩy ảnh mặt phải sang ô khác. Mô tả ảnh được tạo tự động từ tên sản phẩm và góc chụp.

1. Chọn ảnh mặt trước, bổ sung các góc chụp cùng sản phẩm nếu có.
2. Bấm **Tạo mô hình 3D**. Một ảnh dùng chế độ single-image; từ hai đến bốn ảnh dùng multi-view stochastic của `trellis-silicon`. Ảnh bổ sung không gửi vào mô hình. Mặc định pipeline 512, texture 1024, 12 bước; **Tạo nhanh** dùng 8 bước.
3. Xoay và thu phóng mô hình ngay trong trang.
4. Bấm **Lưu mô hình để sử dụng**, rồi **Lưu sản phẩm**. Tệp GLB được lưu bền vững, sản phẩm tham chiếu đường dẫn này; trang chi tiết có nút xem 3D.

## Chạy cục bộ

`npm run dev` tự khởi động dịch vụ local tại `127.0.0.1:7861` bằng `../trellis-silicon/.venv/bin/python`. Vite chuyển tiếp `/trellis-api` tới dịch vụ này. Dịch vụ tiếp tục chạy qua các lần Vite khởi động lại để không ngắt lượt tạo đang chạy. Nếu cần chạy riêng:

```sh
cd ../trellis-silicon
.venv/bin/python -m trellis_silicon.cmid_api
```

Mỗi lượt tạo chạy trong một tiến trình riêng, giải phóng bộ nhớ khi kết thúc. Chỉ một lượt được chạy cùng lúc. Nút **Dừng tạo** chấm dứt tiến trình. ID lượt tạo được giữ trong sessionStorage để trang có thể theo dõi lại khi mở lại cùng sản phẩm.

- Kết quả xem trước và log: `trellis-silicon/outputs/cmid-jobs/<id>/`.
- Tệp được chấp nhận: `frontend/public/models/generated/<id>.glb`, được phục vụ tại `/models/generated/<id>.glb` và được chép vào bản build. Các tệp này không đưa vào Git; cần sao lưu hoặc đồng bộ cùng các tài sản sản phẩm khi chuyển máy.
- Log dịch vụ: `trellis-silicon/outputs/cmid-api.log`.
- Dữ liệu sản phẩm vẫn dùng kho cục bộ hiện có của admin. Phần tích hợp tạo mới phục vụ môi trường phát triển trên máy này; khi triển khai cần dịch vụ TRELLIS và nơi lưu tệp phù hợp.

## Kiểm tra

```sh
npm test
npm run build
npm run lint
cd ../trellis-silicon
.venv/bin/python -m pytest tests/test_cmid_api.py -q
```

Kiểm thử giao diện dùng DOM mô phỏng và dịch vụ giả để kiểm tra thứ tự ảnh, xử lý lỗi và luồng chấp nhận/lưu. Kiểm thử API dùng tiến trình giả để kiểm tra điều phối, hủy, lưu, phục hồi trạng thái và từ chối tệp không hợp lệ. Kiểm tra inference thật riêng đã chạy hai ảnh `brighella_front.png` và `brighella_side.png`, xuất GLB có texture và đọc lại bằng trimesh.
