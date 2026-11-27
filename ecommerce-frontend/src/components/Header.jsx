// src/components/Header.jsx
import { useContext, useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import { authService } from '../services/authService';
import {
  FiShoppingCart, FiSearch, FiShoppingBag,
  FiUser, FiTag, FiPackage, FiChevronDown, FiLogOut, FiLogIn, FiUserPlus,
  FiCreditCard, FiMessageSquare, FiBell, FiHelpCircle
} from 'react-icons/fi';

// 1. IMPORT LOGO CỦA BẠN TỪ THƯ MỤC ASSETS
import ctutLogo from '../assets/Glossy Red and White Gaming Logo.png';

import './Header.css';

const Header = ({ onSearch }) => {
  // ... (Giữ nguyên toàn bộ logic xử lý hook, state và các hàm chức năng cũ)
  const { totalQuantity } = useContext(CartContext);
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const [customer, setCustomer] = useState(() => authService.getCurrentCustomer());
  const isSeller = Boolean(
    customer && (
      customer.isSeller ||
      customer.vaiTro === 'STORE_OWNER' ||
      customer.vaiTro === 'SELLER' ||
      !!localStorage.getItem(`seller_store_${customer.taiKhoan}`)
    )
  );

  useEffect(() => {
    const handleUserUpdate = () => {
      setCustomer(authService.getCurrentCustomer());
    };

    handleUserUpdate();

    window.addEventListener('customer-user-updated', handleUserUpdate);
    window.addEventListener('storage', handleUserUpdate);
    return () => {
      window.removeEventListener('customer-user-updated', handleUserUpdate);
      window.removeEventListener('storage', handleUserUpdate);
    };
  }, [location.pathname]);

  useEffect(() => {
    const q = searchParams.get('q');
    if (q !== null) {
      setSearchTerm(q);
    }
  }, [searchParams]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchTerm);
    } else {
      if (searchTerm.trim()) {
        navigate(`/?q=${encodeURIComponent(searchTerm.trim())}`);
      } else {
        navigate('/');
      }
    }
  };

  const handleCustomerLogout = () => {
    authService.logoutCustomer();
    setCustomer(null);
    setShowUserDropdown(false);
    navigate('/login');
  };

  const authRoutes = ['/login', '/register', '/seller/login', '/seller/register'];
  if (authRoutes.includes(location.pathname)) {
    return null;
  }

  return (
    <header className="market-header shopee-theme">
      {/* Top Navbar */}
      <div className="top-navbar">
        <div className="container nav-content-top">
          <div className="nav-left">
            <Link to="/seller" className="nav-link-top">Kênh Người Bán</Link>
            <span className="divider"></span>
            <Link to="#" className="nav-link-top">Tải ứng dụng</Link>
            <span className="divider"></span>
            <span className="nav-link-top">Kết nối</span>
          </div>

          <div className="nav-right">
            <Link to="/vouchers" className="nav-link-top" title="Khuyến mãi & Voucher">
              <FiTag size={16} /> Mã Giảm Giá
            </Link>
            <Link to="/my-orders" className="nav-link-top" title="Lịch sử đơn mua">
              <FiPackage size={16} /> Đơn Mua
            </Link>
            <Link to="#" className="nav-link-top"><FiBell size={16} /> Thông Báo</Link>
            <Link to="#" className="nav-link-top"><FiHelpCircle size={16} /> Hỗ Trợ</Link>

            {customer ? (
              <div
                className="user-profile-wrapper"
                onMouseEnter={() => setShowUserDropdown(true)}
                onMouseLeave={() => setShowUserDropdown(false)}
              >
                <div className="user-profile-trigger">
                  <FiUser size={16} />
                  <span className="user-name-top">{customer.hoTen || customer.taiKhoan}</span>
                </div>

                {showUserDropdown && (
                  <div className="user-dropdown-menu">
                    <Link to="/profile" className="dropdown-item">Tài Khoản Của Tôi</Link>
                    <Link to="/my-orders" className="dropdown-item">Đơn Mua</Link>
                    <Link to="/profile" state={{ activeTab: 'seller' }} className="dropdown-item">
                      {isSeller ? 'Gian Hàng Của Tôi' : 'Mở Gian Hàng Bán Hàng'}
                    </Link>
                    <button
                      type="button"
                      className="dropdown-item logout-item"
                      onClick={handleCustomerLogout}
                    >
                      Đăng Xuất
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="guest-auth-actions-top">
                <Link to="/register" className="nav-link-top">Đăng Ký</Link>
                <span className="divider"></span>
                <Link to="/login" className="nav-link-top">Đăng Nhập</Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="main-header">
        <div className="container nav-content-main">
          {/* Logo Section */}
          <Link to="/" className="market-logo">
            <div className="logo-badge">
              {/* 2. SỬ DỤNG THẺ IMG ĐỂ HIỂN THỊ LOGO CỦA BẠN THAY VÌ ICON */}
              <img src={ctutLogo} alt="CTUT GEAR Logo" className="custom-brand-logo" />
            </div>
            <div className="logo-text">
              <h1>CtutGear</h1>
            </div>
          </Link>

          {/* Search Box */}
          <div className="search-section">
            <form className="search-form" onSubmit={handleSearchSubmit}>
              <input
                type="text"
                placeholder="Tìm kiếm theo tên sản phẩm, mã SKU, danh mục..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button type="submit" className="btn-search" title="Tìm kiếm">
                <FiSearch size={20} />
              </button>
            </form>
            <div className="search-suggestions">
              <Link to="/?q=laptop">Laptop Gaming</Link>
              <Link to="/?q=chuot">Chuột Không Dây</Link>
              <Link to="/?q=ban+phim">Bàn Phím Cơ</Link>
              <Link to="/?q=man+hinh">Màn Hình 144Hz</Link>
            </div>
          </div>

          {/* Cart */}
          <div className="cart-section">
            <Link to="/cart" className="cart-btn" title="Giỏ hàng đa shop">
              <div className="cart-icon-wrapper">
                <FiShoppingCart size={32} />
                {totalQuantity > 0 && <span className="cart-badge">{totalQuantity}</span>}
              </div>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;