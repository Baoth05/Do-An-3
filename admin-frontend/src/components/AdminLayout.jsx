// src/components/AdminLayout.jsx
import React, { useContext } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { FiPieChart, FiUsers, FiTrendingUp, FiLogOut, FiFileText } from 'react-icons/fi';
import logoImage from '../assets/Glossy Red and White Gaming Logo.png';
import './AdminLayout.css';

const AdminLayout = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // 🌟 Hàm chuyển đổi đường dẫn URL thành Tên trang để hiển thị Breadcrumb
  const getPageTitle = (pathname) => {
    if (pathname.includes('/supply-contracts')) return 'Duyệt hợp đồng cung ứng';
    if (pathname.includes('/finance')) return 'Quản lý tài chính';
    if (pathname.includes('/user-management')) return 'Quản lý người dùng & phân quyền';
    if (pathname.includes('/strategic-report')) return 'Báo cáo chiến lược';
    return 'Bảng điều khiển'; // Mặc định
  };

  // 🌟 Xử lý hiển thị thông tin thực tế từ Backend (Bao quát các biến hoTen, fullName, name...)
  const displayUserName = user?.hoTen || user?.fullName || user?.name || user?.taiKhoan || 'Quản trị viên';
  
  // Xử lý hiển thị vai trò (đọc mảng roles hoặc chuỗi role từ API)
  let displayRole = 'Quản trị hệ thống';
  if (user?.roles && user.roles.length > 0) {
    const r = user.roles[0];
    const roleStr = (typeof r === 'string' ? r : (r.name || r.authority || '')).toUpperCase();
    if (roleStr.includes('ADMIN')) displayRole = 'Quản trị viên (ADMIN)';
    else if (roleStr.includes('THUKHO')) displayRole = 'Thủ kho';
    else if (roleStr.includes('NVKHO')) displayRole = 'Nhân viên kho';
    else displayRole = roleStr.replace('ROLE_', '');
  } else if (user?.role) {
    displayRole = user.role === 'ADMIN' ? 'Quản trị viên (ADMIN)' : user.role;
  }

  // Chữ cái đầu tiên của tên dùng làm Avatar
  const avatarChar = displayUserName.charAt(0).toUpperCase();

  return (
    <div className="admin-layout">
      {/* Sidebar bên trái: Theme sáng, hiện đại, dễ nhìn */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <img src={logoImage} alt="CTUT Gear Logo" className="sidebar-logo-img" />
          <div className="logo-text">
            <h2>CTUT GEAR</h2>
            <span className="logo-subtext">HỆ THỐNG QUẢN TRỊ</span>
          </div>
        </div>

        <nav className="sidebar-menu">
          <div className="menu-label">DANH MỤC QUẢN TRỊ</div>
          
          <Link 
            to="/supply-contracts" 
            className={`menu-item ${location.pathname.includes('/supply-contracts') ? 'active' : ''}`}
          >
            <FiFileText size={18} className="menu-icon" />
            <span>Duyệt hợp đồng cung ứng</span>
          </Link>

          <Link 
            to="/finance" 
            className={`menu-item ${location.pathname.includes('/finance') ? 'active' : ''}`}
          >
            <FiPieChart size={18} className="menu-icon" />
            <span>Quản lý tài chính</span>
          </Link>

          <Link 
            to="/user-management" 
            className={`menu-item ${location.pathname.includes('/user-management') ? 'active' : ''}`}
          >
            <FiUsers size={18} className="menu-icon" />
            <span>Quản lý người dùng</span>
          </Link>

          <Link 
            to="/strategic-report" 
            className={`menu-item ${location.pathname.includes('/strategic-report') ? 'active' : ''}`}
          >
            <FiTrendingUp size={18} className="menu-icon" />
            <span>Báo cáo chiến lược</span>
          </Link>
        </nav>

        <div className="sidebar-footer">
          <div className="system-status">
            <span className="dot"></span>
            <div>
              <strong>HỆ THỐNG ĐANG HOẠT ĐỘNG</strong>
              <p>Phân hệ Quản trị viên cấp cao</p>
              <small>CTUT Gear • Port 8080 Gateway</small>
            </div>
          </div>
        </div>
      </aside>

      {/* Cột Nội dung bên phải */}
      <div className="main-content">
        <header className="top-header">
          {/* Breadcrumb động */}
          <div className="breadcrumb">
            Cổng Quản Trị / <span>{getPageTitle(location.pathname)}</span>
          </div>

          <div className="user-profile-section">
            <span className="status-badge">
              <span className="badge-dot"></span>
              TRỰC TUYẾN
            </span>
            
            {/* Hiển thị thông tin người dùng */}
            <div className="user-info">
              <p className="user-name">{displayUserName}</p>
              <p className="user-role">{displayRole}</p>
            </div>

            <div className="user-avatar" title={displayUserName}>
              {avatarChar}
            </div>

            <button className="logout-btn" onClick={handleLogout} title="Đăng xuất khỏi hệ thống">
              <FiLogOut size={16} />
              <span className="logout-text">Thoát</span>
            </button>
          </div>
        </header>

        <main className="content-area">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
