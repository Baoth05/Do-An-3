// Đường dẫn tệp: admin-frontend/vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Biến lưu địa chỉ của API Gateway (Backend) để dễ dàng chỉnh sửa ở một nơi duy nhất
const BACKEND_GATEWAY_URL = 'http://10.10.22.175:8080';

export default defineConfig({
  plugins: [react()],
  server: {
    // 🌟 SỬA LỖI 1: Đổi từ 8080 sang 5174 để KHÔNG đụng độ với API Gateway (8080) và các Service con (8081, 8082)
    port: 5174,
    
    // Cấu hình cầu nối (Proxy) chuyển tiếp yêu cầu từ Frontend (5174) sang API Gateway (8080)
    proxy: {
      // 1. Chuyển tiếp các API Xác thực & Tài khoản (identity-service)
      '/auth': {
        target: BACKEND_GATEWAY_URL,
        changeOrigin: true,
        secure: false,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('❌ Lỗi kết nối Vite Proxy (/auth) đến Backend:', err.message);
          });
        },
      },

      // 🌟 SỬA LỖI 2: Bổ sung chuyển tiếp cho các API Quản lý kho (wms-core-service)
      '/wms': {
        target: BACKEND_GATEWAY_URL,
        changeOrigin: true,
        secure: false,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('❌ Lỗi kết nối Vite Proxy (/wms) đến Backend:', err.message);
          });
        },
      },

      // 3. Dự phòng cho các đường dẫn bắt đầu bằng /api (nếu có)
      '/api': {
        target: BACKEND_GATEWAY_URL,
        changeOrigin: true,
        secure: false,
      },
    },
  },
});