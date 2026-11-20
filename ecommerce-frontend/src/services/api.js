// src/services/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:8080',
  timeout: 4000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    // Phân tách token theo ngữ cảnh phân hệ: Kênh Người Bán dùng seller_token, Sàn Mua Hàng dùng customer_token
    const isSellerRoute = typeof window !== 'undefined' && window.location.pathname.startsWith('/seller');
    const token = isSellerRoute 
      ? (localStorage.getItem('seller_token') || localStorage.getItem('customer_token'))
      : (localStorage.getItem('customer_token') || localStorage.getItem('seller_token'));

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.warn('API Gateway request failed:', error?.response?.data || error?.message);
    return Promise.reject(error);
  }
);

export default api;