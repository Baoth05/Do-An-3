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
  const ALLOWED_WMS_ROLES = ['ADMIN', 'WAREHOUSE_MANAGER', 'WAREHOUSE_STAFF', 'THUKHO', 'NVKHO', 'STAFF', 'MANAGER'];

  // Hàm xử lý Đăng nhập
  const login = async (username, password) => {
    const cleanUser = (username || '').trim();
    const cleanPass = (password || '').trim();

    try {
      const response = await authService.login({ username: cleanUser, password: cleanPass });
      if (response && response.token) {
        const rawRole = (
          response.vaiTro || 
          response.role || 
          (Array.isArray(response.roles) ? response.roles[0]?.maVaiTro || response.roles[0] : null) || 
          'WAREHOUSE_MANAGER'
        ).toUpperCase().replace('ROLE_', '');

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
          id: response.id || 1,
          taiKhoan: response.taiKhoan || cleanUser,
          name: response.hoTen || response.taiKhoan || cleanUser,
          role: rawRole,
          email: response.email || `${cleanUser}@ctutgear.vn`,
        };

        localStorage.setItem('wms_token', userToken);
        localStorage.setItem('wms_user', JSON.stringify(userData));

        setToken(userToken);
        setUser(userData);
        return { success: true };
      }
      return { success: false, message: response?.message || 'Đăng nhập không thành công!' };
    } catch (error) {
      console.warn('Lỗi kết nối Backend WMS:', error?.response?.data || error?.message);

      // Nếu Backend trả lỗi cụ thể (sai mật khẩu, tài khoản không tồn tại, v.v.)
      if (error?.response?.data) {
        const errorMsg = typeof error.response.data === 'string' 
          ? error.response.data 
          : (error.response.data.message || 'Tài khoản hoặc mật khẩu không chính xác!');
        return { success: false, message: errorMsg };
      }

      // Fallback dự phòng an toàn khi backend chưa bật hoặc ngoại tuyến cho các tài khoản nghiệp vụ kho
      const lower = cleanUser.toLowerCase();
      if ((lower === 'admin' && (cleanPass === 'admin' || cleanPass === '123456')) ||
          (lower === 'thukho' && cleanPass === '123456') ||
          (lower === 'nvkho' && cleanPass === '123456')) {
        const assignedRole = lower === 'admin' ? 'ADMIN' : (lower === 'thukho' ? 'WAREHOUSE_MANAGER' : 'WAREHOUSE_STAFF');
        const roleLabel = lower === 'admin' ? 'Quản Trị Viên Kho' : (lower === 'thukho' ? 'Thủ Kho Tổng Trung Tâm' : 'Nhân Viên Kho Vận');
        const fallbackUser = {
          id: lower === 'admin' ? 1 : 2,
          taiKhoan: cleanUser,
          name: roleLabel,
          role: assignedRole,
          email: `${cleanUser}@ctutgear.vn`,
        };
        const fallbackToken = 'WMS_OFFLINE_JWT_' + Date.now();
        localStorage.setItem('wms_token', fallbackToken);
        localStorage.setItem('wms_user', JSON.stringify(fallbackUser));
        setToken(fallbackToken);
        setUser(fallbackUser);
        return { 
          success: true, 
          offlineMode: true,
          message: 'Đăng nhập thành công (Phiên làm việc kho bãi dự phòng)!' 
        };
      }

      return { 
        success: false, 
        message: 'Không thể kết nối tới Backend API Gateway (Port 8080). Vui lòng kiểm tra các service Spring Boot hoặc thử lại!' 
      };
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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
