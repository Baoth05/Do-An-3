import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiPlus, FiEdit2, FiTrash2, FiHome, FiRefreshCw, FiMapPin } from 'react-icons/fi';
import { wmsCoreService } from '../../services/wmsCoreService';
import '../Product/ProductManagement.css';

const WarehouseManagement = () => {
  const navigate = useNavigate();

  const [warehouses, setWarehouses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isBackendConnected, setIsBackendConnected] = useState(false);

  const fetchWarehouses = async () => {
    try {
      setIsLoading(true);
      const data = await wmsCoreService.getWarehouses();
      if (Array.isArray(data)) {
        setWarehouses(data);
        setIsBackendConnected(true);
      } else {
        setWarehouses([]);
      }
    } catch (e) {
      console.warn('Lỗi lấy danh sách kho từ Backend:', e.message);
      setIsBackendConnected(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWarehouses();
  }, []);

  const handleDelete = async (id, name) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa kho "${name}"?`)) {
      try {
        await wmsCoreService.deleteWarehouse(id);
        alert('Đã xóa kho thành công!');
        fetchWarehouses();
      } catch (err) {
        alert('Lỗi xóa kho: ' + (err.response?.data || err.message));
      }
    }
  };

  const filteredWarehouses = warehouses.filter(w => {
    const code = w.maKho || '';
    const name = w.tenKho || '';
    const addr = w.diaChi || '';
    return code.toLowerCase().includes(searchTerm.toLowerCase()) ||
           name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           addr.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="product-container">
      <div className="product-header">
        <div>
          <h2>Quản Lý Danh Sách Kho Hàng</h2>
          <p>Mạng lưới các chi nhánh kho vật lý, địa chỉ và sức chứa vận hành</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn-secondary" onClick={fetchWarehouses} disabled={isLoading} title="Làm mới">
            <FiRefreshCw className={isLoading ? 'spin-icon' : ''} /> {isBackendConnected ? 'Backend Live' : 'Đồng bộ'}
          </button>
          <button 
            className="btn-primary" 
            onClick={() => navigate('/warehouses/create')}
          >
            <FiPlus size={16} /> Thêm Kho Bãi Mới
          </button>
        </div>
      </div>

      <div className="product-toolbar">
        <div className="search-box">
          <FiSearch className="search-icon" />
          <input 
            type="text" 
            placeholder="Tìm theo mã kho, tên kho hoặc địa chỉ..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="table-responsive">
        <table className="product-table">
          <thead>
            <tr>
              <th>Mã Kho</th>
              <th>Tên Kho Bãi</th>
              <th>Địa Chỉ Vật Lý</th>
              <th style={{ textAlign: 'center' }}>Sức Chứa Tối Đa</th>
              <th style={{ textAlign: 'center' }}>Trạng Thái</th>
              <th style={{ textAlign: 'right' }}>Hành Động</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '40px' }}>
                  <FiRefreshCw className="spin-icon" size={24} style={{ color: '#4f46e5' }} />
                  <p style={{ marginTop: '8px', color: '#64748b' }}>Đang nạp danh sách kho...</p>
                </td>
              </tr>
            ) : filteredWarehouses.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                  <FiHome size={36} style={{ marginBottom: '8px', opacity: 0.5 }} />
                  <p>Chưa có kho hàng nào trong hệ thống.</p>
                  <button 
                    className="btn-primary" 
                    style={{ marginTop: '12px' }}
                    onClick={() => navigate('/warehouses/create')}
                  >
                    <FiPlus size={16} /> Thêm Kho Mới
                  </button>
                </td>
              </tr>
            ) : (
              filteredWarehouses.map((w) => (
                <tr key={w.id}>
                  <td>
                    <span className="sku-badge">{w.maKho}</span>
                  </td>
                  <td>
                    <strong>{w.tenKho}</strong>
                  </td>
                  <td>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#475569' }}>
                      <FiMapPin size={14} /> {w.diaChi || 'Chưa cập nhật'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center', fontWeight: 600 }}>
                    {w.sucChuaToiDa ? Number(w.sucChuaToiDa).toLocaleString('vi-VN') + ' món' : '50.000 món'}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span className={`status-tag ${w.trangThai === 'HOAT_DONG' ? 'active' : 'inactive'}`}>
                      {w.trangThai === 'HOAT_DONG' ? 'Hoạt động' : 'Tạm dừng'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div className="action-btns">
                      <button 
                        className="btn-icon edit" 
                        title="Sửa kho"
                        onClick={() => navigate(`/warehouses/edit/${w.id}`)}
                      >
                        <FiEdit2 size={15} />
                      </button>
                      <button 
                        className="btn-icon delete" 
                        title="Xóa kho"
                        onClick={() => handleDelete(w.id, w.tenKho)}
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
        <span>Tổng cộng: <strong>{filteredWarehouses.length}</strong> kho</span>
      </div>
    </div>
  );
};

export default WarehouseManagement;

