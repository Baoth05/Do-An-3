/**
 * ==============================================================================
 * Module: StaffManagement.jsx
 * Mô tả: Giao diện quản lý danh sách nhân sự (Quản lý kho, Thủ kho, Nhân viên).
 * Chức năng: Tìm kiếm nhân sự, lọc theo chức vụ, khóa/mở khóa tài khoản, thêm và sửa nhân viên.
 * ==============================================================================
 */
import React, { useState, useEffect } from 'react';
import {
  FiSearch, FiPlus, FiSliders, FiEdit2, FiLock, FiUnlock,
  FiShield, FiBox, FiBriefcase, FiRefreshCw, FiUser, FiUserCheck
} from 'react-icons/fi';
import { userService } from '../services/userService';
import AddStaffForm from './AddStaffForm';
import EditStaffForm from './EditStaffForm';

const StaffManagement = ({ onRefreshStats }) => {
  const [staffList, setStaffList] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('Tất cả');
  const [isLoading, setIsLoading] = useState(false);

  // Form mode: 'list' | 'add' | 'edit'
  const [viewMode, setViewMode] = useState('list');
  const [editingStaff, setEditingStaff] = useState(null);

  const fetchStaff = async () => {
    try {
      setIsLoading(true);
      const list = await userService.getStaff(searchTerm, roleFilter);
      setStaffList(list || []);
    } catch (e) {
      console.warn('Lỗi lấy danh sách nhân viên:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, [searchTerm, roleFilter]);

  // Hàm khóa / mở khóa tài khoản nhân sự
  const handleToggleStatus = async (user) => {
    const action = user.trangThai === false ? 'mở khóa' : 'khóa';
    if (window.confirm(`Bạn có chắc chắn muốn ${action} tài khoản nhân sự "${user.taiKhoan}"?`)) {
      try {
        await userService.toggleUserStatus(user.id);
        alert(`Đã ${action} tài khoản nhân viên thành công!`);
        fetchStaff();
        if (onRefreshStats) onRefreshStats();
      } catch (err) {
        alert('Lỗi thay đổi trạng thái: ' + (err.response?.data || err.message));
      }
    }
  };

  const handleAddSuccess = () => {
    setViewMode('list');
    fetchStaff();
    if (onRefreshStats) onRefreshStats();
  };

  const handleEditSuccess = () => {
    setViewMode('list');
    setEditingStaff(null);
    fetchStaff();
    if (onRefreshStats) onRefreshStats();
  };

  if (viewMode === 'add') {
    return (
      <AddStaffForm
        onBack={() => setViewMode('list')}
        onSuccess={handleAddSuccess}
      />
    );
  }

  if (viewMode === 'edit' && editingStaff) {
    return (
      <EditStaffForm
        staff={editingStaff}
        onBack={() => { setViewMode('list'); setEditingStaff(null); }}
        onSuccess={handleEditSuccess}
      />
    );
  }

  const getRoleBadge = (role) => {
    const r = (role || '').toUpperCase();
    if (r.includes('ADMIN')) {
      return { label: 'Quản trị viên', className: 'admin', icon: <FiShield /> };
    }
    if (r.includes('THUKHO')) {
      return { label: 'Thủ kho trưởng', className: 'warehouse', icon: <FiBox /> };
    }
    if (r.includes('NVKHO')) {
      return { label: 'Nhân viên kho', className: 'warehouse', icon: <FiBox /> };
    }
    return { label: role || 'Chưa phân quyền', className: 'sales', icon: <FiBriefcase /> };
  };

  return (
    <>
      <div className="filter-control-bar">
        <div className="search-input-box">
          <FiSearch className="search-icon" size={16} />
          <input
            type="text"
            placeholder="Tìm kiếm nhân viên theo tên, tài khoản, SĐT..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <span className="filter-label-inline">Vai trò:</span>
          <select
            className="select-filter"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="Tất cả">Tất cả</option>
            <option value="ADMIN">Quản trị viên</option>
            <option value="THUKHO">Thủ kho</option>
            <option value="NVKHO">Nhân viên kho</option>
          </select>
          <button className="btn-advanced-filter" onClick={fetchStaff} disabled={isLoading}>
            <FiRefreshCw className={isLoading ? 'spin-icon' : ''} size={14} /> Đồng bộ
          </button>
          <button className="btn-add-primary" onClick={() => setViewMode('add')}>
            <FiPlus size={16} /> Thêm nhân viên mới
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
                <p style={{ marginTop: '8px', color: '#636e72' }}>Đang nạp danh sách nhân sự từ Backend...</p>
              </td>
            </tr>
          ) : staffList.length === 0 ? (
            <tr>
              <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: '#868e96' }}>
                <FiBriefcase size={36} style={{ marginBottom: '8px', opacity: 0.5 }} />
                <p>Chưa có nhân viên nào trong danh sách.</p>
                <button className="btn-add-primary" onClick={() => setViewMode('add')} style={{ marginTop: '12px' }}>
                  <FiPlus size={16} /> Thêm Nhân Viên Mới
                </button>
              </td>
            </tr>
          ) : (
            staffList.map((st) => {
              const roleInfo = getRoleBadge(st.vaiTro);
              const initial = (st.hoTen || st.taiKhoan || 'NV').substring(0, 2).toUpperCase();
              const isLocked = st.trangThai === false;

              return (
                <tr key={st.id}>
                  <td>
                    <div className="user-cell-flex">
                      <div className={`avatar-circle red-dark`}>{initial}</div>
                      <div>
                        <div className="user-name-title">{st.hoTen || st.taiKhoan}</div>
                        <div className="user-sub-id" style={{ color: '#d63031', fontWeight: 600 }}>
                          @{st.taiKhoan} • ID: #{st.id}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td style={{ color: '#636e72' }}>
                    <div>{st.email}</div>
                    {st.soDienThoai && <small>{st.soDienThoai}</small>}
                  </td>
                  <td>
                    <span className={`role-badge ${roleInfo.className}`}>
                      {roleInfo.icon} {roleInfo.label}
                    </span>
                  </td>
                  <td>
                    <span className={`status-pill ${!isLocked ? 'duty' : 'off'}`}>
                      <span className={`status-dot-inner ${!isLocked ? 'green' : ''}`}></span>
                      {!isLocked ? 'Hoạt động' : 'Đã khóa'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div className="action-buttons-group" style={{ justifyContent: 'flex-end' }}>
                      <button
                        className="icon-btn-action"
                        title="Sửa thông tin"
                        onClick={() => { setEditingStaff(st); setViewMode('edit'); }}
                      >
                        <FiEdit2 size={16} />
                      </button>
                      <button
                        className="icon-btn-action"
                        title={isLocked ? "Mở khóa tài khoản" : "Khóa tài khoản"}
                        onClick={() => handleToggleStatus(st)}
                      >
                        {isLocked ? <FiUnlock size={16} style={{ color: '#16a34a' }} /> : <FiLock size={16} />}
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
        <span>Hiển thị <strong>{staffList.length}</strong> nhân sự nội bộ</span>
      </div>
    </>
  );
};

export default StaffManagement;