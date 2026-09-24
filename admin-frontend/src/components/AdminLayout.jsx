// src/components/AdminLayout.jsx
import React, { useContext } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { FiPieChart, FiUsers, FiTrendingUp, FiLogOut } from 'react-icons/fi';
import './AdminLayout.css';

const AdminLayout = () => {
  // Lấy dữ liệu user thực tế và hàm logout từ AuthContext
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

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
          
          {/* 1. Quản lý tài chính */}
          <Link 
            to="/finance" 
            className={`menu-item ${location.pathname.includes('finance') ? 'active' : ''}`}
          >
            <FiPieChart size={18} />
            <span>Quản lý tài chính</span>
          </Link>

          {/* 2. Quản lý người dùng (Đã cập nhật sang /user-management) */}
          <Link 
            to="/user-management" 
            className={`menu-item ${location.pathname.includes('user-management') ? 'active' : ''}`}
          >
            <FiUsers size={18} />
            <span>Quản lý người dùng</span>
          </Link>

          {/* 3. Báo cáo chiến lược (Đã cập nhật sang /strategic-report) */}
          <Link 
            to="/strategic-report" 
            className={`menu-item ${location.pathname.includes('strategic-report') ? 'active' : ''}`}
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
          <div className="breadcrumb">
            Cổng Quản Trị / <span>Bảng điều khiển</span>
          </div>

          <div className="user-profile-section">
            <span className="status-badge">• {user?.status || 'TRỰC TUYẾN'}</span>
            
            <div className="user-info">
              <p className="user-name">{user?.name || 'Chưa đăng nhập'}</p>
              <p className="user-role">{user?.role || 'Quản trị viên'}</p>
            </div>

            <div className="user-avatar">
              {user?.avatar || user?.name?.charAt(0) || 'A'}
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