/**
 * ==============================================================================
 * Module: userService.js
 * Mô tả: Dịch vụ API phía Admin kết nối với Identity Service (Port 8084).
 * Chức năng: Lấy danh sách tài khoản, thêm mới nhân viên, cập nhật thông tin và khóa/mở khóa tài khoản.
 * ==============================================================================
 */
import api from './api';

// Chuẩn hóa chuỗi để tìm kiếm không phân biệt chữ hoa/chữ thường
const normalize = (value) =>
  String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const isCustomer = (user) => {
  const role = normalize(user?.vaiTro ?? user?.role ?? user?.maVaiTro);
  return (
    role.includes('customer') || 
    role.includes('khachhang') || 
    role.includes('chua phan quyen')
  );
};

const isStaff = (user) => {
  const role = normalize(user?.vaiTro ?? user?.role ?? user?.maVaiTro);
  return (
    role.includes('admin') ||
    role.includes('thukho') ||
    role.includes('nvkho')
  );
};

const matchesSearch = (user, search) => {
  if (!search?.trim()) return true;

  const keyword = normalize(search);
  const searchableFields = [
    user?.id,
    user?.taiKhoan,
    user?.hoTen,
    user?.email,
    user?.soDienThoai,
    user?.diaChi,
    user?.vaiTro,
  ];

  return searchableFields.some((value) =>
    normalize(value).includes(keyword)
  );
};

export const userService = {
  // 1. Lấy toàn bộ người dùng
  getAllUsers: async () => {
    try {
      const response = await api.get('/auth/users');
      let data = response.data;

      if (typeof data === 'string') {
        try {
          data = JSON.parse(data);
        } catch (e) {
          console.error("Không thể dịch chuỗi JSON từ Backend:", e);
        }
      }

      let userList = [];
      if (Array.isArray(data)) {
        userList = data;
      } else if (data && Array.isArray(data.data)) {
        userList = data.data;
      } else if (data && Array.isArray(data.content)) {
        userList = data.content;
      } else if (data && typeof data === 'object') {
        const possibleArray = Object.values(data).find(val => Array.isArray(val));
        if (possibleArray) {
          userList = possibleArray;
        }
      }
      
      return userList;
    } catch (error) {
      console.error('Lỗi khi lấy danh sách toàn bộ người dùng:', error);
      return []; 
    }
  },

  // 2. Thống kê số lượng
  getStats: async () => {
    const users = await userService.getAllUsers();
    return {
      totalUsers: users.length,
      totalCustomers: users.filter(isCustomer).length,
      totalStaff: users.filter(isStaff).length,
    };
  },

  // 3. Lọc danh sách khách hàng
  getCustomers: async (search = '') => {
    const users = await userService.getAllUsers();
    return users
      .filter(isCustomer)
      .filter((user) => matchesSearch(user, search));
  },

  // 4. Lọc danh sách nhân viên
  getStaff: async (search = '', roleFilter = '') => {
    const users = await userService.getAllUsers();
    return users
      .filter(isStaff)
      .filter((user) => matchesSearch(user, search))
      .filter((user) => {
        if (!roleFilter || roleFilter === 'Tất cả') return true;
        return normalize(user?.vaiTro).includes(normalize(roleFilter));
      });
  },

  // 5. Tạo nhân viên mới
  createStaff: async (staffData) => {
    const payload = {
      taiKhoan: staffData.taiKhoan,
      matKhau: staffData.matKhau,
      hoTen: staffData.hoTen,
      email: staffData.email,
      soDienThoai: staffData.soDienThoai,
      vaiTro: staffData.role,
    };

    const response = await api.post('/auth/register', payload);
    return response.data;
  },

  // 6. Cập nhật nhân viên
  updateStaff: async (id, staffData) => {
    const payload = {
      hoTen: staffData.hoTen,
      email: staffData.email,
      soDienThoai: staffData.soDienThoai,
      vaiTro: staffData.role,
    };

    const response = await api.put(`/auth/users/${id}`, payload);
    return response.data;
  },

  // 7. Khóa / Mở khóa tài khoản
  toggleUserStatus: async (id) => {
    const response = await api.put(`/auth/users/${id}/toggle-status`);
    return response.data;
  },
 changePassword: async (taiKhoan, newPassword) => {
    const payload = {
      matKhauCu: "", // Gửi rỗng vì Admin đổi trực tiếp không cần mật khẩu cũ
      matKhauMoi: newPassword
    };

    const response = await api.put(`/auth/change-password/${taiKhoan}`, payload);
    return response.data;
  },
  // Khóa/Mở khóa tài khoản nhân viên
  lockAccount: async (taiKhoan) => {
    try {
      // Gọi API khóa tài khoản (Bạn cần đảm bảo Backend có API này, ví dụ: /auth/lock/{taiKhoan})
      const response = await api.put(`/auth/lock/${taiKhoan}`);
      return response.data;
    } catch (error) {
      console.error('Lỗi khi khóa tài khoản:', error);
      throw error;
    }
  },
};