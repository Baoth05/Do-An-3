import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';

import AdminLayout from './components/AdminLayout';
import Login from './pages/Login';

// Import các trang chính đã được gom nhóm và xây dựng
import UserManagementDashboard from './pages/UserManagementDashboard';
import StrategicReport from './pages/StrategicReport';
import FinancialManagement from './pages/FinancialManagement'; // Đã thêm import trang Tài chính

import './App.css'; // CSS chung toàn cục

// Component bảo vệ tuyến đường (Chưa đăng nhập -> Đẩy về /login)
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useContext(AuthContext);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
};

const AppRoutes = () => {
  return (
    <Routes>
      {/* 1. Khai báo Route cho Trang Đăng nhập */}
      <Route path="/login" element={<Login />} />

      {/* 2. Các tuyến đường Admin (Bắt buộc phải đăng nhập) */}
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
        <Route path="finance" element={<FinancialManagement />} /> {/* Đã thêm Route Tài chính */}
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