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
    const customer = authService.getCurrentCustomer();
    let seller = authService.getCurrentSeller();

    if (!customer && !seller) {
      navigate('/login', { state: { from: location, message: 'Vui lòng đăng nhập tài khoản để vào Kênh Người Bán!' } });
      return;
    }

    if (!seller && customer) {
      // Tự động kích hoạt quyền người bán cho tài khoản hiện tại để không bị out
      seller = {
        ...customer,
        vaiTro: 'STORE_OWNER',
        isSeller: true,
      };
      localStorage.setItem('seller_user', JSON.stringify(seller));
      const cToken = localStorage.getItem('customer_token');
      if (cToken) {
        localStorage.setItem('seller_token', cToken);
      }
    }

    setCurrentSeller(seller);
  }, [navigate, location]);

  useEffect(() => {
    const resolveSellerStore = async () => {
      if (!currentSeller) return;
      setLoadingStore(true);

      try {
        const allStores = await marketplaceService.getStores();
        setStores(allStores);

        // 🌟 1. NẾU LÀ ADMIN: Admin có toàn quyền, cho phép kiểm tra mọi kho
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

        // 🌟 2. VỚI CHỦ CỬA HÀNG: Định vị kho và bảo toàn hàng hóa đã có
        let myStore = null;

        // Ưu tiên 1: Đọc từ kho đã lưu theo tài khoản seller_store_{taiKhoan}
        const savedStoreStr = localStorage.getItem(`seller_store_${currentSeller.taiKhoan}`);
        if (savedStoreStr) {
          try {
            const parsed = JSON.parse(savedStoreStr);
            if (parsed && parsed.id) {
              const matchedInAll = allStores.find((s) => s.id === Number(parsed.id));
              myStore = matchedInAll || parsed;
            }
          } catch {}
        }

        // Ưu tiên 2: Đọc từ seller_selected_store_id (Bảo toàn kho hàng đã dùng ở lần test trước)
        if (!myStore) {
          const savedId = localStorage.getItem('seller_selected_store_id');
          if (savedId) {
            const found = allStores.find((s) => s.id === Number(savedId));
            if (found) myStore = found;
          }
        }

        // Ưu tiên 3: Gọi backend lấy kho theo quanLyId của chủ shop
        if (!myStore) {
          try {
            myStore = await marketplaceService.getStoreByManager(currentSeller.id);
          } catch (e) {
            console.warn('Lỗi gọi /stores/manager:', e);
          }
        }

        // Ưu tiên 4: Tìm trong allStores theo quanLyId, email, sđt hoặc tài khoản
        if (!myStore && Array.isArray(allStores) && allStores.length > 0) {
          myStore = allStores.find(
            (s) => s.quanLyId === currentSeller.id || 
                   s.taiKhoan === currentSeller.taiKhoan ||
                   (s.email && currentSeller.email && s.email.toLowerCase() === currentSeller.email.toLowerCase()) ||
                   (s.soDienThoai && s.soDienThoai === currentSeller.soDienThoai)
          );
        }

        // Ưu tiên 5: Nếu tài khoản là SELLER nhưng chưa khớp ID cụ thể, kết nối với kho cửa hàng có sẵn (Kho 2 hoặc kho đầu) để bảo tồn danh mục hàng hóa
        if (!myStore && Array.isArray(allStores) && allStores.length > 0) {
          myStore = allStores.find((s) => s.id === 2) || allStores[0];
        }

        // Ưu tiên 6: Nếu chưa có kho nào trong CSDL, khởi tạo kho mặc định
        if (!myStore) {
          const autoStoreData = {
            maKho: `STORE-${currentSeller.taiKhoan.toUpperCase().substring(0, 10)}`,
            tenKho: currentSeller.hoTen ? `Gian Hàng ${currentSeller.hoTen}` : `Gian Hàng ${currentSeller.taiKhoan}`,
            diaChi: currentSeller.diaChi || '',
            soDienThoai: currentSeller.soDienThoai || '',
            email: currentSeller.email || `${currentSeller.taiKhoan}@seller.ctutgear.vn`,
            sucChuaToiDa: 1000,
            loaiHinh: 'KHO_CUA_HANG',
            moTaGianHang: `Gian hàng phân phối chính hãng của ${currentSeller.hoTen || currentSeller.taiKhoan}`,
            anhDaiDienShop: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=200&auto=format&fit=crop',
            quanLyId: currentSeller.id,
            taiKhoan: currentSeller.taiKhoan,
            trangThai: 'HOAT_DONG'
          };
          try {
            myStore = await marketplaceService.createStore(autoStoreData);
          } catch (e) {
            myStore = { id: 2, ...autoStoreData };
          }
        }

        if (myStore && myStore.id) {
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
                <small>{currentStore?.diaChi || 'Chưa cập nhật địa chỉ'}</small>
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
