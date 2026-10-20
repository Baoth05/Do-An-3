// src/pages/UserManagement/UserManagementDashboard.jsx
import React, { useState, useEffect } from 'react';
import { FiUsers, FiShoppingBag, FiBriefcase, FiShield } from 'react-icons/fi';
import CustomerManagement from './CustomerManagement';
import StaffManagement from './StaffManagement';
import { userService } from '../services/userService'; // Lưu ý đường dẫn import userService
import './UserManagement.css'; 

const UserManagementDashboard = () => {
  const [activeTab, setActiveTab] = useState('customers');
  
  // 1. Chỉnh sửa giá trị khởi tạo về 0 (Dữ liệu thật lúc chưa gọi API là 0)
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCustomers: 0,
    totalStaff: 0
  });

  // 2. Thêm state loading để hiển thị thân thiện hơn khi đang lấy dữ liệu
  const [isStatsLoading, setIsStatsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsStatsLoading(true);
        // Gọi API lấy dữ liệu thật
        const data = await userService.getStats();
        
        // Nếu API trả về dữ liệu thành công, cập nhật vào state
        if (data) {
          setStats({
            totalUsers: data.totalUsers || 0,
            totalCustomers: data.totalCustomers || 0,
            totalStaff: data.totalStaff || 0
          });
        }
      } catch (err) {
        console.error('Lỗi khi tải thống kê từ backend:', err);
        // Tùy chọn: Bạn có thể set một thông báo lỗi ở đây nếu muốn
      } finally {
        // Hoàn thành quá trình tải
        setIsStatsLoading(false);
      }
    };

    fetchStats();
  }, []);

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

      {/* Thống kê dùng chung từ Backend */}
      <div className="user-stats-grid">
        <div className="user-stat-card">
          <div className="stat-info">
            <div className="stat-label">Tổng tài khoản</div>
            <div className="stat-number">
              {isStatsLoading ? '...' : stats.totalUsers.toLocaleString()}
            </div>
            <div className="stat-sub">Toàn bộ dữ liệu hệ thống</div>
          </div>
          <div className="stat-icon-wrapper red-light"><FiUsers size={22} /></div>
        </div>

        <div className="user-stat-card">
          <div className="stat-info">
            <div className="stat-label">Khách hàng</div>
            <div className="stat-number" style={{ color: '#d63031' }}>
              {isStatsLoading ? '...' : stats.totalCustomers.toLocaleString()}
            </div>
            <div className="stat-sub">Tài khoản người mua hàng</div>
          </div>
          <div className="stat-icon-wrapper red-light"><FiShoppingBag size={22} /></div>
        </div>

        <div className="user-stat-card">
          <div className="stat-info">
            <div className="stat-label">Nhân viên</div>
            <div className="stat-number">
              {isStatsLoading ? '...' : stats.totalStaff.toLocaleString()}
            </div>
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
          <FiUsers size={16} /> Danh sách khách hàng ({isStatsLoading ? '...' : stats.totalCustomers}) ●
        </button>
        <button 
          className={`tab-item ${activeTab === 'staff' ? 'active' : ''}`}
          onClick={() => setActiveTab('staff')}
        >
          <FiBriefcase size={16} /> Danh sách nhân viên ({isStatsLoading ? '...' : stats.totalStaff}) ●
        </button>
        <button 
          className={`tab-item ${activeTab === 'logs' ? 'active' : ''}`}
          onClick={() => setActiveTab('logs')}
        >
          🛡️ Nhật ký phân quyền & bảo mật
        </button>
      </div>

      {/* Khu vực render Component con */}
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