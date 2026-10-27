/**
 * ==============================================================================
 * Module: CustomerManagement.jsx
 * Mô tả: Giao diện quản lý danh sách tài khoản khách hàng trên sàn E-commerce.
 * Chức năng: Tìm kiếm khách hàng, lọc trạng thái hoạt động, khóa/mở khóa tài khoản khách.
 * ==============================================================================
 */
import React, { useState, useEffect } from 'react';
import { FiSearch, FiSliders, FiEye, FiLock, FiUnlock, FiInfo, FiRefreshCw, FiUser } from 'react-icons/fi';
import { userService } from '../services/userService';

const CustomerManagement = ({ onRefreshStats }) => {
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Tất cả');
  const [isLoading, setIsLoading] = useState(false);

  const fetchCustomers = async () => {
    try {
      setIsLoading(true);
      const list = await userService.getCustomers(searchTerm);
      setCustomers(list || []);
    } catch (e) {
      console.warn('Lỗi lấy danh sách khách hàng:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [searchTerm]);

  const handleToggleStatus = async (user) => {
    const action = user.trangThai === false ? 'mở khóa' : 'khóa';
    if (window.confirm(`Bạn có chắc chắn muốn ${action} tài khoản "${user.taiKhoan}"?`)) {
      try {
        await userService.toggleUserStatus(user.id);
        alert(`Đã ${action} tài khoản thành công!`);
        fetchCustomers();
        if (onRefreshStats) onRefreshStats();
      } catch (err) {
        alert('Lỗi thay đổi trạng thái: ' + (err.response?.data || err.message));
      }
    }
  };

  const filteredCustomers = customers.filter(c => {
    if (statusFilter === 'Hoạt động') return c.trangThai !== false;
    if (statusFilter === 'Đã khóa') return c.trangThai === false;
    return true;
  });

  return (
    <>
      <div className="filter-control-bar">
        <div className="search-input-box">
          <FiSearch className="search-icon" size={16} />
          <input 
            type="text" 
            placeholder="Tìm kiếm theo tài khoản, họ tên, email, SĐT..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <span className="filter-label-inline">Trạng thái:</span>
          <select 
            className="select-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="Tất cả">Tất cả</option>
            <option value="Hoạt động">Hoạt động</option>
            <option value="Đã khóa">Đã khóa</option>
          </select>
          <button className="btn-advanced-filter" onClick={fetchCustomers} disabled={isLoading}>
            <FiRefreshCw className={isLoading ? 'spin-icon' : ''} size={14} /> Đồng bộ
          </button>
        </div>
      </div>

      <div className="info-notice-banner">
        <FiInfo size={16} />
        <span>Dữ liệu khách hàng đăng ký trực tuyến đồng bộ từ Backend identity-service (Port 8084 qua Gateway 8080).</span>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>TÀI KHOẢN</th>
            <th>HỌ TÊN</th>
            <th>EMAIL & SĐT</th>
            <th>VAI TRÒ</th>
            <th>TRẠNG THÁI</th>
            <th style={{ textAlign: 'right' }}>HÀNH ĐỘNG</th>
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <tr>
              <td colSpan="6" style={{ textAlign: 'center', padding: '40px' }}>
                <FiRefreshCw className="spin-icon" size={24} style={{ color: '#d63031' }} />
                <p style={{ marginTop: '8px', color: '#636e72' }}>Đang nạp danh sách khách hàng từ Backend...</p>
              </td>
            </tr>
          ) : filteredCustomers.length === 0 ? (
            <tr>
              <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#868e96' }}>
                <FiUser size={36} style={{ marginBottom: '8px', opacity: 0.5 }} />
                <p>Không tìm thấy khách hàng nào.</p>
              </td>
            </tr>
          ) : (
            filteredCustomers.map((item) => {
              const initial = (item.hoTen || item.taiKhoan || 'KH').substring(0, 2).toUpperCase();
              const isLocked = item.trangThai === false;

              return (
                <tr key={item.id}>
                  <td>
                    <div className="user-cell-flex">
                      <div className="avatar-circle pink">{initial}</div>
                      <div>
                        <div className="user-name-title">{item.taiKhoan}</div>
                        <div className="user-sub-id">ID: #{item.id}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontWeight: 600 }}>{item.hoTen || item.taiKhoan}</td>
                  <td style={{ color: '#636e72' }}>
                    <div>{item.email}</div>
                    {item.soDienThoai && <small>{item.soDienThoai}</small>}
                  </td>
                  <td>
                    <span className="role-badge" style={{ background: '#f1f5f9', color: '#475569' }}>
                      {item.vaiTro || 'CUSTOMER'}
                    </span>
                  </td>
                  <td>
                    <span className={`status-pill ${!isLocked ? 'active' : 'locked'}`}>
                      <span className="status-dot-inner"></span> {!isLocked ? 'Hoạt động' : 'Đã khóa'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div className="action-buttons-group" style={{ justifyContent: 'flex-end' }}>
                      <button 
                        className="icon-btn-action" 
                        title={isLocked ? "Mở khóa tài khoản" : "Khóa tài khoản"}
                        onClick={() => handleToggleStatus(item)}
                      >
                        {isLocked ? <FiUnlock size={18} style={{ color: '#16a34a' }} /> : <FiLock size={18} />}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>

      <div className="table-pagination-footer">
        <span>Hiển thị <strong>{filteredCustomers.length}</strong> khách hàng</span>
      </div>
    </>
  );
};

export default CustomerManagement;
