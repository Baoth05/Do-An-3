import React from 'react';
import { FiSearch, FiPlus, FiSliders, FiEdit2, FiLock, FiShield, FiBox, FiTool, FiShoppingBag } from 'react-icons/fi';

const StaffManagement = () => {
  const staffList = [
    { code: 'NV-001', name: 'Nguyễn Quốc Việt', email: 'viet.nq@ctut.edu.vn', role: 'Quản trị viên Hệ thống', roleType: 'admin', icon: <FiShield />, status: 'Đang trực', isDuty: true, badgeClass: 'red-dark', avatarText: 'NV1' },
    { code: 'NV-004', name: 'Đặng Khoa Nam', email: 'nam.dk@ctutgear.vn', role: 'Quản lý kho hàng', roleType: 'warehouse', icon: <FiBox />, status: 'Hoạt động', isDuty: false, badgeClass: 'blue', avatarText: 'NV4' },
    { code: 'NV-008', name: 'Lâm Thùy Trang', email: 'trang.lt@ctutgear.vn', role: 'Bán hàng & CSKH', roleType: 'sales', icon: <FiShoppingBag />, status: 'Hoạt động', isDuty: false, badgeClass: 'orange', avatarText: 'NV8' },
  ];

  return (
    <>
      <div className="filter-control-bar">
        <div className="search-input-box">
          <FiSearch className="search-icon" size={16} />
          <input type="text" placeholder="Tìm kiếm nhân viên theo tên, mã số, bộ phận..." />
        </div>
        <div className="filter-group">
          <span className="filter-label-inline">Vai trò:</span>
          <select className="select-filter">
            <option>Tất cả</option>
            <option>Quản trị viên</option>
            <option>Kho hàng</option>
          </select>
          <button className="btn-add-primary">
            <FiPlus size={16} /> Thêm nhân viên mới
          </button>
        </div>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th style={{ width: '40px' }}><input type="checkbox" /></th>
            <th>MÃ & HỌ TÊN</th>
            <th>EMAIL</th>
            <th>VAI TRÒ / BỘ PHẬN</th>
            <th>TRẠNG THÁI</th>
            <th style={{ textAlign: 'right' }}>HÀNH ĐỘNG</th>
          </tr>
        </thead>
        <tbody>
          {staffList.map((st) => (
            <tr key={st.code}>
              <td><input type="checkbox" /></td>
              <td>
                <div className="user-cell-flex">
                  <div className={`avatar-circle ${st.badgeClass}`}>{st.avatarText}</div>
                  <div>
                    <div className="user-name-title">{st.name}</div>
                    <div className="user-sub-id" style={{ color: '#d63031', fontWeight: 600 }}>Mã: {st.code}</div>
                  </div>
                </div>
              </td>
              <td style={{ color: '#636e72' }}>{st.email}</td>
              <td>
                <span className={`role-badge ${st.roleType}`}>
                  {st.icon} {st.role}
                </span>
              </td>
              <td>
                <span className={`status-pill ${st.status === 'Nghỉ ca' ? 'off' : 'duty'}`}>
                  <span className={`status-dot-inner ${st.isDuty ? 'green' : ''}`}></span>
                  {st.status}
                </span>
              </td>
              <td style={{ textAlign: 'right' }}>
                <div className="action-buttons-group" style={{ justifyContent: 'flex-end' }}>
                  <button className="icon-btn-action" title="Phân quyền"><FiSliders size={16} /></button>
                  <button className="icon-btn-action" title="Sửa thông tin"><FiEdit2 size={16} /></button>
                  <button className="icon-btn-action" title="Khóa tài khoản"><FiLock size={16} /></button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="table-pagination-footer">
        <span>Hiển thị 1 - 3 của 12 nhân viên</span>
        <div className="pagination-controls">
          <button className="page-num-btn">Trước</button>
          <button className="page-num-btn active">1</button>
          <button className="page-num-btn">2</button>
          <button className="page-num-btn">Sau</button>
        </div>
      </div>
    </>
  );
};

export default StaffManagement;