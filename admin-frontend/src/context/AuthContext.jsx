/**
 * ==============================================================================
 * Module: AuthContext.jsx
 * Mô tả: Context quản lý phiên đăng nhập và quyền hạn của Quản trị viên (Admin).
 * Chức năng: Lưu trữ JWT Token, thông tin Admin trong localStorage, hỗ trợ Login/Logout.
 * ==============================================================================
 */
import { createContext, useState } from 'react';

// Tạo Context để chia sẻ dữ liệu toàn ứng dụng
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const savedAuth = localStorage.getItem('isAdminLoggedIn');
    return savedAuth === 'true';
  });

  // Lấy dữ liệu người dùng từ bộ nhớ (nếu đã đăng nhập). Nếu không có thì trả về null (trống).
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

  // Hàm Login: Cập nhật state và lưu cả thông tin + Token vào localStorage
  const login = (userData, token) => {
    setIsAuthenticated(true);
    localStorage.setItem('isAdminLoggedIn', 'true');

    if (userData) {
      setUser(userData);
      localStorage.setItem('adminUserData', JSON.stringify(userData));
    }

    // 🌟 QUAN TRỌNG: Lưu token để tệp api.js tự động nhặt lấy và gửi kèm API
    if (token) {
      localStorage.setItem('token', token);
    }
  };

  // Hàm Logout: Xóa state và dọn dẹp bộ nhớ (bao gồm cả token)
  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);
    localStorage.removeItem('isAdminLoggedIn');
    localStorage.removeItem('adminUserData');
    localStorage.removeItem('token'); // Đảm bảo xóa cả thẻ thông hành khi thoát
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};