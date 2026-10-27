import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiPlus, FiEdit2, FiTrash2, FiLayers, FiRefreshCw } from 'react-icons/fi';
import { wmsCoreService } from '../../services/wmsCoreService';
import '../Product/ProductManagement.css';

const CategoryManagement = () => {
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isBackendConnected, setIsBackendConnected] = useState(false);

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      const data = await wmsCoreService.getCategories();
      if (Array.isArray(data)) {
        setCategories(data);
        setIsBackendConnected(true);
      } else {
        setCategories([]);
      }
    } catch (e) {
      console.warn('Lỗi lấy danh mục từ Backend:', e.message);
      setIsBackendConnected(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

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

  const filteredCategories = categories.filter(c => {
    const name = c.tenDanhMuc || '';
    const desc = c.moTa || '';
    return name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           desc.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="product-container">
      <div className="product-header">
        <div>
          <h2>Quản Lý Danh Mục Ngành Hàng</h2>
          <p>Phân loại hàng hóa và cấu trúc sản phẩm trong toàn bộ hệ thống kho</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn-secondary" onClick={fetchCategories} disabled={isLoading} title="Làm mới">
            <FiRefreshCw className={isLoading ? 'spin-icon' : ''} /> {isBackendConnected ? 'Backend Live' : 'Đồng bộ'}
          </button>
          <button 
            className="btn-primary" 
            onClick={() => navigate('/categories/create')}
          >
            <FiPlus size={16} /> Thêm Danh Mục
          </button>
        </div>
      </div>

      <div className="product-toolbar">
        <div className="search-box">
          <FiSearch className="search-icon" />
          <input 
            type="text" 
            placeholder="Tìm theo tên hoặc mô tả danh mục..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="table-responsive">
        <table className="product-table">
          <thead>
            <tr>
              <th style={{ width: '80px' }}>ID</th>
              <th>Tên Danh Mục</th>
              <th>Mô Tả Chi Tiết</th>
              <th style={{ textAlign: 'right', width: '120px' }}>Hành Động</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center', padding: '40px' }}>
                  <FiRefreshCw className="spin-icon" size={24} style={{ color: '#4f46e5' }} />
                  <p style={{ marginTop: '8px', color: '#64748b' }}>Đang nạp danh mục...</p>
                </td>
              </tr>
            ) : filteredCategories.length === 0 ? (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                  <FiLayers size={36} style={{ marginBottom: '8px', opacity: 0.5 }} />
                  <p>Chưa có danh mục ngành hàng nào.</p>
                  <button 
                    className="btn-primary" 
                    style={{ marginTop: '12px' }}
                    onClick={() => navigate('/categories/create')}
                  >
                    <FiPlus size={16} /> Thêm Danh Mục Mới
                  </button>
                </td>
              </tr>
            ) : (
              filteredCategories.map((c) => (
                <tr key={c.id}>
                  <td><strong>#{c.id}</strong></td>
                  <td>
                    <span className="cat-badge" style={{ fontSize: '13px', padding: '4px 10px' }}>
                      {c.tenDanhMuc}
                    </span>
                  </td>
                  <td>{c.moTa || '—'}</td>
                  <td style={{ textAlign: 'right' }}>
                    <div className="action-btns">
                      <button 
                        className="btn-icon edit" 
                        title="Sửa danh mục"
                        onClick={() => navigate(`/categories/edit/${c.id}`)}
                      >
                        <FiEdit2 size={15} />
                      </button>
                      <button 
                        className="btn-icon delete" 
                        title="Xóa danh mục"
                        onClick={() => handleDelete(c.id, c.tenDanhMuc)}
                      >
                        <FiTrash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="product-footer">
        <span>Tổng cộng: <strong>{filteredCategories.length}</strong> danh mục</span>
      </div>
    </div>
  );
};

export default CategoryManagement;

