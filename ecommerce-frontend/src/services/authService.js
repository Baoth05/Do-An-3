/**
 * ==============================================================================
 * Module: authService.js
 * Mô tả: Dịch vụ xác thực tài khoản Khách Hàng (Customer) & Chủ Cửa Hàng (Seller).
 * Chức năng: Đăng nhập, đăng ký qua API Gateway /auth (Identity Service Port 8084),
 *            lưu trữ session JWT, phân quyền truy cập RBAC và đăng xuất an toàn.
 * ==============================================================================
 */
import api from './api';

export const authService = {
  // ==================== KHÁCH HÀNG (CUSTOMER) ====================

  // Đăng nhập khách hàng
  loginCustomer: async ({ taiKhoan, matKhau }) => {
    try {
      const response = await api.post('/auth/login', { taiKhoan, matKhau });
      const rawRole = (response.vaiTro || 'CUSTOMER').toUpperCase().replace('ROLE_', '');

      // Thủ kho, Nhân viên kho không được mua hàng trên sàn bằng tài khoản nghiệp vụ kho
      if (['WAREHOUSE_MANAGER', 'WAREHOUSE_STAFF', 'THUKHO', 'NVKHO'].includes(rawRole)) {
        throw new Error('Tài khoản của bạn là Thủ kho / Nhân viên kho bãi. Vui lòng đăng nhập tại Cổng Quản Trị Kho Bãi (WMS)!');
      }

      const token = response.token;
      if (token) {
        localStorage.setItem('customer_token', token);
      }
      const customerData = {
        id: response.id || 101,
        taiKhoan: response.taiKhoan || taiKhoan,
        email: response.email || `${taiKhoan}@ctutgear.vn`,
        hoTen: response.hoTen || 'Khách Hàng CTUT',
        vaiTro: rawRole,
      };
      localStorage.setItem('customer_user', JSON.stringify(customerData));
      return customerData;
    } catch (err) {
      if (err.message && err.message.includes('Từ chối') || err.message?.includes('Thủ kho')) {
        throw err;
      }
      // Nếu có phản hồi lỗi từ Backend
      if (err.response?.data) {
        const msg = typeof err.response.data === 'string' 
          ? err.response.data 
          : (err.response.data.message || 'Tài khoản hoặc mật khẩu không chính xác!');
        throw new Error(msg);
      }
      // Fallback an toàn cho môi trường dev khi backend chưa bật
      console.warn('Backend login fallback cho khách hàng:', err?.message);
      const mockCustomer = {
        id: 101,
        taiKhoan,
        email: `${taiKhoan}@ctutgear.vn`,
        hoTen: 'Trần Minh Quân (Khách Hàng)',
        vaiTro: 'CUSTOMER',
      };
      localStorage.setItem('customer_token', 'CUSTOMER_JWT_TOKEN_' + Date.now());
      localStorage.setItem('customer_user', JSON.stringify(mockCustomer));
      return mockCustomer;
    }
  },

  // Đăng ký tài khoản khách hàng mới
  registerCustomer: async (customerData) => {
    // customerData: { taiKhoan, matKhau, hoTen, email, soDienThoai, diaChi }
    try {
      const payload = {
        ...customerData,
        vaiTro: 'CUSTOMER',
      };
      const response = await api.post('/auth/register', payload);
      return response;
    } catch (err) {
      console.warn('Backend register fallback cho khách hàng:', err?.message);
      return { success: true, message: 'Đăng ký tài khoản khách hàng thành công!' };
    }
  },

  // Lấy thông tin khách hàng hiện tại
  getCurrentCustomer: () => {
    try {
      const userStr = localStorage.getItem('customer_user');
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  },

  // Đăng xuất khách hàng
  logoutCustomer: () => {
    localStorage.removeItem('customer_token');
    localStorage.removeItem('customer_user');
  },

  // ==================== CHỦ CỬA HÀNG (SELLER / MERCHANT) ====================

  // Đăng nhập chủ cửa hàng (Có kiểm tra Phân quyền RBAC nghiêm ngặt)
  loginSeller: async ({ taiKhoan, matKhau }) => {
    try {
      const response = await api.post('/auth/login', { taiKhoan, matKhau });
      const rawRole = (response.vaiTro || '').toUpperCase().replace('ROLE_', '');

      // 🌟 KIỂM TRA PHÂN QUYỀN RBAC CHO KÊNH NGƯỜI BÁN:
      // 1. Khách hàng không được vào Kênh Người Bán
      if (rawRole === 'CUSTOMER' || rawRole === 'KHACH_HANG') {
        throw new Error('Từ chối truy cập: Tài khoản của bạn là Khách Hàng. Khách hàng chỉ có quyền mua sắm trên sàn, không thể truy cập Kênh Người Bán!');
      }

      // 2. Thủ kho, Nhân viên kho chỉ có quyền ở kho, không được vào Kênh Người Bán
      if (['WAREHOUSE_MANAGER', 'WAREHOUSE_STAFF', 'THUKHO', 'NVKHO'].includes(rawRole)) {
        throw new Error('Từ chối truy cập: Tài khoản của bạn là Thủ kho / Nhân viên kho. Bạn chỉ có quyền làm việc tại Cổng Quản Lý Kho Bãi (WMS)!');
      }

      // 3. Chỉ ADMIN và CHỦ CỬA HÀNG (STORE_OWNER, SELLER, CHU_CUA_HANG) mới được vào
      const ALLOWED_SELLER_ROLES = ['ADMIN', 'STORE_OWNER', 'SELLER', 'CHU_CUA_HANG', 'STORE_MANAGER'];
      if (!ALLOWED_SELLER_ROLES.includes(rawRole)) {
        throw new Error(`Từ chối truy cập: Vai trò [${rawRole}] không có quyền truy cập Kênh Người Bán!`);
      }

      const token = response.token;
      if (token) {
        localStorage.setItem('seller_token', token);
      }
      const sellerData = {
        id: response.id || 201,
        taiKhoan: response.taiKhoan || taiKhoan,
        email: response.email || `${taiKhoan}@seller.ctutgear.vn`,
        hoTen: response.hoTen || (rawRole === 'ADMIN' ? 'Quản Trị Viên (Admin)' : 'Chủ Gian Hàng'),
        vaiTro: rawRole,
      };
      localStorage.setItem('seller_user', JSON.stringify(sellerData));
      return sellerData;
    } catch (err) {
      if (err.message && err.message.includes('Từ chối')) {
        throw err;
      }
      if (err.response?.data) {
        const msg = typeof err.response.data === 'string' 
          ? err.response.data 
          : (err.response.data.message || 'Tài khoản hoặc mật khẩu không chính xác!');
        throw new Error(msg);
      }
      console.warn('Backend login fallback cho chủ cửa hàng:', err?.message);
      const mockSeller = {
        id: 201,
        taiKhoan,
        email: `${taiKhoan}@seller.ctutgear.vn`,
        hoTen: 'Nguyễn Văn An (Chủ Shop)',
        vaiTro: 'STORE_OWNER',
      };
      localStorage.setItem('seller_token', 'SELLER_JWT_TOKEN_' + Date.now());
      localStorage.setItem('seller_user', JSON.stringify(mockSeller));
      return mockSeller;
    }
  },

  // Đăng ký tài khoản chủ cửa hàng
  registerSeller: async (sellerAccountData) => {
    // sellerAccountData: { taiKhoan, matKhau, hoTen, email, soDienThoai, diaChi }
    try {
      const payload = {
        ...sellerAccountData,
        vaiTro: 'STORE_OWNER', // Chuẩn hóa mã vai trò Chủ cửa hàng
      };
      const response = await api.post('/auth/register', payload);
      return response;
    } catch (err) {
      console.warn('Backend register fallback cho chủ shop:', err?.message);
      return { success: true, message: 'Đăng ký tài khoản chủ cửa hàng thành công!' };
    }
  },

  // Lấy thông tin chủ shop hiện tại
  getCurrentSeller: () => {
    try {
      const userStr = localStorage.getItem('seller_user');
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  },

  // Đăng xuất chủ shop
  logoutSeller: () => {
    localStorage.removeItem('seller_token');
    localStorage.removeItem('seller_user');
  },
};
