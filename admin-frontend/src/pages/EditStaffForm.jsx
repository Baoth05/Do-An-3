// src/pages/UserManagement/EditStaffForm.jsx
import React, { useState } from 'react';
import { FiArrowLeft, FiSave, FiUser, FiMail, FiPhone, FiShield, FiBox, FiCheckSquare } from 'react-icons/fi';
import { userService } from '../services/userService';
import './AddStaffForm.css'; // Dùng chung kiểu giao diện với form Thêm nhân viên cho đồng bộ

const EditStaffForm = ({ staff, onBack, onSuccess }) => {
    // Điền sẵn dữ liệu cũ của nhân viên vào form
    const [formData, setFormData] = useState({
        id: staff?.id || '',
        taiKhoan: staff?.taiKhoan || '',
        hoTen: staff?.hoTen || staff?.fullName || '',
        email: staff?.email || '',
        soDienThoai: staff?.soDienThoai || staff?.phone || '',
        role: staff?.vaiTro || staff?.role || 'NVKHO',
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

        const cleanHoTen = formData.hoTen.trim();
        const cleanEmail = formData.email.trim();
        const cleanSoDienThoai = formData.soDienThoai.trim();

        if (!cleanHoTen || !cleanEmail) {
            setError('Vui lòng điền đầy đủ các thông tin bắt buộc (*)');
            return;
        }

        try {
            setLoading(true);
            await userService.updateStaff(formData.id, {
                hoTen: cleanHoTen,
                email: cleanEmail,
                soDienThoai: cleanSoDienThoai,
                role: formData.role
            });

            alert('Cập nhật thông tin nhân viên thành công!');
            if (onSuccess) onSuccess();

        } catch (err) {
            const backendError = err.response?.data;
            const errorMsg = typeof backendError === 'string' ? backendError : backendError?.message;
            setError(errorMsg || 'Không thể cập nhật thông tin. Vui lòng kiểm tra lại!');
            console.error('Chi tiết lỗi cập nhật:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="add-staff-container">
            <div className="add-staff-header">
                <button onClick={onBack} className="btn-back">
                    <FiArrowLeft size={16} /> Quay lại danh sách
                </button>
                <h2 className="add-staff-title">CẬP NHẬT THÔNG TIN NHÂN SỰ</h2>
            </div>

            {error && (
                <div className="error-message">
                    ⚠️ {error}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div className="form-grid">
                    {/* Tài khoản (Khóa không cho sửa tên đăng nhập) */}
                    <div className="form-group">
                        <label>Tài khoản đăng nhập (Cố định)</label>
                        <div className="input-wrapper">
                            <FiUser className="input-icon" />
                            <input
                                type="text"
                                value={formData.taiKhoan}
                                disabled
                                className="form-input with-icon"
                                style={{ backgroundColor: '#f1f3f5', cursor: 'not-allowed' }}
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
                            required
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
                                required
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
                                placeholder="VD: 0987654321"
                                className="form-input with-icon"
                            />
                        </div>
                    </div>
                </div>

                {/* Phân quyền Vai trò */}
                <div className="role-section">
                    <label>Phân quyền Vai trò / Bộ phận (*)</label>
                    <div className="role-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>

                        <label className={`role-option ${formData.role === 'ADMIN' ? 'active' : ''}`}>
                            <input type="radio" name="role" value="ADMIN" checked={formData.role === 'ADMIN'} onChange={handleChange} />
                            <div>
                                <strong className="role-title"><FiShield /> Quản trị viên</strong>
                                <small className="role-desc">Toàn quyền hệ thống</small>
                            </div>
                        </label>

                        <label className={`role-option ${formData.role === 'THUKHO' ? 'active' : ''}`}>
                            <input type="radio" name="role" value="THUKHO" checked={formData.role === 'THUKHO'} onChange={handleChange} />
                            <div>
                                <strong className="role-title"><FiBox /> Thủ kho</strong>
                                <small className="role-desc">Quản lý kho & danh mục</small>
                            </div>
                        </label>

                        <label className={`role-option ${formData.role === 'NVKHO' ? 'active' : ''}`}>
                            <input type="radio" name="role" value="NVKHO" checked={formData.role === 'NVKHO'} onChange={handleChange} />
                            <div>
                                <strong className="role-title"><FiCheckSquare /> Nhân viên kho</strong>
                                <small className="role-desc">Tác nghiệp nhập & xuất</small>
                            </div>
                        </label>

                    </div>
                </div>

                {/* Hành động */}
                <div className="form-actions">
                    <button type="button" onClick={onBack} className="btn-cancel">
                        Hủy bỏ
                    </button>
                    <button type="submit" disabled={loading} className="btn-save">
                        <FiSave size={16} /> {loading ? 'Đang cập nhật...' : 'Lưu thay đổi'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default EditStaffForm;