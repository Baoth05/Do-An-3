// src/services/authService.js
import api from './api';

export const authService = {
  // Đăng nhập tài khoản thủ kho / admin / user
  login: async (credentials) => {
    const payload = {
      taiKhoan: credentials.username || credentials.taiKhoan,
      matKhau: credentials.password || credentials.matKhau,
    };
    return await api.post('/auth/login', payload);
  },

  // Đăng ký tài khoản
  register: async (userData) => {
    return await api.post('/auth/register', userData);
  },

  // Lấy thông tin tài khoản theo tên đăng nhập
  getProfile: async (taiKhoan) => {
    return await api.get(`/auth/profile/${taiKhoan}`);
  },

  // Cập nhật thông tin cá nhân
  updateProfile: async (taiKhoan, profileData) => {
    return await api.put(`/auth/profile/${taiKhoan}`, profileData);
  },
};