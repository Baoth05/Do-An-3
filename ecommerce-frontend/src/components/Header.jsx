// src/components/Header.jsx
import { useContext, useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import { authService } from '../services/authService';
import {
  FiShoppingCart, FiSearch, FiShoppingBag, FiExternalLink,
  FiUser, FiTag, FiPackage, FiChevronDown, FiLogOut, FiLogIn, FiUserPlus
} from 'react-icons/fi';
import './Header.css';

const Header = ({ onSearch }) => {
  const { totalQuantity } = useContext(CartContext);
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  // Kiểm tra phiên đăng nhập của Khách Hàng & Chủ Shop
  const customer = authService.getCurrentCustomer();
  const seller = authService.getCurrentSeller();

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
    setShowUserDropdown(false);
    navigate('/login');
  };

  // Ẩn Header sàn khi đang ở các trang đăng ký / đăng nhập chuyên biệt
  const authRoutes = ['/login', '/register', '/seller/login', '/seller/register'];
  if (authRoutes.includes(location.pathname)) {
    return null;
  }

  return (
    <header className="market-header">
      {/* Top Banner Thông Báo */}
      <div className="top-banner">
        <div className="container top-banner-content">
          <span>🔥 Siêu Hội Mua Sắm CTUT Gear - Miễn Phí Vận Chuyển Toàn Quốc Cho Đơn Từ 200.000đ!</span>
          <div className="top-banner-links">
            <Link 
              to={seller ? "/seller" : "/seller/login"} 
              className="seller-channel-link"
              title="Cổng dành cho Đối tác & Chủ Shop"
            >
              <FiShoppingBag size={13} /> {seller ? `Kênh Người Bán (${seller.tenCuaHang || seller.taiKhoan})` : 'Kênh Người Bán'}
            </Link>
            <span className="divider-bar">|</span>
            <a href="http://localhost:5173" target="_blank" rel="noreferrer" className="wms-portal-link">
              <FiExternalLink size={13} /> Kênh Quản Trị & Kho Bãi (WMS)
            </a>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="main-nav">
        <div className="container nav-content">
          {/* Logo */}
          <Link to="/" className="market-logo">
            <div className="logo-badge">
              <FiShoppingBag size={22} />
            </div>
            <div className="logo-text">
              <h1>CTUT GEAR</h1>
              <span>Marketplace Đa Gian Hàng</span>
            </div>
          </Link>

          {/* Search Box */}
          <form className="search-form" onSubmit={handleSearchSubmit}>
            <input
              type="text"
              placeholder="Tìm kiếm theo tên sản phẩm, mã SKU, danh mục, gian hàng..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button type="submit" className="btn-search" title="Tìm kiếm">
              <FiSearch size={18} />
            </button>
          </form>

          {/* Action Icons */}
          <div className="nav-actions">
            <Link to="/vouchers" className="nav-link-btn" title="Khuyến mãi & Voucher">
              <FiTag size={18} />
              <span>Mã Giảm Giá</span>
            </Link>

            <Link to="/my-orders" className="nav-link-btn" title="Lịch sử đơn mua">
              <FiPackage size={18} />
              <span>Đơn Mua</span>
            </Link>

            <Link to="/cart" className="cart-btn" title="Giỏ hàng đa shop">
              <div className="cart-icon-wrapper">
                <FiShoppingCart size={22} />
                {totalQuantity > 0 && <span className="cart-badge">{totalQuantity}</span>}
              </div>
              <span className="cart-label">Giỏ Hàng</span>
            </Link>

            {/* User Profile or Guest Auth Buttons */}
            {customer ? (
              <div
                className="user-profile-btn"
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                tabIndex={0}
                onBlur={() => setTimeout(() => setShowUserDropdown(false), 250)}
              >
                <div className="avatar-circle">
                  <FiUser size={18} />
                </div>
                <div className="user-info-text">
                  <span className="user-name">{customer.hoTen || customer.taiKhoan}</span>
                  <span className="user-role">KHÁCH HÀNG <FiChevronDown size={11} /></span>
                </div>

                {showUserDropdown && (
                  <div className="user-dropdown-menu">
                    <div className="dropdown-header">
                      <strong>{customer.hoTen || customer.taiKhoan}</strong>
                      <small>{customer.email || `${customer.taiKhoan}@ctutgear.vn`}</small>
                    </div>
                    <div className="dropdown-divider"></div>
                    <Link to="/my-orders" className="dropdown-item">
                      <FiPackage size={16} /> Đơn Mua Của Tôi
                    </Link>
                    <Link to="/vouchers" className="dropdown-item">
                      <FiTag size={16} /> Kho Voucher Toàn Sàn
                    </Link>
                    <Link to="/cart" className="dropdown-item">
                      <FiShoppingCart size={16} /> Giỏ Hàng ({totalQuantity})
                    </Link>
                    <div className="dropdown-divider"></div>
                    <Link to={seller ? "/seller" : "/seller/login"} className="dropdown-item seller-menu-item">
                      <FiShoppingBag size={16} /> 🏪 Kênh Người Bán (Chủ Shop)
                    </Link>
                    <a href="http://localhost:5173" target="_blank" rel="noreferrer" className="dropdown-item">
                      <FiExternalLink size={16} /> Cổng Quản Trị Kho (WMS)
                    </a>
                    <div className="dropdown-divider"></div>
                    <button 
                      type="button" 
                      className="dropdown-item logout-item"
                      onClick={handleCustomerLogout}
                    >
                      <FiLogOut size={16} /> Đăng Xuất Khách Hàng
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="guest-auth-actions">
                <Link to="/login" className="btn-auth-login">
                  <FiLogIn size={15} /> Đăng Nhập
                </Link>
                <Link to="/register" className="btn-auth-register">
                  <FiUserPlus size={15} /> Đăng Ký
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
