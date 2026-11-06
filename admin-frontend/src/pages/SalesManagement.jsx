/**
 * ==============================================================================
 * Module: SalesManagement.jsx
 * Mô tả: Giao diện quản lý danh sách tài khoản bán hàng (Sales).
 * ==============================================================================
 */
import React, { useState, useEffect } from 'react';
import { 
  FiSearch, FiLock, FiUnlock, 
  FiKey, FiRefreshCw, FiBriefcase,
  FiEye, FiArrowLeft, FiUser, FiMail, FiPhone, FiCreditCard // Import thêm các icon mới
} from 'react-icons/fi';
import { userService } from '../services/userService';

const SalesManagement = ({ onRefreshStats }) => {
  const [salesList, setSalesList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Quản lý chế độ xem (list hoặc details) và modal đổi mật khẩu
  const [viewMode, setViewMode] = useState('list');
  const [editingUser, setEditingUser] = useState(null);
  const [pwdModal, setPwdModal] = useState({ isOpen: false, user: null, newPassword: '' });

  // 1. Hàm nạp danh sách nhân viên bán hàng
  const fetchSalesUsers = async () => {
    try {
      setIsLoading(true);
      const response = await userService.getSalesUsers(); 
      
      let listData = response;
      if (response && response.data) {
        listData = response.data;
      } else if (response && response.users) {
        listData = response.users; 
      }

      if (Array.isArray(listData)) {
        setSalesList(listData);
      } else {
        setSalesList([]);
      }
    } catch (error) {
      console.error('Lỗi khi tải danh sách tài khoản bán hàng:', error);
      setSalesList([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSalesUsers();
  }, []);

  // 2. Hàm xử lý khóa / mở khóa tài khoản
  const handleToggleStatus = async (user) => {
    const isActive = user.trangThai === 1 || user.trangThai === true || user.trangThai === 'active';
    const action = isActive ? 'khóa' : 'mở khóa';
    
    if (window.confirm(`Bạn có chắc chắn muốn ${action} tài khoản "${user.taiKhoan}"?`)) {
      try {
        await userService.toggleUserStatus(user.id);
        alert(`Đã ${action} tài khoản thành công!`);
        fetchSalesUsers();
        if (onRefreshStats) onRefreshStats();
      } catch (err) {
        alert('Lỗi thay đổi trạng thái: ' + (err.response?.data || err.message));
      }
    }
  };

  // 3. Hàm xử lý đổi mật khẩu
  const handlePasswordChange = async () => {
    if (!pwdModal.newPassword || pwdModal.newPassword.length < 6) {
      alert('Mật khẩu mới phải chứa ít nhất 6 ký tự!');
      return;
    }
    try {
      const targetAcc = pwdModal.user.taiKhoan || pwdModal.user.username;
      await userService.changePassword(targetAcc, pwdModal.newPassword);
      alert(`Đã đổi mật khẩu thành công cho tài khoản ${targetAcc}!`);
      setPwdModal({ isOpen: false, user: null, newPassword: '' });
    } catch (err) {
      alert('Lỗi khi đổi mật khẩu: ' + (err.response?.data || err.message));
    }
  };

  // --- Điều hướng giao diện (Hiển thị chi tiết cửa hàng) ---
  if (viewMode === 'details' && editingUser) {
    const isActive = editingUser.trangThai === 1 || editingUser.trangThai === true || editingUser.trangThai === 'active';
    
    return (
      <div style={{ background: '#ffffff', borderRadius: '12px', padding: '24px', border: '1px solid #f1f2f6', animation: 'fadeIn 0.3s ease' }}>
        {/* Nút quay lại */}
        <button 
          onClick={() => { setViewMode('list'); setEditingUser(null); }} 
          style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: '#636e72', cursor: 'pointer', marginBottom: '24px', fontWeight: 600, fontSize: '14px', padding: 0 }}
        >
          <FiArrowLeft size={18} /> Quay lại danh sách
        </button>

        <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
          {/* Cột trái: Thông tin tổng quan (Avatar, Tên, Trạng thái) */}
          <div style={{ width: '280px', display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#f8f9fa', padding: '30px 20px', borderRadius: '12px', border: '1px solid #e9ecef' }}>
            <div className="avatar-circle orange" style={{ width: '80px', height: '80px', fontSize: '32px', marginBottom: '16px' }}>
              {editingUser.hoTen ? editingUser.hoTen.charAt(0).toUpperCase() : 'S'}
            </div>
            <h2 style={{ margin: '0 0 8px 0', fontSize: '20px', color: '#2d3436', textAlign: 'center' }}>
              {editingUser.hoTen}
            </h2>
            <div style={{ color: '#d63031', fontWeight: 600, fontSize: '13px', marginBottom: '16px' }}>
              @{editingUser.taiKhoan}
            </div>
            
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <span className="role-badge sales">
                <FiBriefcase style={{ marginRight: '4px' }} /> 
                {editingUser.vaiTro === 'STORE_OWNER' ? 'Chủ cửa hàng' : 'Bán hàng'}
              </span>
            </div>

            <span className={`status-pill ${isActive ? 'duty' : 'off'}`} style={{ padding: '6px 16px', fontSize: '13px' }}>
              <span className={`status-dot-inner ${isActive ? 'green' : ''}`}></span>
              {isActive ? 'Đang hoạt động' : 'Tài khoản đã khóa'}
            </span>
          </div>

          {/* Cột phải: Thông tin chi tiết */}
          <div style={{ flex: 1, minWidth: '300px' }}>
            <h3 style={{ margin: '0 0 20px 0', color: '#1e1b1b', fontSize: '18px', borderBottom: '2px solid #f1f2f6', paddingBottom: '10px' }}>
              Hồ Sơ Cửa Hàng / Người Bán
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px' }}>
              
              {/* Box: Mã ID */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ color: '#a0aec0', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FiCreditCard /> Mã Hệ Thống (ID)
                </span>
                <span style={{ color: '#2d3436', fontSize: '15px', fontWeight: 500 }}>
                  #{editingUser.id}
                </span>
              </div>

              {/* Box: Họ và Tên */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ color: '#a0aec0', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FiUser /> Họ và Tên
                </span>
                <span style={{ color: '#2d3436', fontSize: '15px', fontWeight: 500 }}>
                  {editingUser.hoTen || 'Chưa cập nhật'}
                </span>
              </div>

              {/* Box: Email */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ color: '#a0aec0', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FiMail /> Địa chỉ Email
                </span>
                <span style={{ color: '#2d3436', fontSize: '15px', fontWeight: 500 }}>
                  {editingUser.email || 'Chưa cập nhật'}
                </span>
              </div>

              {/* Box: Số điện thoại */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ color: '#a0aec0', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FiPhone /> Số Điện Thoại
                </span>
                <span style={{ color: '#2d3436', fontSize: '15px', fontWeight: 500 }}>
                  {editingUser.soDienThoai || 'Chưa cập nhật'}
                </span>
              </div>

            </div>
            
            {/* Vùng mở rộng sau này cho Form chi tiết */}
            <div style={{ marginTop: '30px', padding: '16px', background: '#fff0e6', borderRadius: '8px', border: '1px dashed #ffa87d' }}>
              <p style={{ margin: 0, fontSize: '13px', color: '#d9480f' }}>
                * Ghi chú: Bạn có thể kết nối thêm các API lấy chi tiết doanh thu hoặc sản phẩm của cửa hàng này để hiển thị tại đây trong tương lai.
              </p>
            </div>

          </div>
        </div>
      </div>
    );
  }

  // --- Lọc dữ liệu hiển thị (Màn hình danh sách) ---
  const filteredSales = salesList.filter((user) => {
    const matchSearch = 
      user.hoTen?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.soDienThoai?.includes(searchTerm);
      
    const userStatus = user.trangThai === 1 || user.trangThai === true || user.trangThai === 'active' ? 'active' : 'locked';
    const matchStatus = filterStatus === 'all' || userStatus === filterStatus;
    
    return matchSearch && matchStatus;
  });

  return (
    <>
      <div className="filter-control-bar">
        <div className="search-input-box">
          <FiSearch className="search-icon" />
          <input 
            type="text" 
            placeholder="Tìm kiếm theo tên, email, SĐT..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <span className="filter-label-inline">Trạng thái:</span>
          <select 
            className="select-filter"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">Tất cả</option>
            <option value="active">Hoạt động</option>
            <option value="locked">Đã khóa</option>
          </select>
          <button className="btn-advanced-filter" onClick={fetchSalesUsers} disabled={isLoading}>
            <FiRefreshCw className={isLoading ? 'spin-icon' : ''} size={14} /> Đồng bộ
          </button>
        </div>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>MÃ & HỌ TÊN</th>
            <th>EMAIL & SĐT</th>
            <th>VAI TRÒ / BỘ PHẬN</th>
            <th>TRẠNG THÁI</th>
            <th style={{ textAlign: 'right' }}>HÀNH ĐỘNG</th>
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <tr>
              <td colSpan="5" style={{ textAlign: 'center', padding: '40px' }}>
                <FiRefreshCw className="spin-icon" size={24} style={{ color: '#d63031' }} />
                <p style={{ marginTop: '8px', color: '#636e72' }}>Đang nạp dữ liệu...</p>
              </td>
            </tr>
          ) : filteredSales.length === 0 ? (
            <tr>
              <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: '#868e96' }}>
                Không tìm thấy tài khoản bán hàng nào.
              </td>
            </tr>
          ) : (
            filteredSales.map((user) => {
              const isActive = user.trangThai === 1 || user.trangThai === true || user.trangThai === 'active';
              
              return (
                <tr key={user.id}>
                  <td>
                    <div className="user-cell-flex">
                      <div className="avatar-circle orange">
                        {user.hoTen ? user.hoTen.charAt(0).toUpperCase() : 'S'}
                      </div>
                      <div>
                        <div className="user-name-title">{user.hoTen}</div>
                        <div className="user-sub-id" style={{ color: '#d63031', fontWeight: 600 }}>
                          @{user.taiKhoan} • ID: #{user.id}
                        </div>
                      </div>
                    </div>
                  </td>
                  
                  <td style={{ color: '#636e72' }}>
                    <div className="user-name-title" style={{ fontWeight: 400 }}>{user.email}</div>
                    <div className="user-sub-id">{user.soDienThoai || 'Chưa cập nhật'}</div>
                  </td>

                  <td>
                    <span className="role-badge sales">
                      <FiBriefcase style={{ marginRight: '4px' }} /> 
                      {user.vaiTro === 'STORE_OWNER' ? 'Chủ cửa hàng (Sales)' : 'Bán hàng'}
                    </span>
                  </td>

                  <td>
                    <span className={`status-pill ${isActive ? 'duty' : 'off'}`}>
                      <span className={`status-dot-inner ${isActive ? 'green' : ''}`}></span>
                      {isActive ? 'Hoạt động' : 'Đã khóa'}
                    </span>
                  </td>

                  <td style={{ textAlign: 'right' }}>
                    <div className="action-buttons-group" style={{ justifyContent: 'flex-end', display: 'flex', gap: '6px' }}>
                      {/* ĐÃ THAY ĐỔI: Nút Xem chi tiết với Icon FiEye */}
                      <button 
                        className="icon-btn-action" 
                        title="Xem chi tiết"
                        onClick={() => { setEditingUser(user); setViewMode('details'); }}
                      >
                        <FiEye size={18} style={{ color: '#0984e3' }} />
                      </button>
                      
                      <button
                        className="icon-btn-action"
                        title="Đổi mật khẩu"
                        onClick={() => setPwdModal({ isOpen: true, user: user, newPassword: '' })}
                      >
                        <FiKey size={16} />
                      </button>
                      <button 
                        className="icon-btn-action" 
                        title={isActive ? 'Khóa tài khoản' : 'Mở khóa'}
                        onClick={() => handleToggleStatus(user)}
                      >
                        {isActive ? <FiLock size={16} /> : <FiUnlock size={16} style={{ color: '#16a34a' }}/>}
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
        <span>Hiển thị <strong>{filteredSales.length}</strong> tài khoản bán hàng</span>
      </div>

      {/* Modal đổi mật khẩu (Giữ nguyên) */}
      {pwdModal.isOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{
            background: '#fff', padding: '24px', borderRadius: '8px',
            width: '360px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '12px', fontSize: '18px' }}>
              Đổi mật khẩu tài khoản Sales
            </h3>
            <p style={{ color: '#636e72', fontSize: '14px', marginBottom: '16px' }}>
              Tài khoản: <strong>{pwdModal.user?.taiKhoan}</strong>
            </p>
            <input
              type="password"
              placeholder="Nhập mật khẩu mới..."
              value={pwdModal.newPassword}
              onChange={(e) => setPwdModal({ ...pwdModal, newPassword: e.target.value })}
              style={{
                width: '100%', padding: '10px', borderRadius: '6px',
                border: '1px solid #dfe6e9', marginBottom: '16px', boxSizing: 'border-box'
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => setPwdModal({ isOpen: false, user: null, newPassword: '' })}
                style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #ccc', background: '#fff', cursor: 'pointer' }}
              >
                Hủy
              </button>
              <button
                onClick={handlePasswordChange}
                style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', background: '#d63031', color: '#fff', cursor: 'pointer', fontWeight: 600 }}
              >
                Lưu mật khẩu
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SalesManagement;