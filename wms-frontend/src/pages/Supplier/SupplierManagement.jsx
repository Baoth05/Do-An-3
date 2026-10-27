import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FiSearch, FiPlus, FiEdit2, FiTrash2, FiUserCheck, 
  FiRefreshCw, FiPhone, FiMapPin, FiBriefcase, FiUser 
} from 'react-icons/fi';
import { wmsCoreService } from '../../services/wmsCoreService';
import './SupplierManagement.css';

const SupplierManagement = () => {
  const navigate = useNavigate();

  const [suppliers, setSuppliers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isBackendConnected, setIsBackendConnected] = useState(false);

  const fetchSuppliers = async () => {
    try {
      setIsLoading(true);
      const data = await wmsCoreService.getSuppliers();
      if (Array.isArray(data)) {
        setSuppliers(data);
        setIsBackendConnected(true);
      } else {
        setSuppliers([]);
      }
    } catch (e) {
      console.warn('Lỗi lấy nhà cung cấp từ Backend:', e.message);
      setIsBackendConnected(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const handleDelete = async (id, name) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa nhà cung cấp "${name}"?`)) {
      try {
        await wmsCoreService.deleteSupplier(id);
        alert('Đã xóa nhà cung cấp thành công!');
        fetchSuppliers();
      } catch (err) {
        alert('Lỗi xóa nhà cung cấp: ' + (err.response?.data || err.message));
      }
    }
  };

  const filteredSuppliers = suppliers.filter(s => {
    const code = s.maNhaCungCap || '';
    const name = s.tenNhaCungCap || '';
    const contact = s.nguoiLienHe || '';
    const phone = s.soDienThoai || '';
    return code.toLowerCase().includes(searchTerm.toLowerCase()) ||
           name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           contact.toLowerCase().includes(searchTerm.toLowerCase()) ||
           phone.includes(searchTerm);
  });

  return (
    <div className="supplier-container">
      <div className="supplier-header">
        <div>
          <h2>Quản Lý Nhà Cung Cấp Đối Tác (B2B)</h2>
          <p>Hồ sơ nhà sản xuất, phân phối thiết bị và đầu mối liên hệ nhập hàng</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn-secondary" onClick={fetchSuppliers} disabled={isLoading} title="Làm mới">
            <FiRefreshCw className={isLoading ? 'spin-icon' : ''} /> {isBackendConnected ? 'Backend Live' : 'Đồng bộ'}
          </button>
          <button 
            className="btn-primary" 
            onClick={() => navigate('/suppliers/create')}
          >
            <FiPlus size={16} /> Thêm Đối Tác Mới
          </button>
        </div>
      </div>

      <div className="supplier-toolbar">
        <div className="search-box">
          <FiSearch className="search-icon" />
          <input 
            type="text" 
            placeholder="Tìm theo tên công ty, mã đối tác, người liên hệ, SĐT..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="table-responsive">
        <table className="supplier-table">
          <thead>
            <tr>
              <th>Mã NCC</th>
              <th>Tên Công Ty / Doanh Nghiệp</th>
              <th>Người Liên Hệ</th>
              <th>Điện Thoại & Email</th>
              <th>Địa Chỉ Trụ Sở</th>
              <th style={{ textAlign: 'center' }}>Trạng Thái</th>
              <th style={{ textAlign: 'right' }}>Hành Động</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '40px' }}>
                  <FiRefreshCw className="spin-icon" size={24} style={{ color: '#4f46e5' }} />
                  <p style={{ marginTop: '8px', color: '#64748b' }}>Đang nạp dữ liệu nhà cung cấp...</p>
                </td>
              </tr>
            ) : filteredSuppliers.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                  <FiBriefcase size={36} style={{ marginBottom: '8px', opacity: 0.5 }} />
                  <p>Chưa có đối tác nhà cung cấp nào.</p>
                  <button 
                    className="btn-primary" 
                    style={{ marginTop: '12px' }}
                    onClick={() => navigate('/suppliers/create')}
                  >
                    <FiPlus size={16} /> Thêm Nhà Cung Cấp Mới
                  </button>
                </td>
              </tr>
            ) : (
              filteredSuppliers.map((s) => {
                const code = s.maNhaCungCap || `NCC-${s.id}`;
                const name = s.tenNhaCungCap || 'Công ty đối tác';
                const contact = s.nguoiLienHe || 'Chưa cập nhật';
                const phone = s.soDienThoai || '---';
                const email = s.email || '---';
                const address = s.diaChi || 'Toàn quốc';
                const status = s.trangThai || 'HOAT_DONG';

                return (
                  <tr key={s.id}>
                    <td>
                      <span className="ncc-code-badge">{code}</span>
                    </td>
                    <td>
                      <strong>{name}</strong>
                    </td>
                    <td>
                      <div className="contact-person">
                        <FiUser size={13} style={{ color: '#64748b' }} />
                        <span>{contact}</span>
                      </div>
                    </td>
                    <td>
                      <div className="contact-info-cell">
                        <span><FiPhone size={12} /> {phone}</span>
                        {email !== '---' && <small>{email}</small>}
                      </div>
                    </td>
                    <td>
                      <span className="address-text" title={address}>
                        <FiMapPin size={12} /> {address}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className={`status-tag ${status === 'HOAT_DONG' ? 'active' : 'inactive'}`}>
                        {status === 'HOAT_DONG' ? 'Đang hợp tác' : 'Tạm dừng'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="action-btns">
                        <button 
                          className="btn-icon edit" 
                          title="Chỉnh sửa đối tác"
                          onClick={() => navigate(`/suppliers/edit/${s.id}`)}
                        >
                          <FiEdit2 size={15} />
                        </button>
                        <button 
                          className="btn-icon delete" 
                          title="Xóa nhà cung cấp"
                          onClick={() => handleDelete(s.id, name)}
                        >
                          <FiTrash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="supplier-footer">
        <span>Tổng cộng: <strong>{filteredSuppliers.length}</strong> nhà cung cấp</span>
      </div>
    </div>
  );
};

export default SupplierManagement;
