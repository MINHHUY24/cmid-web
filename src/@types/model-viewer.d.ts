/*
 * Vai trò: External type | Khai báo TypeScript cho thẻ web component `<model-viewer>`.
 */
/* Kiểu React nền để kế thừa các thuộc tính HTML chuẩn và truyền ref. */
import type { HTMLAttributes, Ref } from "react";

/* Mở rộng JSX của React để TypeScript hiểu thẻ web component `model-viewer`. */
declare module "react" {
  /* Nơi React khai báo danh sách các thẻ có thể dùng trực tiếp trong JSX. */
  namespace JSX {
    interface IntrinsicElements {
      /*
       * Thuộc tính riêng của `<model-viewer>`.
       * HTMLAttributes giữ lại className, style, aria-* và các thuộc tính HTML chuẩn khác.
       */
      "model-viewer": HTMLAttributes<HTMLElement> & {
        /* Tham chiếu đến phần tử để View có thể gọi API của model-viewer khi cần. */
        ref?: Ref<HTMLElement>;

        /* Nguồn mô hình 3D, ảnh chờ tải và mô tả cho trình đọc màn hình. */
        src: string;
        poster?: string;
        alt: string;

        /* Thiết lập cách mô hình được tải và xuất hiện trong giao diện. */
        exposure?: string;
        loading?: string;
        reveal?: string;

        /* Điều khiển camera, thao tác chạm và độ đổ bóng của mô hình 3D. */
        "camera-controls"?: string;
        "touch-action"?: string;
        "shadow-intensity"?: string;

        /* Giới hạn vị trí xoay và góc nhìn của camera. */
        "camera-orbit"?: string;
        "min-camera-orbit"?: string;
        "max-camera-orbit"?: string;
        "field-of-view"?: string;
        "min-field-of-view"?: string;
        "max-field-of-view"?: string;

        /* Bật trải nghiệm thực tế tăng cường và các chế độ AR được hỗ trợ. */
        ar?: boolean;
        "ar-modes"?: string;
        "ar-scale"?: string;
        "xr-environment"?: string;
      };
    }
  }
}
