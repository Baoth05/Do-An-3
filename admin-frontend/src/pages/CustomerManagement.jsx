// src/pages/UserManagement/CustomerManagement.jsx
import React, { useState, useEffect } from 'react';
import { FiSearch, FiSliders, FiEye, FiLock, FiInfo, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { userService } from '../services/userService'; // Đảm bảo đường dẫn import chính xác

const CustomerManagement = () => {
  const [customersList, setCustomersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(''); // Thêm state để lưu thông báo lỗi
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('Tất cả');

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setLoading(true);
        setError(''); // Xóa lỗi cũ (nếu có) trước khi gọi API mới
        
        // Gọi API lấy dữ liệu thật
        const data = await userService.getCustomers(search, statusFilter);
        
        // Cập nhật danh sách từ Backend (nếu không có data, gán mảng rỗng)
        if (data && data.length > 0) {
          setCustomersList(data);
        } else {
          setCustomersList([]);
        }
      } catch (err) {
        console.error('Lỗi khi lấy dữ liệu thật:', err);
        setError('Không thể kết nối đến máy chủ Backend. Vui lòng kiểm tra lại!');
        setCustomersList([]); // Xóa danh sách nếu lỗi
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, [search, statusFilter]);

  return (
    <>
      {/* Thanh tìm kiếm và bộ lọc */}
      <div className="filter-control-bar">
        <div className="search-input-box">
          <FiSearch className="search-icon" size={16} />
          <input 
            type="text" 
            placeholder="Tìm kiếm theo tài khoản, họ tên, email..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <span className="filter-label-inline">Trạng thái:</span>
          <select className="select-filter" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="Tất cả">Tất cả</option>
            <option value="Hoạt động">Hoạt động</option>
            <option value="Đã khóa">Đã khóa</option>
          </select>
          <button className="btn-advanced-filter">
            <FiSliders size={14} /> Lọc nâng cao
          </button>
        </div>
      </div>

      <div className="info-notice-banner">
        <FiInfo size={16} />
        <span>Khách hàng tự đăng ký tài khoản qua website bán hàng CTUT Gear. Quản trị viên chỉ có quyền kiểm tra, xác thực và khóa truy cập.</span>
      </div>

      {/* Bảng dữ liệu */}
      <table className="data-table">
        <thead>
          <tr>
            <th>TÀI KHOẢN</th>
            <th>HỌ TÊN</th>
            <th>EMAIL</th>
            <th>TRẠNG THÁI</th>
            <th style={{ textAlign: 'right' }}>HÀNH ĐỘNG</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            // Trạng thái 1: Đang tải
            <tr>
              <td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: '#636e72' }}>
                Đang tải dữ liệu từ máy chủ...
              </td>
            </tr>
          ) : error ? (
            // Trạng thái 2: Lỗi kết nối Backend
            <tr>
              <td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: '#d63031' }}>
                ⚠️ {error}
              </td>
            </tr>
          ) : customersList.length === 0 ? (
            // Trạng thái 3: Backend trả về thành công nhưng không có khách hàng nào
            <tr>
              <td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: '#636e72' }}>
                Chưa có dữ liệu khách hàng nào trong hệ thống.
              </td>
            </tr>
          ) : (
            // Trạng thái 4: Hiển thị dữ liệu thật
            customersList.map((item) => (
              <tr key={item.id}>
                <td>
                  <div className="user-cell-flex">
                    <div className="avatar-circle pink">{item.initial || 'KH'}</div>
                    <div>
                      <div className="user-name-title">{item.account || item.taiKhoan}</div>
                      <div className="user-sub-id">ID: {item.id}</div>
                    </div>
                  </div>
                </td>
                <td style={{ fontWeight: 600 }}>{item.name || item.hoTen}</td>
                <td style={{ color: '#636e72' }}>{item.email}</td>
                <td>
                  <span className={`status-pill ${item.status === 'Hoạt động' ? 'active' : 'locked'}`}>
                    <span className="status-dot-inner"></span> {item.status || 'Hoạt động'}
                  </span>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <div className="action-buttons-group" style={{ justifyContent: 'flex-end' }}>
                    <button className="icon-btn-action" title="Xem chi tiết"><FiEye size={18} /></button>
                    <button className="icon-btn-action" title="Khóa tài khoản"><FiLock size={18} /></button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Phân trang (Pagination) */}
      {!loading && !error && customersList.length > 0 && (
        <div className="table-pagination-footer">
          <span>Hiển thị 1 - {customersList.length} khách hàng</span>
          <div className="pagination-controls">
            <button className="page-num-btn"><FiChevronLeft size={14}/></button>
            <button className="page-num-btn active">1</button>
            <button className="page-num-btn"><FiChevronRight size={14}/></button>
          </div>
        </div>
      )}
    </>
  );
};

export default CustomerManagement;