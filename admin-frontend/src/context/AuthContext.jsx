// src/context/AuthContext.jsx
import { createContext, useState } from 'react';

// Tạo Context
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const savedAuth = localStorage.getItem('isAdminLoggedIn');
    return savedAuth === 'true'; 
  });
  
  // Dữ liệu người dùng: Lấy từ bộ nhớ. Nếu không có thì để null (Trống), không dùng dữ liệu giả nữa
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('adminUserData');
    if (savedUser) {
      try {
        return JSON.parse(savedUser);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  const login = (userData) => {
    setIsAuthenticated(true);
    localStorage.setItem('isAdminLoggedIn', 'true'); 
    if (userData) {
      setUser(userData);
      localStorage.setItem('adminUserData', JSON.stringify(userData));
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);
    localStorage.removeItem('isAdminLoggedIn');
    localStorage.removeItem('adminUserData');
    localStorage.removeItem('token'); // Đảm bảo xóa cả token
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};