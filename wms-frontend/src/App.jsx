import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';

// Import Layout và trang Đăng nhập
import WmsLayout from './components/Layout/WmsLayout';
import Login from './pages/Auth/Login';

// Import các trang nghiệp vụ từ cấu trúc thư mục của bạn
import WmsDashboard from './pages/Dashboard/WmsDashboard';
import InventoryStock from './pages/Inventory/InventoryStock';
import ImportNoteList from './pages/ImportNote/ImportNoteList';
import ExportNoteList from './pages/ExportNote/ExportNoteList';
import ProductManagement from './pages/Product/ProductManagement';
import SupplierManagement from './pages/Supplier/SupplierManagement';
import ShippingManagement from './pages/Shipping/ShippingManagement';

// Component bảo vệ Route: Kiểm tra trạng thái đăng nhập
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useContext(AuthContext);
  // Nếu chưa đăng nhập, tự động đẩy về trang /login
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
};

// Cấu hình toàn bộ tuyến đường (Routes) của hệ thống
const AppRoutes = () => {
  return (
    <Routes>
      {/* Route công khai: Đăng nhập */}
      <Route path="/login" element={<Login />} />

      {/* Routes yêu cầu đăng nhập và có chứa Layout Sidebar + Header */}
      <Route 
        path="/" 
        element={
          <ProtectedRoute>
            <WmsLayout />
          </ProtectedRoute>
        }
      >
        {/* Tự động chuyển hướng từ gốc "/" sang "/dashboard" */}
        <Route index element={<Navigate to="/dashboard" replace />} />
        
        <Route path="dashboard" element={<WmsDashboard />} />
        
        {/* Các route nghiệp vụ kho đã được gắn Component thực tế */}
        <Route path="inventory" element={<InventoryStock />} />
        <Route path="import-notes" element={<ImportNoteList />} />
        <Route path="export-notes" element={<ExportNoteList />} />
        <Route path="products" element={<ProductManagement />} />
        <Route path="suppliers" element={<SupplierManagement />} />
        <Route path="shipping" element={<ShippingManagement />} />
      </Route>

      {/* Xử lý các đường dẫn không tồn tại (Lỗi 404) -> Đẩy về trang đăng nhập */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

// Khởi tạo App với Context và Router
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