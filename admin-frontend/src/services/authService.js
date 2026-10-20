// src/services/authService.js
import axios from 'axios';

// Tạo một Axios instance cho các API xác thực
const api = axios.create({
  baseURL: '/auth', // Đảm bảo trùng khớp với cấu hình proxy của Vite
  headers: {
    'Content-Type': 'application/json',
  },
});

export const authService = {
  // Hàm xử lý đăng nhập
  login: async (username, password) => {
    try {
      // Đổi tên các key gửi lên thành taiKhoan và matKhau cho khớp Backend
      const payload = {
        taiKhoan: username,
        matKhau: password
      };

      const response = await api.post('/login', payload);
      
      // Lấy token từ phản hồi (Tùy thuộc backend của bạn trả về 'token' hay 'accessToken')
      const token = response.data.token || response.data.accessToken;
      
      if (token) {
        // Lưu token vào bộ nhớ trình duyệt để các API khác sử dụng
        localStorage.setItem('token', token);
        localStorage.setItem('isAdminLoggedIn', 'true');
      }
      
      return response.data;
    } catch (error) {
      console.error('Lỗi khi đăng nhập:', error);
      throw error; // Ném lỗi ra để component Login hiển thị thông báo
    }
  },

  // Hàm xử lý đăng xuất
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('isAdminLoggedIn');
  }
};