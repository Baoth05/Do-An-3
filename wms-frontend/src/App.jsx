import { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';

// Import Layout và trang Đăng nhập
import WmsLayout from './components/Layout/WmsLayout';
import Login from './pages/Auth/Login';

// Import các trang nghiệp vụ
import WmsDashboard from './pages/Dashboard/WmsDashboard';
import InventoryStock from './pages/Inventory/InventoryStock';
import ImportNoteList from './pages/ImportNote/ImportNoteList';
import ImportNoteCreate from './pages/ImportNote/ImportNoteCreate';
import ImportNoteDetail from './pages/ImportNote/ImportNoteDetail';
import ExportNoteList from './pages/ExportNote/ExportNoteList';
import ExportNoteCreate from './pages/ExportNote/ExportNoteCreate';
import ExportNoteDetail from './pages/ExportNote/ExportNoteDetail';
import ProductManagement from './pages/Product/ProductManagement';
import ProductForm from './pages/Product/ProductForm';
import SupplierManagement from './pages/Supplier/SupplierManagement';
import SupplierForm from './pages/Supplier/SupplierForm';
import ShippingManagement from './pages/Shipping/ShippingManagement';
import ShippingForm from './pages/Shipping/ShippingForm';

// Import các trang mới: Danh mục, Kho bãi, Điều chuyển
import CategoryManagement from './pages/Category/CategoryManagement';
import CategoryForm from './pages/Category/CategoryForm';
import WarehouseManagement from './pages/Warehouse/WarehouseManagement';
import WarehouseForm from './pages/Warehouse/WarehouseForm';
import TransferList from './pages/Transfer/TransferList';
import TransferCreate from './pages/Transfer/TransferCreate';

// Component bảo vệ Route: Kiểm tra trạng thái đăng nhập
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useContext(AuthContext);
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
        <Route index element={<Navigate to="/dashboard" replace />} />
        
        <Route path="dashboard" element={<WmsDashboard />} />
        
        {/* Tồn kho */}
        <Route path="inventory" element={<InventoryStock />} />
        
        {/* Nhập kho */}
        <Route path="import-notes" element={<ImportNoteList />} />
        <Route path="import-notes/create" element={<ImportNoteCreate />} />
        <Route path="import-notes/:id" element={<ImportNoteDetail />} />
        
        {/* Xuất kho */}
        <Route path="export-notes" element={<ExportNoteList />} />
        <Route path="export-notes/create" element={<ExportNoteCreate />} />
        <Route path="export-notes/:id" element={<ExportNoteDetail />} />

        {/* Điều chuyển kho */}
        <Route path="transfers" element={<TransferList />} />
        <Route path="transfers/create" element={<TransferCreate />} />
        
        {/* Hàng hóa / Sản phẩm */}
        <Route path="products" element={<ProductManagement />} />
        <Route path="products/create" element={<ProductForm />} />
        <Route path="products/edit/:id" element={<ProductForm />} />

        {/* Danh mục hàng hóa */}
        <Route path="categories" element={<CategoryManagement />} />
        <Route path="categories/create" element={<CategoryForm />} />
        <Route path="categories/edit/:id" element={<CategoryForm />} />

        {/* Kho bãi chi nhánh */}
        <Route path="warehouses" element={<WarehouseManagement />} />
        <Route path="warehouses/create" element={<WarehouseForm />} />
        <Route path="warehouses/edit/:id" element={<WarehouseForm />} />
        
        {/* Nhà cung cấp */}
        <Route path="suppliers" element={<SupplierManagement />} />
        <Route path="suppliers/create" element={<SupplierForm />} />
        <Route path="suppliers/edit/:id" element={<SupplierForm />} />
        
        {/* Đơn vị vận chuyển */}
        <Route path="shipping" element={<ShippingManagement />} />
        <Route path="shipping/create" element={<ShippingForm />} />
        <Route path="shipping/edit/:id" element={<ShippingForm />} />
      </Route>

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
