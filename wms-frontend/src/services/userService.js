/**
 * ==============================================================================
 * Module: userService.js (dành cho WMS-FRONTEND)
 * Mô tả: Gọi API Identity Service (/auth/users) để đồng bộ danh sách
 *        tài khoản cửa hàng / bán hàng sang màn hình Quản lý Kho.
 * ==============================================================================
 */
import api from './api';

// 1. Hàm chuẩn hóa chữ tiếng Việt (bỏ dấu, chuyển chữ thường, xóa khoảng trắng thừa)
// Giúp so sánh tên vai trò chính xác dù dữ liệu viết hoa hay có dấu
const normalize = (value) =>
  String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

// 2. Hàm kiểm tra một tài khoản có phải là Cửa hàng / Bán hàng hay không
const isSales = (user) => {
  const role = normalize(user?.vaiTro ?? user?.role ?? user?.maVaiTro);
  return (
    role.includes('sales') ||
    role.includes('banhang') ||
    role.includes('nhanvienbanhang') ||
    role.includes('store_owner') || // Khớp mã vai trò trong database
    role.includes('chu cua hang')   // Khớp tên vai trò tiếng Việt
  );
};

export const userService = {
  // Lấy toàn bộ danh sách tài khoản từ Identity Service
  getAllUsers: async () => {
    try {
      // Đổi từ '/auth/users' sang '/auth/stores' để khớp với API mới mở cho bộ phận Kho
      const response = await api.get('/auth/stores', { timeout: 15000 });
      let data = response.data;

      // Xử lý trường hợp Backend trả về chuỗi JSON thay vì Object
      if (typeof data === 'string') {
        try {
          data = JSON.parse(data);
        } catch (e) {
          console.error('[userService] Không thể đọc chuỗi JSON từ Backend:', e);
        }
      }

      // Tự động bóc tách mảng dữ liệu từ nhiều kiểu cấu trúc trả về khác nhau
      if (Array.isArray(data)) return data;
      if (data && Array.isArray(data.data)) return data.data;
      if (data && Array.isArray(data.content)) return data.content;

      if (data && typeof data === 'object') {
        const possibleArray = Object.values(data).find((val) => Array.isArray(val));
        if (possibleArray) return possibleArray;
      }

      return [];
    } catch (error) {
      console.error('[userService] Lỗi khi gọi /auth/users:', error);

      if (error.response?.status === 403) {
        console.warn('[userService] Tài khoản Kho hiện chưa có quyền gọi API /auth/users (403 Forbidden).');
      } else if (error.code === 'ECONNABORTED') {
        console.warn('[userService] Quá thời gian chờ — kiểm tra lại Identity Service (Port 8084) hoặc API Gateway.');
      }

      return [];
    }
  },

  // Lọc ra duy nhất danh sách các tài khoản Bán hàng / Chủ cửa hàng
  getSalesUsers: async () => {
    const users = await userService.getAllUsers();
    return users.filter(isSales);
  },
};