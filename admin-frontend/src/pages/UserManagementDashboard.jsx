import React, { useState } from 'react';
import { FiUsers, FiShoppingBag, FiBriefcase, FiShield } from 'react-icons/fi';
import CustomerManagement from './CustomerManagement';
import StaffManagement from './StaffManagement';
import './UserManagement.css'; 

const UserManagementDashboard = () => {
  // Quản lý trạng thái tab đang chọn
  const [activeTab, setActiveTab] = useState('customers');

  return (
    <div className="user-management-page">
      {/* Header dùng chung */}
      <div className="page-header-flex">
        <div className="title-group">
          <h1>
            Quản Lý Người Dùng & Phân Quyền
            <span className="tag-badge-project">DỮ LIỆU ĐỒ ÁN</span>
          </h1>
          <p className="subtitle">
            Hệ thống quản lý tài khoản người dùng mua hàng và phân quyền nhân sự.
          </p>
        </div>
        <div className="project-meta-badge">
          🛡️ Đồ án TMĐT CTUT • Mã đề tài: <strong>DA-TMDT-04</strong>
        </div>
      </div>

      {/* Thống kê dùng chung */}
      <div className="user-stats-grid">
        <div className="user-stat-card">
          <div className="stat-info">
            <div className="stat-label">Tổng tài khoản</div>
            <div className="stat-number">1.250</div>
            <div className="stat-sub">Toàn bộ dữ liệu hệ thống</div>
          </div>
          <div className="stat-icon-wrapper red-light"><FiUsers size={22} /></div>
        </div>

        <div className="user-stat-card">
          <div className="stat-info">
            <div className="stat-label">Khách hàng</div>
            <div className="stat-number" style={{ color: '#d63031' }}>1.238</div>
            <div className="stat-sub">99.04% tài khoản người mua</div>
          </div>
          <div className="stat-icon-wrapper red-light"><FiShoppingBag size={22} /></div>
        </div>

        <div className="user-stat-card">
          <div className="stat-info">
            <div className="stat-label">Nhân viên</div>
            <div className="stat-number">12</div>
            <div className="stat-sub">Nội bộ quản trị & vận hành</div>
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
          <FiUsers size={16} /> Danh sách khách hàng (1.238) ●
        </button>
        <button 
          className={`tab-item ${activeTab === 'staff' ? 'active' : ''}`}
          onClick={() => setActiveTab('staff')}
        >
          <FiBriefcase size={16} /> Danh sách nhân viên (12) ●
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
        {activeTab === 'customers' && <CustomerManagement />}
        {activeTab === 'staff' && <StaffManagement />}
        {activeTab === 'logs' && (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: '#868e96' }}>
            <FiShield size={48} style={{ marginBottom: '12px', color: '#d63031' }} />
            <h3>Nhật Ký Đang Được Cập Nhật</h3>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagementDashboard;