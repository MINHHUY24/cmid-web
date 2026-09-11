import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { trellisPlugin } from './server/trellis-plugin.ts'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), trellisPlugin()],
  server: {
    proxy: {
      '/trellis-api': {
        target: 'http://127.0.0.1:7861',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/trellis-api/, ''),
      },
    },
  },
})
