// src/context/AuthContext.jsx
import { createContext, useState, useEffect } from 'react';

// Tạo Context
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // 1. Kiểm tra bộ nhớ trình duyệt xem người dùng đã đăng nhập trước đó chưa
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const savedAuth = localStorage.getItem('isAdminLoggedIn');
    return savedAuth === 'true'; 
  });
  
  // 2. Dữ liệu người dùng: Ưu tiên lấy từ bộ nhớ, nếu không có thì dùng dữ liệu mặc định của bạn
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('adminUserData');
    if (savedUser) {
      return JSON.parse(savedUser); // Chuyển chuỗi JSON thành object
    }
    return {
      name: 'HungPhatTruong',
      role: 'Quản trị viên',
      status: 'TRỰC TUYẾN',
      avatar: 'H'
    };
  });

  // 3. Hàm Login: Cập nhật state và lưu vào localStorage
  const login = (userData) => {
    setIsAuthenticated(true);
    localStorage.setItem('isAdminLoggedIn', 'true'); 
    
    if (userData) {
      setUser(userData);
      localStorage.setItem('adminUserData', JSON.stringify(userData));
    }
  };

  // 4. Hàm Logout: Xóa state và dọn dẹp bộ nhớ
  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);
    localStorage.removeItem('isAdminLoggedIn');
    localStorage.removeItem('adminUserData');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};