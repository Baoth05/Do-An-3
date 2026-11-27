import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
// Cố định cổng để 3 frontend chạy song song không đụng nhau: ecommerce 5173 | admin 5174 | wms 5175
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173, // Cổng chuẩn cho Sàn TMĐT & Kênh Người Bán theo quy định của team
    strictPort: true,
    proxy: {
      // Bất kỳ API nào bắt đầu bằng '/api' sẽ được Vite chuyển tiếp sang Backend
      '/api': {
        target: 'http://10.10.62.112:8080', // Địa chỉ Backend API Gateway
        changeOrigin: true,
        // Dòng này sẽ xóa chữ '/api' trước khi gửi đến Backend
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
})