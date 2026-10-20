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

  // Hàm xử lý Đăng nhập
  const login = async (username, password) => {
    try {
      // 1. Thử đăng nhập qua Backend API thật
      const response = await authService.login({ username, password });
      if (response && response.token) {
        const userToken = response.token;
        const userData = {
          id: response.id,
          taiKhoan: response.taiKhoan,
          name: response.hoTen || response.taiKhoan,
          role: response.vaiTro || 'USER',
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

      // Nếu Backend trả về lỗi 400 hoặc sai mật khẩu, báo lỗi thật cho người dùng
      if (error?.response?.data) {
        const errorMsg = typeof error.response.data === 'string' 
          ? error.response.data 
          : (error.response.data.message || 'Tài khoản hoặc mật khẩu không chính xác!');
        return { success: false, message: errorMsg };
      }

      // Chỉ fallback sang Mock nếu Backend chưa được bật (Lỗi mạng / Network Error)
      console.info('Backend chưa bật, sử dụng phiên làm việc mô phỏng (Mock Session)');
      const mockToken = 'mock-jwt-token-wms-2026';
      const mockUser = { id: 1, taiKhoan: username, name: 'Nguyễn Văn Kho (Mock)', role: 'THU_KHO' };
      localStorage.setItem('wms_token', mockToken);
      localStorage.setItem('wms_user', JSON.stringify(mockUser));
      setToken(mockToken);
      setUser(mockUser);
      return { success: true };
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