# React + TypeScript + Vite

## Đăng nhập Google

Giao diện đăng nhập dùng Google Identity Services. Để bật đăng nhập thật trên môi trường của bạn:

1. Trong Google Cloud Console, tạo **OAuth 2.0 Client ID** loại **Web application**.
2. Thêm các Authorized JavaScript origins, ví dụ `http://localhost:5173` khi chạy Vite.
3. Tạo file `.env` từ `.env.example`, rồi điền Client ID:

```env
VITE_GOOGLE_CLIENT_ID=your-google-oauth-web-client-id.apps.googleusercontent.com
```

Sau khi thay đổi `.env`, khởi động lại Vite. Phần nội dung hai ngôn ngữ của tài khoản nằm trong `src/content/site-content.ts`, ở hai nhánh `vi.auth` và `en.auth`.

## CMID admin demo

Mở `http://localhost:5173/admin` và đăng nhập bằng:

```text
Email: admincmid@gmail.com
Mật khẩu: cmid12345@
```

Admin hiện lưu các thay đổi demo trong trình duyệt để có thể thử toàn bộ màn hình trước khi bổ sung API bảo mật. Giữ `VITE_ADMIN_API_ENABLED=false` cho chế độ này. Sau khi triển khai auth, CRUD và upload theo `docs/admin-backend-supabase-report.md`, chuyển biến này thành `true` để gửi ảnh qua adapter backend.

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])

```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])

```
