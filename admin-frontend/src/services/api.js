// src/services/api.js
import axios from 'axios';

// 1. Tạo một bản sao của axios với đường dẫn mặc định tới Backend (Gateway)
const api = axios.create({



  // ĐÃ SỬA: Xóa chữ '/api' ở cuối để khớp với cấu hình API Gateway
  // Địa chỉ API Gateway cấu hình trong file .env (VITE_API_GATEWAY_URL)
  baseURL: import.meta.env.VITE_API_GATEWAY_URL || 'http://10.10.62.112:8080',



  timeout: 10000, // Nếu quá 10 giây không có phản hồi thì báo lỗi



  headers: {
    'Content-Type': 'application/json',
  },
});

// 2. Bộ chặn Request (Interceptor): Tự động đính kèm Token vào trước mỗi lần gửi yêu cầu
api.interceptors.request.use(
  (config) => {
    // Tìm mã Token trong localStorage
    const token =
      localStorage.getItem('token') ||
      localStorage.getItem('accessToken') ||
      localStorage.getItem('jwt') ||
      localStorage.getItem('jwtToken');

    if (token) {
      // Đính kèm thẻ xác thực Bearer Token cho Spring Security
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      console.warn(
        '⚠️ Cảnh báo: Chưa tìm thấy Token đăng nhập trong localStorage. Các API lấy dữ liệu có thể bị lỗi 401/403.'
      );
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 3. Bộ chặn Response (Interceptor): Bắt lỗi 401 khi Token hết hạn hoặc bị từ chối
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn('⚠️ Phiên đăng nhập Admin đã hết hạn hoặc không hợp lệ. Chuyển hướng về đăng nhập.');
      localStorage.removeItem('token');
      localStorage.removeItem('isAdminLoggedIn');
      localStorage.removeItem('adminUserData');
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
