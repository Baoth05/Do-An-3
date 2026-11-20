
// src/services/api.js
import axios from 'axios';

// 1. Tạo axios instance kết nối tới API Gateway
const api = axios.create({
  // Địa chỉ API Gateway cấu hình trong file .env
  baseURL: import.meta.env.VITE_API_GATEWAY_URL || 'http://10.10.30.177:8080',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 2. Request Interceptor: Tự động đính kèm JWT Token
api.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem('token') ||
      localStorage.getItem('accessToken') ||
      localStorage.getItem('jwt') ||
      localStorage.getItem('jwtToken');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      console.warn(
        '⚠️ Cảnh báo: Chưa tìm thấy Token đăng nhập trong localStorage. Các API lấy dữ liệu có thể bị lỗi 401/403.'
      );
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// 3. Response Interceptor: Xử lý lỗi 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn(
        '⚠️ Phiên đăng nhập Admin đã hết hạn hoặc không hợp lệ. Chuyển hướng về đăng nhập.'
      );

      localStorage.removeItem('token');
      localStorage.removeItem('isAdminLoggedIn');
      localStorage.removeItem('adminUserData');

      if (
        typeof window !== 'undefined' &&
        !window.location.pathname.includes('/login')
      ) {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default api;
