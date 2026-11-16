import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
// Cố định cổng để 3 frontend chạy song song không đụng nhau: ecommerce 5173 | admin 5174 | wms 5175
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5175, // Cổng Kho Vận WMS
    strictPort: true,
  },
})
