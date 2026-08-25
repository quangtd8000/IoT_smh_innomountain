import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
    // Bản build dùng đường dẫn tương đối /api và được nginx proxy sang backend.
    // Dev server không có nginx, nên proxy ở đây cho khớp.
    proxy: {
      '/api': {
        // Doi bang VITE_DEV_API_TARGET khi backend khong chay o localhost
        target: process.env.VITE_DEV_API_TARGET || 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
});
