import { useState, useEffect } from 'react';
import { FiLayers, FiTag, FiAlignLeft, FiPlus, FiEdit2, FiTrash2, FiSave, FiX } from 'react-icons/fi';
import { wmsCoreService } from '../../services/wmsCoreService';
// Import file CSS riêng biệt vừa tạo
import './CategoryManagement.css';

const CategoryManagement = () => {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // --- STATE CHO FORM INLINE ---
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Dữ liệu form (Thêm trường maLoai để giống UI thiết kế)
  const [formData, setFormData] = useState({
    maLoai: '',
    tenDanhMuc: '',
    moTa: ''
  });

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      const data = await wmsCoreService.getCategories();
      if (Array.isArray(data)) {
        setCategories(data);
      } else {
        setCategories([]);
      }
    } catch (e) {
      console.warn('Lỗi lấy danh mục từ Backend:', e.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // --- XỬ LÝ NHẬP FORM ---
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({ maLoai: '', tenDanhMuc: '', moTa: '' });
    setIsEditing(false);
    setEditId(null);
  };

  // --- XỬ LÝ LƯU (THÊM / SỬA) ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.tenDanhMuc.trim()) {
      alert('Vui lòng nhập Tên ngành hàng!');
      return;
    }

    try {
      setIsSubmitting(true);
      // Dữ liệu gửi đi (Nếu backend chưa hỗ trợ maLoai, bạn có thể chỉ gửi tenDanhMuc và moTa)
      const payload = {
        tenDanhMuc: formData.tenDanhMuc,
        moTa: formData.moTa,
        maLoai: formData.maLoai // Gửi kèm mã loại
      };

      if (isEditing && editId) {
        await wmsCoreService.updateCategory(editId, payload);
        alert('Cập nhật danh mục thành công!');
      } else {
        await wmsCoreService.createCategory(payload);
        alert('Thêm mới danh mục thành công!');
      }
      
      resetForm();
      fetchCategories();
    } catch (err) {
      alert('Lỗi lưu danh mục: ' + (err.response?.data || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- XỬ LÝ CHỌN ĐỂ SỬA ---
  const handleEditClick = (category) => {
    setIsEditing(true);
    setEditId(category.id);
    setFormData({
      maLoai: category.maLoai || `TH0${category.id}`, // Hiển thị giả lập nếu backend chưa có
      tenDanhMuc: category.tenDanhMuc || '',
      moTa: category.moTa || ''
    });
    // Cuộn lên đầu trang chỗ form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // --- XỬ LÝ XÓA ---
  const handleDelete = async (id, name) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa danh mục "${name}"?`)) {
      try {
        await wmsCoreService.deleteCategory(id);
        alert('Đã xóa danh mục thành công!');
        fetchCategories();
      } catch (err) {
        alert('Lỗi xóa danh mục: ' + (err.response?.data || err.message));
      }
    }
  };

  return (
    <div className="category-container">
      {/* 1. Phần Tiêu đề (Header) */}
      <div className="category-header">
        <h2 className="category-header-title">
          <FiLayers size={28} /> Quản Lý Danh Mục & Ngành Hàng
        </h2>
        <p>Phân loại và tổ chức hệ thống hàng hóa chuyên nghiệp</p>
      </div>

      {/* 2. Phần Form Nhập Liệu (Inline Form) */}
      <div className="category-form-card">
        <h3 className="form-title">
          <span className="title-bar"></span> 
          {isEditing ? 'Cập Nhật Danh Mục' : 'Thêm Danh Mục Mới'}
        </h3>
        
        <form className="category-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label><FiTag size={14} /> Mã Loại</label>
              <input 
                type="text" 
                name="maLoai"
                value={formData.maLoai}
                onChange={handleChange}
                placeholder="VD: AUTO, FOOD..." 
              />
            </div>
            <div className="form-group">
              <label><FiLayers size={14} /> Tên Ngành Hàng</label>
              <input 
                type="text" 
                name="tenDanhMuc"
                value={formData.tenDanhMuc}
                onChange={handleChange}
                required
                placeholder="VD: Phụ tùng ô tô..." 
              />
            </div>
          </div>
          
          <div className="form-group">
            <label><FiAlignLeft size={14} /> Mô Tả Chi Tiết</label>
            <input 
              type="text" 
              name="moTa"
              value={formData.moTa}
              onChange={handleChange}
              placeholder="Nhập mô tả ngắn gọn cho ngành hàng này..." 
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
            <button type="submit" className="btn-add-green" disabled={isSubmitting}>
              {isSubmitting ? <FiLayers className="spin-icon" /> : (isEditing ? <FiSave /> : <FiPlus />)} 
              {isEditing ? 'Lưu Thay Đổi' : 'Thêm Danh Mục'}
            </button>
            {isEditing && (
              <button type="button" className="btn-add-green" style={{ backgroundColor: '#94a3b8' }} onClick={resetForm}>
                <FiX /> Hủy Sửa
              </button>
            )}
          </div>
        </form>
      </div>

      {/* 3. Phần Bảng Dữ Liệu */}
      <div className="category-table-wrapper">
        <table className="cat-table">
          <thead>
            <tr>
              <th style={{ width: '150px' }}>Mã Loại</th>
              <th style={{ width: '30%' }}>Tên Ngành Hàng</th>
              <th>Mô Tả</th>
              <th style={{ width: '120px', textAlign: 'center' }}>Thao Tác</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                  Đang nạp dữ liệu...
                </td>
              </tr>
            ) : categories.length === 0 ? (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                  Chưa có danh mục ngành hàng nào.
                </td>
              </tr>
            ) : (
              categories.map((c) => (
                <tr key={c.id}>
                  <td>
                    {/* Hiển thị Mã Loại. Nếu backend chưa lưu maLoai, tạm dùng ID để giống thiết kế */}
                    <span className="code-badge">{c.maLoai || `TH0${c.id}`}</span>
                  </td>
                  <td>
                    <span className="cat-name">{c.tenDanhMuc}</span>
                  </td>
                  <td>
                    <span className="cat-desc">{c.moTa || '—'}</span>
                  </td>
                  <td>
                    <div className="action-cell" style={{ justifyContent: 'center' }}>
                      <button 
                        className="btn-action edit" 
                        title="Chỉnh sửa"
                        onClick={() => handleEditClick(c)}
                      >
                        <FiEdit2 size={16} />
                      </button>
                      <button 
                        className="btn-action delete" 
                        title="Xóa"
                        onClick={() => handleDelete(c.id, c.tenDanhMuc)}
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CategoryManagement;