// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 8080,
    proxy: {
      '/auth': {
        // Thay địa chỉ IP này bằng IP IPv4 mới nhất của máy chạy Backend
        target: 'http://10.10.22.175:8080',
        changeOrigin: true,
        secure: false,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('❌ Lỗi kết nối Vite Proxy đến Backend:', err.message);
          });
        },
      },
    },
  },
});