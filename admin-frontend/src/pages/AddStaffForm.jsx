// src/pages/UserManagement/AddStaffForm.jsx
import React, { useState } from 'react';
import { FiArrowLeft, FiSave, FiUser, FiMail, FiLock, FiPhone, FiShield, FiBox, FiCheckSquare } from 'react-icons/fi';
import { userService } from '../services/userService';

import './AddStaffForm.css';

const AddStaffForm = ({ onBack, onSuccess }) => {
  const [formData, setFormData] = useState({
    taiKhoan: '',
    matKhau: '',
    xacNhanMatKhau: '',
    hoTen: '',
    email: '',
    soDienThoai: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // 1. Làm sạch khoảng trắng thừa ở đầu/cuối
    const cleanTaiKhoan = formData.taiKhoan.trim();
    const cleanHoTen = formData.hoTen.trim();
    const cleanEmail = formData.email.trim();
    const cleanSoDienThoai = formData.soDienThoai.trim();

    // 2. Kiểm tra các thông tin bắt buộc
    if (!cleanTaiKhoan || !formData.matKhau || !cleanHoTen || !cleanEmail) {
      setError('Vui lòng điền đầy đủ các thông tin bắt buộc (*)');
      return;
    }

    if (formData.matKhau !== formData.xacNhanMatKhau) {
      setError('Mật khẩu xác nhận không trùng khớp!');
      return;
    }

    // 3. Ràng buộc độ dài số điện thoại theo DB constraint (VARCHAR 15)
    if (cleanSoDienThoai && cleanSoDienThoai.length > 15) {
      setError('Số điện thoại không được vượt quá 15 ký tự!');
      return;
    }

    const phoneRegex = /^[0-9+]*$/;
    if (cleanSoDienThoai && !phoneRegex.test(cleanSoDienThoai)) {
      setError('Số điện thoại chỉ được chứa chữ số hoặc dấu + !');
      return;
    }

    try {
      setLoading(true);
      await userService.createStaff({
        taiKhoan: cleanTaiKhoan,
        matKhau: formData.matKhau,
        hoTen: cleanHoTen,
        email: cleanEmail,
        soDienThoai: cleanSoDienThoai,
        role: formData.role // Gửi đúng vai trò 'ADMIN', 'THUKHO', hoặc 'NVKHO' lên Backend
      });

      alert('Thêm tài khoản nội bộ mới thành công!');
      if (onSuccess) onSuccess();

    } catch (err) {
      const backendError = err.response?.data;
      const errorMsg = typeof backendError === 'string' ? backendError : backendError?.message;

      if (errorMsg && errorMsg.includes('value too long')) {
        setError('Số điện thoại quá dài (tối đa 15 ký tự). Vui lòng kiểm tra lại!');
      } else if (err.message === 'Network Error') {
        setError('Không thể kết nối đến máy chủ. Vui lòng kiểm tra API Gateway (Port 8080)!');
      } else {
        setError(errorMsg || 'Không thể tạo tài khoản nhân viên. Vui lòng kiểm tra lại thông tin!');
      }
      console.error('Chi tiết lỗi tạo nhân viên:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-staff-container">
      {/* Header Form */}
      <div className="add-staff-header">
        <button onClick={onBack} className="btn-back">
          <FiArrowLeft size={16} /> Quay lại danh sách
        </button>
        <h2 className="add-staff-title">THÊM TÀI KHOẢN NỘI BỘ HỆ THỐNG</h2>
      </div>

      {error && (
        <div className="error-message">
          ⚠️ {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-grid">
          {/* Tài khoản */}
          <div className="form-group">
            <label>Tài khoản đăng nhập (*)</label>
            <div className="input-wrapper">
              <FiUser className="input-icon" />
              <input
                type="text"
                name="taiKhoan"
                value={formData.taiKhoan}
                onChange={handleChange}
                placeholder="VD: nv_khotong01"
                className="form-input with-icon"
              />
            </div>
          </div>

          {/* Họ và tên */}
          <div className="form-group">
            <label>Họ và tên nhân viên (*)</label>
            <input
              type="text"
              name="hoTen"
              value={formData.hoTen}
              onChange={handleChange}
              placeholder="VD: Nguyễn Văn Khoa"
              className="form-input"
            />
          </div>

          {/* Email */}
          <div className="form-group">
            <label>Email công việc (*)</label>
            <div className="input-wrapper">
              <FiMail className="input-icon" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="VD: khoa.nv@ctutgear.vn"
                className="form-input with-icon"
              />
            </div>
          </div>

          {/* Số điện thoại */}
          <div className="form-group">
            <label>Số điện thoại</label>
            <div className="input-wrapper">
              <FiPhone className="input-icon" />
              <input
                type="text"
                name="soDienThoai"
                maxLength={15}
                value={formData.soDienThoai}
                onChange={handleChange}
                placeholder="VD: 0987654321 (Tối đa 15 số)"
                className="form-input with-icon"
              />
            </div>
          </div>

          {/* Mật khẩu */}
          <div className="form-group">
            <label>Mật khẩu khởi tạo (*)</label>
            <div className="input-wrapper">
              <FiLock className="input-icon" />
              <input
                type="password"
                name="matKhau"
                value={formData.matKhau}
                onChange={handleChange}
                placeholder="••••••••"
                className="form-input with-icon"
              />
            </div>
          </div>

          {/* Xác nhận mật khẩu */}
          <div className="form-group">
            <label>Xác nhận mật khẩu (*)</label>
            <div className="input-wrapper">
              <FiLock className="input-icon" />
              <input
                type="password"
                name="xacNhanMatKhau"
                value={formData.xacNhanMatKhau}
                onChange={handleChange}
                placeholder="••••••••"
                className="form-input with-icon"
              />
            </div>
          </div>
        </div>

        {/* 🌟 CẬP NHẬT: 3 Vai trò chuẩn ADMIN, THUKHO, NVKHO */}
        <div className="role-section">
          <label>Phân quyền Vai trò / Bộ phận (*)</label>
          <div className="role-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>

            {/* 1. Quản trị viên (ADMIN) */}
            <label className={`role-option ${formData.role === 'ADMIN' ? 'active' : ''}`}>
              <input
                type="radio"
                name="role"
                value="ADMIN"
                checked={formData.role === 'ADMIN'}
                onChange={handleChange}
              />
              <div>
                <strong className="role-title"><FiShield /> Quản trị viên</strong>
                <small className="role-desc">Toàn quyền hệ thống (Admin)</small>
              </div>
            </label>

            {/* 2. Thủ kho (THUKHO) */}
            <label className={`role-option ${formData.role === 'THUKHO' ? 'active' : ''}`}>
              <input
                type="radio"
                name="role"
                value="THUKHO"
                checked={formData.role === 'THUKHO'}
                onChange={handleChange}
              />
              <div>
                <strong className="role-title"><FiBox /> Thủ kho</strong>
                <small className="role-desc">Quản lý kho & danh mục</small>
              </div>
            </label>

            {/* 3. Nhân viên kho (NVKHO) */}
            <label className={`role-option ${formData.role === 'NVKHO' ? 'active' : ''}`}>
              <input
                type="radio"
                name="role"
                value="NVKHO"
                checked={formData.role === 'NVKHO'}
                onChange={handleChange}
              />
              <div>
                <strong className="role-title"><FiCheckSquare /> Nhân viên kho</strong>
                <small className="role-desc">Tác nghiệp nhập & xuất kho</small>
              </div>
            </label>

          </div>
        </div>

        {/* Hành động */}
        <div className="form-actions">
          <button
            type="button"
            onClick={onBack}
            className="btn-cancel"
          >
            Hủy bỏ
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn-save"
          >
            <FiSave size={16} /> {loading ? 'Đang lưu...' : 'Lưu tài khoản nhân viên'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddStaffForm;