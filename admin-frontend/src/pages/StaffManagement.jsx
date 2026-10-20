// src/pages/UserManagement/StaffManagement.jsx
import React, { useState, useEffect } from 'react';
import { FiSearch, FiPlus, FiSliders, FiEdit2, FiLock, FiShield, FiBox, FiShoppingBag } from 'react-icons/fi';
import AddStaffForm from './AddStaffForm';
import { userService } from '../services/userService'; // Đảm bảo đúng cấp thư mục import

const StaffManagement = () => {
  const [isAdding, setIsAdding] = useState(false);
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('Tất cả');

  // Lấy dữ liệu từ API Backend
  const fetchStaff = async () => {
    try {
      setLoading(true);
      setError('');

      const data = await userService.getStaff(search, roleFilter);
      
      if (data && data.length > 0) {
        setStaffList(data);
      } else {
        setStaffList([]);
      }
    } catch (err) {
      console.error('Lỗi khi lấy danh sách nhân viên:', err);
      if (err.response?.status === 403) {
        setError('Bạn không có quyền truy cập hoặc chưa đăng nhập hợp lệ (Lỗi 403).');
      } else {
        setError('Không thể lấy danh sách nhân viên từ máy chủ Backend.');
      }
      setStaffList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, [search, roleFilter]);

  // Hàm hiển thị tên Vai trò / Bộ phận thân thiện
  const renderRoleBadge = (st) => {
    const roleName = st.role || (st.roles && st.roles[0]) || '';
    if (roleName.includes('ADMIN')) {
      return <span className="role-badge admin"><FiShield /> Quản trị viên</span>;
    } else if (roleName.includes('SALES')) {
      return <span className="role-badge sales"><FiShoppingBag /> Bán hàng & CSKH</span>;
    }
    return <span className="role-badge warehouse"><FiBox /> Quản lý kho</span>;
  };

  if (isAdding) {
    return (
      <AddStaffForm 
        onBack={() => setIsAdding(false)} 
        onSuccess={() => {
          setIsAdding(false);
          fetchStaff();
        }} 
      />
    );
  }

  return (
    <>
      <div className="filter-control-bar">
        <div className="search-input-box">
          <FiSearch className="search-icon" size={16} />
          <input 
            type="text" 
            placeholder="Tìm kiếm nhân viên theo tên, mã số, bộ phận..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <span className="filter-label-inline">Vai trò:</span>
          <select className="select-filter" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
            <option value="Tất cả">Tất cả</option>
            <option value="ROLE_ADMIN">Quản trị viên</option>
            <option value="ROLE_WAREHOUSE">Quản lý kho</option>
            <option value="ROLE_SALES">Bán hàng</option>
          </select>

          <button className="btn-add-primary" onClick={() => setIsAdding(true)}>
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
          {loading ? (
            <tr>
              <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: '#636e72' }}>
                Đang tải dữ liệu nhân viên...
              </td>
            </tr>
          ) : error ? (
            <tr>
              <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: '#d63031' }}>
                ⚠️ {error}
              </td>
            </tr>
          ) : staffList.length === 0 ? (
            <tr>
              <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: '#636e72' }}>
                Chưa có dữ liệu nhân viên nào trong hệ thống.
              </td>
            </tr>
          ) : (
            staffList.map((st, index) => (
              <tr key={st.id || st.code || st.taiKhoan || index}>
                <td><input type="checkbox" /></td>
                <td>
                  <div className="user-cell-flex">
                    <div className="avatar-circle blue">NV</div>
                    <div>
                      <div className="user-name-title">{st.hoTen || st.fullName || st.name}</div>
                      <div className="user-sub-id" style={{ color: '#d63031', fontWeight: 600 }}>
                        Mã: {st.taiKhoan || st.username || st.code || `NV-${st.id}`}
                      </div>
                    </div>
                  </div>
                </td>
                <td style={{ color: '#636e72' }}>{st.email}</td>
                <td>{renderRoleBadge(st)}</td>
                <td>
                  <span className="status-pill duty">
                    <span className="status-dot-inner green"></span>
                    {st.trangThai || st.status || 'Hoạt động'}
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
            ))
          )}
        </tbody>
      </table>

      {!loading && !error && staffList.length > 0 && (
        <div className="table-pagination-footer">
          <span>Hiển thị 1 - {staffList.length} của {staffList.length} nhân viên</span>
          <div className="pagination-controls">
            <button className="page-num-btn">Trước</button>
            <button className="page-num-btn active">1</button>
            <button className="page-num-btn">Sau</button>
          </div>
        </div>
      )}
    </>
  );
};

export default StaffManagement;