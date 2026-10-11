// src/services/authService.js
import api from './api';

export const authService = {
  // Đăng nhập tài khoản thủ kho / admin
  login: async (credentials) => {
    // Route qua Gateway đến identity-service (/auth/login)
    return await api.post('/auth/login', credentials);
  },

  // Lấy thông tin tài khoản hiện tại
  getProfile: async () => {
    return await api.get('/auth/me');
  },
};