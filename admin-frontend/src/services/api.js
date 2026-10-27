// src/services/api.js
import axios from 'axios';

// 1. Tạo một bản sao của axios với đường dẫn mặc định tới Backend (Gateway)
const api = axios.create({
  // ĐÃ SỬA: Xóa chữ '/api' ở cuối để khớp với cấu hình API Gateway
  baseURL: 'http://10.10.44.138:8080', // Thay bằng địa chỉ IP của máy chạy Backend
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
        '⚠️ Cảnh báo: Chưa tìm thấy Token đăng nhập trong localStorage. Các API lấy dữ liệu có thể bị lỗi 403.'
      );
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;