// src/pages/UserManagement/StaffManagement.jsx
import React, { useState, useEffect } from 'react';
import { FiSearch, FiPlus, FiSliders, FiEdit2, FiLock, FiShield, FiBox, FiUserCheck } from 'react-icons/fi';
import AddStaffForm from './AddStaffForm';
import EditStaffForm from './EditStaffForm'; // 🌟 Import form chỉnh sửa vừa tạo
import { userService } from '../services/userService';

const StaffManagement = () => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null); // 🌟 Lưu trữ nhân viên đang được chọn sửa
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('Tất cả');

  const fetchStaff = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await userService.getStaff(search, roleFilter);
      setStaffList(data && data.length > 0 ? data : []);
    } catch (err) {
      console.error('Lỗi khi lấy danh sách nhân viên:', err);
      setError('Không thể lấy danh sách nhân viên từ máy chủ Backend.');
      setStaffList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, [search, roleFilter]);

  const renderRoleBadge = (st) => {
    const roleName = (st.role || (st.roles && st.roles[0]) || '').toUpperCase();
    if (roleName.includes('ADMIN')) {
      return <span className="role-badge admin"><FiShield /> Quản trị viên</span>;
    } else if (roleName.includes('THUKHO')) {
      return <span className="role-badge warehouse"><FiBox /> Thủ kho</span>;
    } else if (roleName.includes('NVKHO')) {
      return <span className="role-badge sales"><FiUserCheck /> Nhân viên kho</span>;
    }
    return <span className="role-badge" style={{ background: '#e2e8f0', color: '#475569' }}>{roleName || 'Chưa phân quyền'}</span>;
  };

  // Nếu đang ở chế độ thêm mới
  if (isAdding) {
    return (
      <AddStaffForm
        onBack={() => setIsAdding(false)}
        onSuccess={() => { setIsAdding(false); fetchStaff(); }}
      />
    );
  }

  // 🌟 Nếu đang ở chế độ chỉnh sửa thông tin nhân viên
  if (editingStaff) {
    return (
      <EditStaffForm
        staff={editingStaff}
        onBack={() => setEditingStaff(null)}
        onSuccess={() => { setEditingStaff(null); fetchStaff(); }}
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
            <option value="Tất cả">Tất cả vai trò</option>
            <option value="ADMIN">Quản trị viên (Admin)</option>
            <option value="THUKHO">Thủ kho</option>
            <option value="NVKHO">Nhân viên kho</option>
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
            <tr><td colSpan="6" style={{ textAlign: 'center', padding: '30px' }}>Đang tải dữ liệu nhân viên...</td></tr>
          ) : error ? (
            <tr><td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: '#d63031' }}>⚠️ {error}</td></tr>
          ) : staffList.length === 0 ? (
            <tr><td colSpan="6" style={{ textAlign: 'center', padding: '30px' }}>Chưa có dữ liệu nhân viên nào trong hệ thống.</td></tr>
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
                    {/* 🌟 Gắn sự kiện click để mở trang Sửa thông tin */}
                    <button className="icon-btn-action" title="Sửa thông tin" onClick={() => setEditingStaff(st)}>
                      <FiEdit2 size={16} />
                    </button>
                    <button className="icon-btn-action" title="Khóa tài khoản"><FiLock size={16} /></button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </>
  );
};

export default StaffManagement;