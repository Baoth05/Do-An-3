/**
 * ==============================================================================
 * Module: UserManagementDashboard.jsx
 * Mô tả: Bảng điều khiển quản lý toàn diện người dùng hệ thống (Admin Dashboard).
 * Chức năng: Thống kê số lượng khách hàng, nhân sự, admin, và chuyển đổi tab quản trị.
 * ==============================================================================
 */
import React, { useState, useEffect } from 'react';
import { FiUsers, FiShoppingBag, FiBriefcase, FiShield, FiRefreshCw } from 'react-icons/fi';
import CustomerManagement from './CustomerManagement';
import StaffManagement from './StaffManagement';
import { userService } from '../services/userService';
import './UserManagement.css'; 

const UserManagementDashboard = () => {
  const [activeTab, setActiveTab] = useState('customers');
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCustomers: 0,
    totalStaff: 0,
  });
  const [isLoading, setIsLoading] = useState(false);

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      const data = await userService.getStats();
      if (data) {
        setStats(data);
      }
    } catch (e) {
      console.warn('Lỗi lấy thống kê người dùng:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="user-management-page">
      {/* Header dùng chung */}
      <div className="page-header-flex">
        <div className="title-group">
          <h1>
            Quản Lý Người Dùng & Phân Quyền
            <span className="tag-badge-project">DỮ LIỆU THỰC TẾ</span>
          </h1>
          <p className="subtitle">
            Hệ thống quản lý tài khoản người dùng mua hàng và phân quyền nhân sự kết nối Backend.
          </p>
        </div>
        <div className="project-meta-badge">
          <button 
            onClick={fetchStats} 
            disabled={isLoading}
            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', color: 'inherit' }}
          >
            <FiRefreshCw className={isLoading ? 'spin-icon' : ''} /> Đồng bộ dữ liệu
          </button>
        </div>
      </div>

      {/* Thống kê từ Database */}
      <div className="user-stats-grid">
        <div className="user-stat-card">
          <div className="stat-info">
            <div className="stat-label">Tổng tài khoản</div>
            <div className="stat-number">{stats.totalUsers}</div>
            <div className="stat-sub">Toàn bộ dữ liệu hệ thống</div>
          </div>
          <div className="stat-icon-wrapper red-light"><FiUsers size={22} /></div>
        </div>

        <div className="user-stat-card">
          <div className="stat-info">
            <div className="stat-label">Khách hàng</div>
            <div className="stat-number" style={{ color: '#d63031' }}>{stats.totalCustomers}</div>
            <div className="stat-sub">Tài khoản người mua hàng</div>
          </div>
          <div className="stat-icon-wrapper red-light"><FiShoppingBag size={22} /></div>
        </div>

        <div className="user-stat-card">
          <div className="stat-info">
            <div className="stat-label">Nhân sự nội bộ</div>
            <div className="stat-number">{stats.totalStaff}</div>
            <div className="stat-sub">Quản trị & Thủ kho vận hành</div>
          </div>
          <div className="stat-icon-wrapper orange-light"><FiBriefcase size={22} /></div>
        </div>
      </div>

      {/* Thanh điều hướng Tabs */}
      <div className="tabs-navigation">
        <button 
          className={`tab-item ${activeTab === 'customers' ? 'active' : ''}`}
          onClick={() => setActiveTab('customers')}
        >
          <FiUsers size={16} /> Danh sách khách hàng ({stats.totalCustomers})
        </button>
        <button 
          className={`tab-item ${activeTab === 'staff' ? 'active' : ''}`}
          onClick={() => setActiveTab('staff')}
        >
          <FiBriefcase size={16} /> Danh sách nhân viên ({stats.totalStaff})
        </button>
        <button 
          className={`tab-item ${activeTab === 'logs' ? 'active' : ''}`}
          onClick={() => setActiveTab('logs')}
        >
          🛡️ Nhật ký phân quyền & bảo mật
        </button>
      </div>

      {/* Khu vực render Component con tùy theo Tab */}
      <div className="content-card-wrapper">
        {activeTab === 'customers' && <CustomerManagement onRefreshStats={fetchStats} />}
        {activeTab === 'staff' && <StaffManagement onRefreshStats={fetchStats} />}
        {activeTab === 'logs' && (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: '#868e96' }}>
            <FiShield size={48} style={{ marginBottom: '12px', color: '#d63031' }} />
            <h3>Nhật Ký Đang Được Cập Nhật Tự Động Từ Backend</h3>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagementDashboard;
