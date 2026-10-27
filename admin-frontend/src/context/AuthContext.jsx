// src/context/AuthContext.jsx
import { createContext, useState } from 'react';

// Tạo Context để chia sẻ dữ liệu toàn ứng dụng
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // 1. Kiểm tra bộ nhớ trình duyệt xem người dùng đã đăng nhập trước đó chưa
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const savedAuth = localStorage.getItem('isAdminLoggedIn');
    return savedAuth === 'true';
  });

  // 2. Lấy dữ liệu người dùng từ bộ nhớ (nếu đã đăng nhập)
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('adminUserData');
    if (savedUser) {
      return JSON.parse(savedUser); // Chuyển chuỗi JSON thành object
    }
    return null; // Trả về null nếu chưa đăng nhập
  });

  // 3. Hàm Login: Cập nhật state và lưu cả thông tin + Token vào localStorage
  const login = (userData, token) => {
    setIsAuthenticated(true);
    localStorage.setItem('isAdminLoggedIn', 'true');

    // Lưu thông tin hiển thị (Tên, Ảnh đại diện, Vai trò...)
    if (userData) {
      setUser(userData);
      localStorage.setItem('adminUserData', JSON.stringify(userData));
    }

    // 🌟 QUAN TRỌNG: Lưu token để tệp api.js tự động nhặt lấy và gửi kèm API
    if (token) {
      localStorage.setItem('token', token);
    }
  };

  // 4. Hàm Logout: Xóa state và dọn dẹp bộ nhớ (bao gồm cả token)
  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);
    localStorage.removeItem('isAdminLoggedIn');
    localStorage.removeItem('adminUserData');
    localStorage.removeItem('token'); // 🌟 Xóa "thẻ thông hành" khi thoát
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};