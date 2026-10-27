import { useContext } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { 
  FiGrid, FiBox, FiArrowDownLeft, FiArrowUpRight, 
  FiLayers, FiTruck, FiUsers, FiLogOut, FiPackage,
  FiRepeat, FiHome, FiTag
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
          <div className="wms-menu-label">VẬN HÀNH KHO</div>
          
          <Link to="/dashboard" className={`wms-menu-item ${isActive('dashboard') ? 'active' : ''}`}>
            <FiGrid size={18} />
            <span>Thống Kê Xuất/Nhập</span>
          </Link>

          <Link to="/inventory" className={`wms-menu-item ${isActive('inventory') ? 'active' : ''}`}>
            <FiBox size={18} />
            <span>Tồn Kho & Thẻ Kho</span>
          </Link>

          <Link to="/import-notes" className={`wms-menu-item ${isActive('import-notes') ? 'active' : ''}`}>
            <FiArrowDownLeft size={18} />
            <span>Quản Lý Nhập Kho</span>
          </Link>

          <Link to="/export-notes" className={`wms-menu-item ${isActive('export-notes') ? 'active' : ''}`}>
            <FiArrowUpRight size={18} />
            <span>Quản Lý Xuất Kho</span>
          </Link>

          <Link to="/transfers" className={`wms-menu-item ${isActive('transfers') ? 'active' : ''}`}>
            <FiRepeat size={18} />
            <span>Điều Chuyển Kho</span>
          </Link>

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

        {/* Khu vực render nội dung Router con */}
        <main className="wms-page-body">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default WmsLayout;
