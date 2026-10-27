// src/components/AdminLayout.jsx
import React, { useContext } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { FiPieChart, FiUsers, FiTrendingUp, FiLogOut } from 'react-icons/fi';
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
    if (pathname.includes('/finance')) return 'Quản lý tài chính';
    if (pathname.includes('/user-management')) return 'Quản lý người dùng';
    if (pathname.includes('/strategic-report')) return 'Báo cáo chiến lược';
    return 'Bảng điều khiển'; // Mặc định
  };

  // 🌟 Xử lý hiển thị thông tin thực tế từ Backend (Bao quát các biến hoTen, fullName, name...)
  const displayUserName = user?.hoTen || user?.fullName || user?.name || user?.taiKhoan || 'Người dùng';
  
  // Xử lý hiển thị vai trò (đọc mảng roles hoặc chuỗi role từ API)
  let displayRole = 'Chưa phân quyền';
  if (user?.roles && user.roles.length > 0) {
    const r = user.roles[0];
    const roleStr = (typeof r === 'string' ? r : (r.name || r.authority || '')).toUpperCase();
    if (roleStr.includes('ADMIN')) displayRole = 'Quản trị viên';
    else if (roleStr.includes('THUKHO')) displayRole = 'Thủ kho';
    else if (roleStr.includes('NVKHO')) displayRole = 'Nhân viên kho';
    else displayRole = roleStr.replace('ROLE_', '');
  } else if (user?.role) {
    displayRole = user.role;
  }

  // Chữ cái đầu tiên của tên dùng làm Avatar
  const avatarChar = displayUserName.charAt(0).toUpperCase();

  return (
    <div className="admin-layout">
      {/* Sidebar bên trái */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-icon">🔥</div>
          <div className="logo-text">
            <h2>CTUT GEAR ADMIN</h2>
            <span>ĐỒ ÁN TMĐT</span>
          </div>
        </div>

        <nav className="sidebar-menu">
          <div className="menu-label">BẢNG ĐIỀU KHIỂN</div>
          
          <Link 
            to="/finance" 
            className={`menu-item ${location.pathname.includes('/finance') ? 'active' : ''}`}
          >
            <FiPieChart size={18} />
            <span>Quản lý tài chính</span>
          </Link>

          <Link 
            to="/user-management" 
            className={`menu-item ${location.pathname.includes('/user-management') ? 'active' : ''}`}
          >
            <FiUsers size={18} />
            <span>Quản lý người dùng</span>
          </Link>

          <Link 
            to="/strategic-report" 
            className={`menu-item ${location.pathname.includes('/strategic-report') ? 'active' : ''}`}
          >
            <FiTrendingUp size={18} />
            <span>Báo cáo chiến lược</span>
          </Link>
        </nav>

        <div className="sidebar-footer">
          <div className="system-status">
            <span className="dot"></span>
            <div>
              <strong>HỆ THỐNG HOẠT ĐỘNG</strong>
              <p>Đồ án Thương Mại Điện Tử CTUT</p>
              <small>Phiên bản 1.0.4 - 2026</small>
            </div>
          </div>
        </div>
      </aside>

      {/* Cột Nội dung bên phải */}
      <div className="main-content">
        <header className="top-header">
          {/* 🌟 Cập nhật Breadcrumb động */}
          <div className="breadcrumb">
            Cổng Quản Trị / <span>{getPageTitle(location.pathname)}</span>
          </div>

          <div className="user-profile-section">
            <span className="status-badge">
              <span className="status-dot"></span>
              TRỰC TUYẾN
            </span>
            
            {/* 🌟 Hiển thị thông tin thực */}
            <div className="user-info">
              <p className="user-name">{displayUserName}</p>
              <p className="user-role">{displayRole}</p>
            </div>

            <div className="user-avatar">
              {avatarChar}
            </div>

            <button className="logout-btn" onClick={handleLogout} title="Đăng xuất">
              <FiLogOut size={16} />
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