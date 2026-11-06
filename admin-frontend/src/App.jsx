import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';

import AdminLayout from './components/AdminLayout';
import Login from './pages/Login';

// Import các trang chính đã được gom nhóm và xây dựng
import UserManagementDashboard from './pages/UserManagementDashboard';
import StrategicReport from './pages/StrategicReport';
import FinancialManagement from './pages/FinancialManagement';

import './App.css';

// Component bảo vệ tuyến đường (Chỉ duy nhất ADMIN mới có quyền truy cập)
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, user } = useContext(AuthContext);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  
  // Kiểm tra vai trò: Phải là ADMIN
  if (user?.role !== 'ADMIN') {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const AppRoutes = () => {
  return (
    <Routes>
      {/* 1. Khai báo Route cho Trang Đăng nhập */}
      <Route path="/login" element={<Login />} />

      {/* 2. Các tuyến đường Admin (Bắt buộc phải đăng nhập và có vai trò ADMIN) */}
      <Route 
        path="/" 
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        {/* Mặc định khi vào "/" sẽ tự chuyển hướng vào trang Báo cáo chiến lược */}
        <Route index element={<Navigate to="/strategic-report" replace />} />
        
        {/* Các trang con hiển thị bên trong AdminLayout */}
        <Route path="strategic-report" element={<StrategicReport />} />
        <Route path="user-management" element={<UserManagementDashboard />} />
        <Route path="finance" element={<FinancialManagement />} />
      </Route>

      {/* 3. Tất cả các đường dẫn sai khác đều đẩy về /login */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;
