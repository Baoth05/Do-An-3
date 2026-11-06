// src/pages/Seller/SellerLayout.jsx
import { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { marketplaceService } from '../../services/marketplaceService';
import { 
  FiHome, FiBox, FiShoppingBag, FiTag, FiSettings, 
  FiArrowLeft, FiCheckCircle, FiAlertCircle, FiFileText, FiPlusCircle 
} from 'react-icons/fi';
import './SellerLayout.css';

const SellerLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [stores, setStores] = useState([]);
  const [currentStoreId, setCurrentStoreId] = useState(() => {
    return localStorage.getItem('seller_selected_store_id') || '2';
  });
  const [currentStore, setCurrentStore] = useState(null);

  useEffect(() => {
    const fetchStores = async () => {
      const allStores = await marketplaceService.getStores();
      setStores(allStores);
      if (allStores.length > 0) {
        const found = allStores.find((s) => s.id === Number(currentStoreId)) || allStores[0];
        setCurrentStore(found);
        setCurrentStoreId(String(found.id));
      }
    };
    fetchStores();
  }, [currentStoreId]);

  const handleStoreChange = (newId) => {
    setCurrentStoreId(newId);
    localStorage.setItem('seller_selected_store_id', newId);
    const found = stores.find((s) => s.id === Number(newId));
    setCurrentStore(found);
  };

  const navItems = [
    { path: '/seller', label: 'Tổng Quan', icon: <FiHome />, exact: true },
    { path: '/seller/contracts', label: 'Hợp Đồng Cung Ứng', icon: <FiFileText /> },
    { path: '/seller/products', label: 'Hàng Hóa & Đăng Bán', icon: <FiBox /> },
    { path: '/seller/orders', label: 'Quản Lý Đơn Hàng', icon: <FiShoppingBag /> },
    { path: '/seller/vouchers', label: 'Voucher Khuyến Mãi', icon: <FiTag /> },
    { path: '/seller/settings', label: 'Hồ Sơ Gian Hàng', icon: <FiSettings /> },
  ];

  return (
    <div className="seller-portal-layout">
      {/* Sidebar Người Bán */}
      <aside className="seller-sidebar">
        <div className="seller-brand">
          <div className="seller-logo-badge">
            <FiShoppingBag size={22} />
          </div>
          <div>
            <h3>KÊNH NGƯỜI BÁN</h3>
            <span>CTUT Gear Merchant</span>
          </div>
        </div>

        {/* Bộ chọn Gian Hàng Quản Lý (Nhiều cửa hàng / Multi-tenant) */}
        <div className="seller-store-selector-box">
          <div className="selector-label-row">
            <label>Gian Hàng Đang Quản Trị:</label>
            <Link to="/seller/register" className="link-register-mini" title="Đăng ký thêm gian hàng mới">
              + Mở Shop
            </Link>
          </div>
          <select 
            value={currentStoreId} 
            onChange={(e) => handleStoreChange(e.target.value)}
          >
            {stores.map((s) => (
              <option key={s.id} value={s.id}>
                {s.tenKho} (Mã: {s.maKho})
              </option>
            ))}
          </select>
          {currentStore && (
            <div className="store-status-indicator">
              <span className="dot-green"></span>
              <small>{currentStore.diaChi || 'Cần Thơ'}</small>
            </div>
          )}
        </div>

        {/* Menu Điều Hướng */}
        <nav className="seller-nav-menu">
          {navItems.map((item) => {
            const isActive = item.exact 
              ? location.pathname === item.path 
              : location.pathname.startsWith(item.path);

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`seller-nav-item ${isActive ? 'active' : ''}`}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Nút Chuyển Về Sàn Mua Sắm */}
        <div className="seller-footer-actions">
          <Link to="/" className="btn-switch-to-marketplace">
            <FiArrowLeft /> Về Sàn Mua Sắm
          </Link>
          <a href="http://localhost:5173" target="_blank" rel="noreferrer" className="wms-core-link">
            🏭 Kho Vận WMS Core
          </a>
        </div>
      </aside>

      {/* Main Content Pane */}
      <div className="seller-main-wrapper">
        <header className="seller-top-header">
          <div className="store-header-info">
            <h2>{currentStore?.tenKho || 'Gian Hàng Của Bạn'}</h2>
            <span className="store-type-tag">Cửa Hàng Bán Lẻ Trên Sàn (B2B2C)</span>
          </div>

          <div className="seller-header-right">
            <div className="seller-user-badge">
              <div className="seller-avatar">CH</div>
              <div className="seller-details">
                <strong>Chủ Cửa Hàng</strong>
                <small>Store ID #{currentStoreId}</small>
              </div>
            </div>
          </div>
        </header>

        <main className="seller-content-body">
          <Outlet context={{ storeId: Number(currentStoreId), currentStore }} />
        </main>
      </div>
    </div>
  );
};

export default SellerLayout;
