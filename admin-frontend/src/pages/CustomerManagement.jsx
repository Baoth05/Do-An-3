import React from 'react';
import { FiSearch, FiSliders, FiEye, FiLock, FiInfo, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

const CustomerManagement = () => {
  const customersList = [
    { id: 'CTUT-9812', account: 'nguyen_van_an', name: 'Nguyễn Văn An', email: 'an.nguyen@gmail.com', status: 'Hoạt động', initial: 'NA' },
    { id: 'CTUT-9813', account: 'tran_thanh_binh', name: 'Trần Thanh Bình', email: 'binh.tt@gmail.com', status: 'Hoạt động', initial: 'TB' },
    { id: 'CTUT-9814', account: 'le_thi_mai', name: 'Lê Thị Mai', email: 'maile99@yahoo.com', status: 'Đã khóa', initial: 'LM' },
  ];

  return (
    <>
      <div className="filter-control-bar">
        <div className="search-input-box">
          <FiSearch className="search-icon" size={16} />
          <input type="text" placeholder="Tìm kiếm theo tài khoản, họ tên, email..." />
        </div>
        <div className="filter-group">
          <span className="filter-label-inline">Trạng thái:</span>
          <select className="select-filter">
            <option>Tất cả</option>
            <option>Hoạt động</option>
            <option>Đã khóa</option>
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
          {customersList.map((item) => (
            <tr key={item.id}>
              <td>
                <div className="user-cell-flex">
                  <div className="avatar-circle pink">{item.initial}</div>
                  <div>
                    <div className="user-name-title">{item.account}</div>
                    <div className="user-sub-id">ID: {item.id}</div>
                  </div>
                </div>
              </td>
              <td style={{ fontWeight: 600 }}>{item.name}</td>
              <td style={{ color: '#636e72' }}>{item.email}</td>
              <td>
                <span className={`status-pill ${item.status === 'Hoạt động' ? 'active' : 'locked'}`}>
                  <span className="status-dot-inner"></span> {item.status}
                </span>
              </td>
              <td style={{ textAlign: 'right' }}>
                <div className="action-buttons-group" style={{ justifyContent: 'flex-end' }}>
                  <button className="icon-btn-action" title="Xem chi tiết"><FiEye size={18} /></button>
                  <button className="icon-btn-action" title="Khóa tài khoản"><FiLock size={18} /></button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="table-pagination-footer">
        <span>Hiển thị 1 - 3 của 1.238 khách hàng</span>
        <div className="pagination-controls">
          <button className="page-num-btn"><FiChevronLeft size={14}/></button>
          <button className="page-num-btn active">1</button>
          <button className="page-num-btn">2</button>
          <span>...</span>
          <button className="page-num-btn">248</button>
          <button className="page-num-btn"><FiChevronRight size={14}/></button>
        </div>
      </div>
    </>
  );
};

export default CustomerManagement;