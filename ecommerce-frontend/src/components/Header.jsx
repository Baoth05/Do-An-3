// src/components/Header.jsx
import { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import { FiShoppingCart, FiSearch, FiShoppingBag, FiExternalLink, FiUser, FiTag } from 'react-icons/fi';
import './Header.css';

const Header = ({ onSearch }) => {
  const { totalQuantity } = useContext(CartContext);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchTerm);
    } else {
      navigate(`/?q=${encodeURIComponent(searchTerm)}`);
    }
  };

  return (
    <header className="market-header">
      {/* Top Banner Thông Báo */}
      <div className="top-banner">
        <div className="container top-banner-content">
          <span>🔥 Siêu Hội Mua Sắm CTUT Gear - Miễn Phí Vận Chuyển Toàn Quốc Cho Đơn Từ 200.000đ!</span>
          <div className="top-banner-links">
            <a href="http://localhost:5173" target="_blank" rel="noreferrer" className="wms-portal-link">
              <FiExternalLink size={13} /> Kênh Quản Trị & Kho Bãi (WMS Portal)
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
              placeholder="Tìm kiếm sản phẩm, thương hiệu, hoặc tên gian hàng..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button type="submit" className="btn-search">
              <FiSearch size={18} />
            </button>
          </form>

          {/* Action Icons */}
          <div className="nav-actions">
            <Link to="/vouchers" className="nav-link-btn" title="Khuyến mãi">
              <FiTag size={18} />
              <span>Mã Giảm Giá</span>
            </Link>

            <Link to="/cart" className="cart-btn" title="Giỏ hàng đa shop">
              <div className="cart-icon-wrapper">
                <FiShoppingCart size={22} />
                {totalQuantity > 0 && <span className="cart-badge">{totalQuantity}</span>}
              </div>
              <span className="cart-label">Giỏ Hàng</span>
            </Link>

            <div className="user-profile-btn">
              <div className="avatar-circle">
                <FiUser size={18} />
              </div>
              <div className="user-info-text">
                <span className="user-name">Khách Hàng</span>
                <span className="user-role">CUSTOMER</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

