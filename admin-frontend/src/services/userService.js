// src/services/userService.js
// Import cấu hình API dùng chung từ tệp api.js
import api from './api';

export const userService = {
  // Lấy thống kê số lượng người dùng
  getStats: async () => {
    try {
      const response = await api.get('/auth/stats');
      return response.data;
    } catch (error) {
      console.error('Lỗi khi lấy thống kê người dùng:', error);
      throw error;
    }
  },

  // Lấy danh sách khách hàng
  getCustomers: async (search = '', status = '') => {
    try {
      const cleanStatus = status === 'Tất cả' ? '' : status;
      const response = await api.get('/auth/customers', {
        params: { search, status: cleanStatus },
      });
      return response.data;
    } catch (error) {
      console.error('Lỗi khi lấy danh sách khách hàng:', error);
      throw error;
    }
  },

  // Lấy danh sách nhân viên
  getStaff: async (search = '', role = '') => {
    try {
      const cleanRole = role === 'Tất cả' ? '' : role;
      const response = await api.get('/auth/staff', {
        params: { search, role: cleanRole },
      });
      return response.data;
    } catch (error) {
      console.error('Lỗi khi lấy danh sách nhân viên:', error);
      throw error;
    }
  },

  // Tạo nhân viên mới
  createStaff: async (staffData) => {
    const payload = {
      username: staffData.taiKhoan,
      password: staffData.matKhau,
      fullName: staffData.hoTen,
      email: staffData.email,
      phone: staffData.soDienThoai,
      roles: staffData.roles || [staffData.role],

      taiKhoan: staffData.taiKhoan,
      matKhau: staffData.matKhau,
      hoTen: staffData.hoTen,
      soDienThoai: staffData.soDienThoai,
    };

    try {
      const response = await api.post('/auth/register', payload);
      return response.data;
    } catch (error) {
      console.error('Lỗi khi tạo nhân viên mới:', error);
      throw error;
    }
  },
};