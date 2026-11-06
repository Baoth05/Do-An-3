// src/pages/Seller/SellerLayout.jsx
import { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { marketplaceService } from '../../services/marketplaceService';
import { authService } from '../../services/authService';
import { 
  FiHome, FiBox, FiShoppingBag, FiTag, FiSettings, 
  FiArrowLeft, FiCheckCircle, FiAlertCircle, FiFileText, FiPlusCircle, FiLogOut, FiUser, FiShield, FiLock 
} from 'react-icons/fi';
import './SellerLayout.css';

const SellerLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Bắt buộc đăng nhập mới được vào Kênh Người Bán
  const [currentSeller, setCurrentSeller] = useState(() => authService.getCurrentSeller());
  const [stores, setStores] = useState([]);
  const [currentStore, setCurrentStore] = useState(null);
  const [currentStoreId, setCurrentStoreId] = useState('');
  const [loadingStore, setLoadingStore] = useState(true);

  useEffect(() => {
    const seller = authService.getCurrentSeller();
    const ALLOWED_SELLER_ROLES = ['ADMIN', 'STORE_OWNER', 'SELLER', 'CHU_CUA_HANG', 'STORE_MANAGER'];
    const role = seller?.vaiTro ? seller.vaiTro.toUpperCase().replace('ROLE_', '') : '';

    if (!seller || !ALLOWED_SELLER_ROLES.includes(role)) {
      navigate('/seller/login');
    } else {
      setCurrentSeller(seller);
    }
  }, [navigate]);

  useEffect(() => {
    const resolveSellerStore = async () => {
      if (!currentSeller) return;
      setLoadingStore(true);

      try {
        const allStores = await marketplaceService.getStores();
        setStores(allStores);

        // 🌟 NẾU LÀ ADMIN: Admin có toàn quyền, cho phép kiểm tra mọi kho
        if (currentSeller.vaiTro === 'ADMIN') {
          const savedId = localStorage.getItem('seller_selected_store_id');
          const found = allStores.find((s) => s.id === Number(savedId)) || allStores[0];
          if (found) {
            setCurrentStore(found);
            setCurrentStoreId(String(found.id));
          }
          setLoadingStore(false);
          return;
        }

        // 🌟 VỚI CHỦ CỬA HÀNG: MỖI CHỦ CHỈ CÓ 1 KHO DUY NHẤT & CHỈ HIỆN KHO CỦA CHÍNH MÌNH
        // 1. Thử gọi backend lấy kho theo ID của chủ shop
        let myStore = await marketplaceService.getStoreByManager(currentSeller.id);

        // 2. Tìm trong danh sách kho xem kho nào có quanLyId hoặc email/tài khoản trùng khớp
        if (!myStore && allStores.length > 0) {
          myStore = allStores.find(
            (s) => s.quanLyId === currentSeller.id || 
                   (s.email && s.email.toLowerCase() === (currentSeller.email || '').toLowerCase()) ||
                   (s.soDienThoai && s.soDienThoai === currentSeller.soDienThoai)
          );
        }

        // 3. Tìm trong thông tin kho đã lưu khi đăng ký tài khoản này
        if (!myStore) {
          const savedStoreStr = localStorage.getItem(`seller_store_${currentSeller.taiKhoan}`);
          if (savedStoreStr) {
            try {
              myStore = JSON.parse(savedStoreStr);
            } catch {}
          }
        }

        // 4. Nếu vẫn chưa có kho riêng, tự động tạo kho cửa hàng mặc định duy nhất cho tài khoản này
        if (!myStore) {
          const autoStoreData = {
            maKho: `STORE-${currentSeller.taiKhoan.toUpperCase().substring(0, 10)}`,
            tenKho: currentSeller.hoTen ? `Gian Hàng ${currentSeller.hoTen}` : `Gian Hàng ${currentSeller.taiKhoan}`,
            diaChi: currentSeller.diaChi || 'Cần Thơ, Việt Nam',
            soDienThoai: currentSeller.soDienThoai || '0901234567',
            email: currentSeller.email || `${currentSeller.taiKhoan}@seller.ctutgear.vn`,
            sucChuaToiDa: 1000,
            loaiHinh: 'KHO_CUA_HANG',
            moTaGianHang: `Gian hàng phân phối chính hãng của ${currentSeller.hoTen || currentSeller.taiKhoan}`,
            anhDaiDienShop: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=200&auto=format&fit=crop',
            quanLyId: currentSeller.id,
            trangThai: 'HOAT_DONG'
          };
          myStore = await marketplaceService.createStore(autoStoreData);
        }

        if (myStore) {
          setCurrentStore(myStore);
          setCurrentStoreId(String(myStore.id));
          localStorage.setItem(`seller_store_${currentSeller.taiKhoan}`, JSON.stringify(myStore));
          localStorage.setItem('seller_selected_store_id', String(myStore.id));
        }
      } catch (err) {
        console.warn('Lỗi định vị kho của chủ shop:', err);
      } finally {
        setLoadingStore(false);
      }
    };

    resolveSellerStore();
  }, [currentSeller]);

  const handleAdminStoreChange = (newId) => {
    if (currentSeller?.vaiTro !== 'ADMIN') return;
    setCurrentStoreId(newId);
    localStorage.setItem('seller_selected_store_id', newId);
    const found = stores.find((s) => s.id === Number(newId));
    setCurrentStore(found);
  };

  const handleLogoutSeller = () => {
    authService.logoutSeller();
    navigate('/seller/login');
  };

  const navItems = [
    { path: '/seller', label: 'Tổng Quan', icon: <FiHome />, exact: true },
    { path: '/seller/contracts', label: 'Hợp Đồng Cung Ứng', icon: <FiFileText /> },
    { path: '/seller/products', label: 'Hàng Hóa & Đăng Bán', icon: <FiBox /> },
    { path: '/seller/orders', label: 'Quản Lý Đơn Hàng', icon: <FiShoppingBag /> },
    { path: '/seller/vouchers', label: 'Voucher Khuyến Mãi', icon: <FiTag /> },
    { path: '/seller/settings', label: 'Hồ Sơ Gian Hàng', icon: <FiSettings /> },
  ];

  if (!currentSeller) {
    return (
      <div className="seller-redirecting">
        <div className="spinner"></div>
        <p>Đang kiểm tra quyền truy cập Kênh Người Bán...</p>
      </div>
    );
  }

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

        {/* Khung Thông Tin Kho Riêng Duy Nhất Của Chủ Shop (Không có dropdown chuyển kho lung tung) */}
        <div className="seller-store-selector-box">
          <div className="selector-label-row">
            <label>
              <FiLock size={11} /> Kho Riêng Độc Lập Của Bạn:
            </label>
            <span className="owner-verified-pill">Chính Chủ</span>
          </div>

          {currentSeller.vaiTro === 'ADMIN' ? (
            // Nếu là Admin thì có quyền chuyển đổi để hỗ trợ các shop
            <div className="admin-store-switcher">
              <span className="admin-tag">ADMIN OVERRIDE</span>
              <select 
                value={currentStoreId} 
                onChange={(e) => handleAdminStoreChange(e.target.value)}
              >
                {stores.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.tenKho} (Mã: {s.maKho})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            // Chủ shop thông thường: Hiển thị duy nhất 1 kho của chính mình
            <div className="single-owner-store-card">
              <h4 className="store-locked-name">🏬 {currentStore?.tenKho || 'Đang tải kho...'}</h4>
              <div className="store-locked-meta">
                <span>Mã Kho: <strong>{currentStore?.maKho || `STORE-${currentStoreId}`}</strong></span>
                <span>ID: <strong>#{currentStoreId}</strong></span>
              </div>
              <div className="store-status-indicator">
                <span className="dot-green"></span>
                <small>{currentStore?.diaChi || 'Cần Thơ, Việt Nam'}</small>
              </div>
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

        {/* Footer Sidebar */}
        <div className="seller-sidebar-footer">
          <Link to="/" className="btn-back-market">
            <FiArrowLeft /> Về Sàn Mua Sắm
          </Link>
          <a href="http://localhost:5173" target="_blank" rel="noreferrer" className="btn-wms-link">
            🏢 Kho Tổng WMS
          </a>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="seller-main-wrapper">
        {/* Top Navbar Kênh Người Bán */}
        <header className="seller-top-navbar">
          <div className="navbar-left">
            <span className="store-badge-live">
              <span className="pulse-indicator"></span> 
              Kho Cửa Hàng: <strong>{currentStore?.tenKho || 'Đang kết nối kho'}</strong> 
              {currentStore?.maKho && ` (${currentStore.maKho})`}
            </span>
          </div>

          <div className="navbar-right">
            <div className="seller-user-badge">
              <div className="seller-user-avatar">
                <FiUser size={16} />
              </div>
              <div className="seller-user-info">
                <strong>{currentSeller.hoTen || currentSeller.taiKhoan}</strong>
                <span>
                  {currentSeller.vaiTro === 'ADMIN' ? 'QUẢN TRỊ VIÊN' : 'CHỦ GIAN HÀNG'} • ID #{currentSeller.id}
                </span>
              </div>
            </div>

            <button 
              className="btn-seller-logout" 
              onClick={handleLogoutSeller}
              title="Đăng xuất khỏi Kênh Người Bán"
            >
              <FiLogOut size={16} /> Đăng Xuất
            </button>
          </div>
        </header>

        {/* Dynamic Outlet Pages */}
        <main className="seller-content-body">
          <Outlet context={{ 
            storeId: currentStoreId, 
            currentStore, 
            currentSeller,
            stores 
          }} />
        </main>
      </div>
    </div>
  );
};

export default SellerLayout;
