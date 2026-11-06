// src/context/AuthContext.jsx
import { createContext, useState } from 'react';
import { authService } from '../services/authService';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('wms_user');
    if (savedUser) {
      try {
        return JSON.parse(savedUser);
      } catch (e) {
        console.error('Lỗi đọc thông tin user từ localStorage', e);
      }
    }
    return null;
  });

  const [token, setToken] = useState(() => localStorage.getItem('wms_token') || null);
  const [loading] = useState(false);

  // Danh sách các vai trò được phép truy cập WMS: ADMIN, THỦ KHO, NHÂN VIÊN KHO
  const ALLOWED_WMS_ROLES = ['ADMIN', 'WAREHOUSE_MANAGER', 'WAREHOUSE_STAFF', 'THUKHO', 'NVKHO'];

  // Hàm xử lý Đăng nhập
  const login = async (username, password) => {
    try {
      const response = await authService.login({ username, password });
      if (response && response.token) {
        const rawRole = (response.vaiTro || 'THUKHO').toUpperCase().replace('ROLE_', '');

        // 🌟 KIỂM TRA PHÂN QUYỀN RBAC CHO CỔNG KHO BÃI (WMS):
        if (rawRole === 'CUSTOMER' || rawRole === 'KHACH_HANG') {
          return {
            success: false,
            message: 'Từ chối truy cập: Tài khoản của bạn là Khách Hàng, chỉ có quyền mua sắm trên Sàn TMĐT!'
          };
        }

        if (rawRole === 'STORE_OWNER' || rawRole === 'SELLER' || rawRole === 'CHU_CUA_HANG') {
          return {
            success: false,
            message: 'Từ chối truy cập: Tài khoản của bạn là Chủ Cửa Hàng, vui lòng truy cập Kênh Người Bán (Seller Portal)!'
          };
        }

        if (!ALLOWED_WMS_ROLES.includes(rawRole)) {
          return {
            success: false,
            message: `Từ chối truy cập: Vai trò [${rawRole}] không có quyền truy cập Hệ Thống Quản Lý Kho Bãi (WMS)!`
          };
        }

        const userToken = response.token;
        const userData = {
          id: response.id,
          taiKhoan: response.taiKhoan,
          name: response.hoTen || response.taiKhoan,
          role: rawRole,
          email: response.email,
        };

        localStorage.setItem('wms_token', userToken);
        localStorage.setItem('wms_user', JSON.stringify(userData));

        setToken(userToken);
        setUser(userData);
        return { success: true };
      }
      return { success: false, message: response?.message || 'Đăng nhập không thành công!' };
    } catch (error) {
      console.warn('Lỗi kết nối Backend:', error?.response?.data || error?.message);

      if (error?.response?.data) {
        const errorMsg = typeof error.response.data === 'string' 
          ? error.response.data 
          : (error.response.data.message || 'Tài khoản hoặc mật khẩu không chính xác!');
        return { success: false, message: errorMsg };
      }

      return { success: false, message: 'Không thể kết nối tới Backend API Gateway (Port 8080). Vui lòng khởi động các service backend!' };
    }
  };

  // Hàm xử lý Đăng xuất
  const logout = () => {
    localStorage.removeItem('wms_token');
    localStorage.removeItem('wms_user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        loading,
        login,
        logout,
        ALLOWED_WMS_ROLES
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
