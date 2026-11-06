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
import ApproveImportNote from './pages/ImportNote/ApproveImportNote';
import CreatePurchaseOrder from './pages/PurchaseOrder/CreatePurchaseOrder';
import ActualImportNote from './pages/ImportNote/ActualImportNote';

import ExportNoteList from './pages/ExportNote/ExportNoteList';
import ExportNoteCreate from './pages/ExportNote/ExportNoteCreate';
import ExportNoteDetail from './pages/ExportNote/ExportNoteDetail';
import ProductManagement from './pages/Product/ProductManagement';
import ProductForm from './pages/Product/ProductForm';
import ProductDetail from './pages/Product/ProductDetail';
import SupplierManagement from './pages/Supplier/SupplierManagement';
import SupplierCreate from './pages/Supplier/SupplierCreate';
import SupplierEdit from './pages/Supplier/SupplierEdit';
import ShippingManagement from './pages/Shipping/ShippingManagement';
import ShippingForm from './pages/Shipping/ShippingForm';

// Import các trang mới: Danh mục, Kho bãi
import CategoryManagement from './pages/Category/CategoryManagement';
import WarehouseManagement from './pages/Warehouse/WarehouseManagement';
import WarehouseForm from './pages/Warehouse/WarehouseForm';

// Component bảo vệ Route: Kiểm tra trạng thái đăng nhập & Phân quyền Thủ kho / Nhân viên kho / Admin
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, user, ALLOWED_WMS_ROLES } = useContext(AuthContext);
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  const roles = ALLOWED_WMS_ROLES || ['ADMIN', 'WAREHOUSE_MANAGER', 'WAREHOUSE_STAFF', 'THUKHO', 'NVKHO'];
  const userRole = user?.role ? user.role.toUpperCase() : '';
  if (userRole && !roles.includes(userRole)) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route path="/" element={<ProtectedRoute><WmsLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<WmsDashboard />} />
        
        {/* Tồn kho */}
        <Route path="inventory" element={<InventoryStock />} />
        
        {/* Quản lý & Phê duyệt Nhập kho */}
        <Route path="import-approve" element={<ApproveImportNote />} />
        <Route path="purchase-orders/create" element={<CreatePurchaseOrder />} />
        
        {/* Vận hành Nhập kho */}
        <Route path="import-notes" element={<ImportNoteList />} />
        <Route path="import-notes/create" element={<ImportNoteCreate />} />
        <Route path="import-notes/:id" element={<ImportNoteDetail />} />
        <Route path="actual-imports" element={<ActualImportNote />} />
        
        {/* Xuất kho */}
        <Route path="export-notes" element={<ExportNoteList />} />
        <Route path="export-notes/create" element={<ExportNoteCreate />} />
        <Route path="export-notes/:id" element={<ExportNoteDetail />} />
        
        {/* Danh mục Master */}
        <Route path="products" element={<ProductManagement />} />
        <Route path="products/create" element={<ProductForm />} />
        <Route path="products/edit/:id" element={<ProductForm />} />
        <Route path="products/:id" element={<ProductDetail />} />

        <Route path="categories" element={<CategoryManagement />} />

        <Route path="warehouses" element={<WarehouseManagement />} />
        <Route path="warehouses/create" element={<WarehouseForm />} />
        <Route path="warehouses/edit/:id" element={<WarehouseForm />} />
        
        <Route path="suppliers" element={<SupplierManagement />} />
        <Route path="suppliers/create" element={<SupplierCreate />} />
        <Route path="suppliers/edit/:id" element={<SupplierEdit />} />
        
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
