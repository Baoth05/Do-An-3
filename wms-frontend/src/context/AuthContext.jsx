// src/context/AuthContext.jsx
import React, { createContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('wms_token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Tự động khôi phục phiên làm việc từ localStorage
    const savedUser = localStorage.getItem('wms_user');
    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error('Lỗi đọc thông tin user từ localStorage', e);
      }
    }
    setLoading(false);
  }, [token]);

  // Hàm xử lý Đăng nhập
  const login = async (username, password) => {
    try {
      // Dùng dữ liệu thật từ API hoặc Mock cho bước thử nghiệm
      const response = await authService.login({ username, password });
      const userToken = response.token || 'mock-jwt-token-2026';
      const userData = response.user || { name: 'Thủ Kho Trưởng', role: 'WAREHOUSE_ADMIN' };

      localStorage.setItem('wms_token', userToken);
      localStorage.setItem('wms_user', JSON.stringify(userData));

      setToken(userToken);
      setUser(userData);
      return { success: true };
    } catch (error) {
      // Dùng Mock Login tạm thời nếu chưa bật Backend
      const mockToken = 'mock-jwt-token-wms-2026';
      const mockUser = { name: 'Nguyễn Văn Kho', role: 'THU_KHO' };
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