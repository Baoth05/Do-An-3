import { useContext } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { 
  FiGrid, FiBox, FiArrowDownLeft, FiArrowUpRight, 
  FiLayers, FiTruck, FiUsers, FiLogOut, FiPackage,
  FiHome, FiTag, FiCheckSquare, FiShoppingCart, FiFileText
} from 'react-icons/fi';
import './WmsLayout.css';

const WmsLayout = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname.includes(path);

  return (
    <div className="wms-layout">
      {/* Sidebar WMS */}
      <aside className="wms-sidebar">
        <div className="wms-sidebar-logo">
          <div className="wms-logo-icon">
            <FiPackage size={20} />
          </div>
          <div className="wms-logo-text">
            <h2>CTUT WMS CORE</h2>
            <span>Hệ Thống Quản Lý Kho</span>
          </div>
        </div>

        <nav className="wms-sidebar-menu">
          <Link to="/dashboard" className={`wms-menu-item ${isActive('dashboard') ? 'active' : ''}`}>
            <FiGrid size={18} />
            <span>Thống Kê Tổng Quan</span>
          </Link>

          {/* NHÓM 1: QUẢN LÝ & PHÊ DUYỆT (THỦ KHO TRƯỞNG) */}
          <div className="wms-menu-label">QUẢN LÝ & PHÊ DUYỆT</div>
          
          <Link to="/import-approve" className={`wms-menu-item ${isActive('import-approve') ? 'active' : ''}`}>
            <FiCheckSquare size={18} />
            <span>Duyệt Yêu Cầu Nhập</span>
          </Link>

          <Link to="/purchase-orders/create" className={`wms-menu-item ${isActive('purchase-orders') ? 'active' : ''}`}>
            <FiShoppingCart size={18} />
            <span>Lập Đơn Đặt Hàng (PO)</span>
          </Link>

          {/* NHÓM 2: QUẢN LÝ CHỨNG TỪ (CHUNG) */}
          <div className="wms-menu-label">QUẢN LÝ CHỨNG TỪ</div>

          <Link to="/inventory" className={`wms-menu-item ${isActive('inventory') ? 'active' : ''}`}>
            <FiBox size={18} />
            <span>Tồn Kho & Thẻ Kho</span>
          </Link>

          {/* Đã đổi tên ở đây */}
          <Link to="/import-notes" className={`wms-menu-item ${isActive('import-notes') && !isActive('import-approve') ? 'active' : ''}`}>
            <FiFileText size={18} />
            <span>Quản Lý Phiếu Nhập</span>
          </Link>

          {/* Đã đổi tên ở đây */}
          <Link to="/export-notes" className={`wms-menu-item ${isActive('export-notes') ? 'active' : ''}`}>
            <FiFileText size={18} />
            <span>Quản Lý Phiếu Xuất</span>
          </Link>

          {/* NHÓM MỚI: XỬ LÝ THỰC TẾ DÀNH CHO NHÂN VIÊN KHO */}
          <div className="wms-menu-label">THAO TÁC KHO THỰC TẾ</div>

          <Link to="/actual-imports" className={`wms-menu-item ${isActive('actual-imports') ? 'active' : ''}`}>
            <FiArrowDownLeft size={18} />
            <span>Xử Lý Nhập Kho Thực Tế</span>
          </Link>

          <Link to="/actual-exports" className={`wms-menu-item ${isActive('actual-exports') ? 'active' : ''}`}>
            <FiArrowUpRight size={18} />
            <span>Xử Lý Xuất Kho Thực Tế</span>
          </Link>

          {/* NHÓM 3: DANH MỤC MASTER */}
          <div className="wms-menu-label">DANH MỤC MASTER</div>

          <Link to="/products" className={`wms-menu-item ${isActive('products') ? 'active' : ''}`}>
            <FiLayers size={18} />
            <span>Hàng Hóa & Sản Phẩm</span>
          </Link>

          <Link to="/categories" className={`wms-menu-item ${isActive('categories') ? 'active' : ''}`}>
            <FiTag size={18} />
            <span>Danh Mục Ngành Hàng</span>
          </Link>

          <Link to="/warehouses" className={`wms-menu-item ${isActive('warehouses') ? 'active' : ''}`}>
            <FiHome size={18} />
            <span>Kho Bãi Chi Nhánh</span>
          </Link>

          <Link to="/suppliers" className={`wms-menu-item ${isActive('suppliers') ? 'active' : ''}`}>
            <FiUsers size={18} />
            <span>Nhà Cung Cấp</span>
          </Link>

          <Link to="/shipping" className={`wms-menu-item ${isActive('shipping') ? 'active' : ''}`}>
            <FiTruck size={18} />
            <span>Đơn Vị Vận Chuyển</span>
          </Link>
        </nav>

        <div className="wms-sidebar-footer">
          <div className="wms-status-card">
            <span className="wms-status-dot"></span>
            <div>
              <strong>KHO VẬT LÝ ONLINE</strong>
              <small>wms-core-service:8081</small>
            </div>
          </div>
        </div>
      </aside>

      {/* Cột nội dung chính */}
      <div className="wms-main-content">
        <header className="wms-top-header">
          <div className="wms-breadcrumb">
            Phân Hệ Kho Bãi / <span>{location.pathname.replace('/', '').toUpperCase() || 'DASHBOARD'}</span>
          </div>

          <div className="wms-user-profile">
            <span className="wms-role-badge">{user?.role || 'THỦ KHO'}</span>
            <div className="wms-user-info">
              <p className="wms-user-name">{user?.name || user?.taiKhoan || 'Nguyễn Văn Kho'}</p>
              <p className="wms-user-id">ID: #{user?.id || '01'} • @{user?.taiKhoan || 'admin'}</p>
            </div>
            <button className="btn-logout" onClick={handleLogout} title="Đăng xuất">
              <FiLogOut size={16} />
            </button>
          </div>
        </header>

        <main className="wms-page-body">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default WmsLayout;