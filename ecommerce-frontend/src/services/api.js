// src/services/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:8080',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    // 1. Xác định ngữ cảnh: Kênh Người Bán hay Sàn Khách Hàng
    const isSellerRoute = typeof window !== 'undefined' && window.location.pathname.startsWith('/seller');
    const isSellerApi = 
      config.url.includes('/supply-contracts') ||
      config.url.includes('/orders/store/') ||
      config.url.includes('/stores') ||
      config.url.includes('/inventory') ||
      config.url.includes('/warehouses') ||
      config.url.includes('/vouchers');

    // 2. Lấy đúng token theo ngữ cảnh: Kênh Người Bán ưu tiên seller_token
    const sellerToken = localStorage.getItem('seller_token');
    const customerToken = localStorage.getItem('customer_token');

    let token = null;
    if (isSellerRoute || isSellerApi) {
      token = sellerToken || customerToken;
    } else {
      token = customerToken || sellerToken;
    }

    // 3. Gắn thẻ xác thực Bearer Token
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