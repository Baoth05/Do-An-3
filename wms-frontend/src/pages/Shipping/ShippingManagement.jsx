import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FiSearch, FiPlus, FiEdit2, FiTrash2, FiTruck, 
  FiRefreshCw, FiPhone, FiGlobe, FiCheckCircle 
} from 'react-icons/fi';
import { wmsCoreService } from '../../services/wmsCoreService';
import './ShippingManagement.css';

const ShippingManagement = () => {
  const navigate = useNavigate();

  const [shippers, setShippers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isBackendConnected, setIsBackendConnected] = useState(false);

  const fetchShippers = async () => {
    try {
      setIsLoading(true);
      const data = await wmsCoreService.getShippers();
      if (Array.isArray(data)) {
        setShippers(data);
        setIsBackendConnected(true);
      } else {
        setShippers([]);
      }
    } catch (e) {
      console.warn('Lỗi lấy đơn vị vận chuyển từ Backend:', e.message);
      setIsBackendConnected(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchShippers();
  }, []);

  const handleDelete = async (id, name) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa đơn vị vận chuyển "${name}"?`)) {
      try {
        await wmsCoreService.deleteShipper(id);
        alert('Đã xóa đơn vị vận chuyển thành công!');
        fetchShippers();
      } catch (err) {
        alert('Lỗi xóa đơn vị vận chuyển: ' + (err.response?.data || err.message));
      }
    }
  };

  const filteredShippers = shippers.filter(s => {
    const code = s.maDonVi || '';
    const name = s.tenDonVi || '';
    const contact = s.thongTinLienHe || '';
    return code.toLowerCase().includes(searchTerm.toLowerCase()) ||
           name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           contact.includes(searchTerm);
  });

  return (
    <div className="shipping-container">
      <div className="shipping-header">
        <div>
          <h2>Quản Lý Đơn Vị Vận Chuyển (3PL & Courier)</h2>
          <p>Danh sách các đối tác giao vận, bưu cục lấy hàng và liên kết tracking</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn-secondary" onClick={fetchShippers} disabled={isLoading} title="Làm mới">
            <FiRefreshCw className={isLoading ? 'spin-icon' : ''} /> {isBackendConnected ? 'Backend Live' : 'Đồng bộ'}
          </button>
          <button 
            className="btn-primary" 
            onClick={() => navigate('/shipping/create')}
          >
            <FiPlus size={16} /> Thêm Đối Tác Vận Chuyển
          </button>
        </div>
      </div>

      <div className="shipping-toolbar">
        <div className="search-box">
          <FiSearch className="search-icon" />
          <input 
            type="text" 
            placeholder="Tìm theo tên hãng vận chuyển, mã đơn vị, hotline..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="table-responsive">
        <table className="shipping-table">
          <thead>
            <tr>
              <th>Mã ĐVVC</th>
              <th>Tên Đơn Vị Giao Vận</th>
              <th>Hotline Hỗ Trợ</th>
              <th>Website / Cổng Tra Cứu</th>
              <th style={{ textAlign: 'center' }}>Trạng Thái</th>
              <th style={{ textAlign: 'right' }}>Hành Động</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '40px' }}>
                  <FiRefreshCw className="spin-icon" size={24} style={{ color: '#4f46e5' }} />
                  <p style={{ marginTop: '8px', color: '#64748b' }}>Đang nạp đối tác giao vận...</p>
                </td>
              </tr>
            ) : filteredShippers.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                  <FiTruck size={36} style={{ marginBottom: '8px', opacity: 0.5 }} />
                  <p>Chưa có đối tác giao vận nào trong hệ thống.</p>
                  <button 
                    className="btn-primary" 
                    style={{ marginTop: '12px' }}
                    onClick={() => navigate('/shipping/create')}
                  >
                    <FiPlus size={16} /> Thêm Đối Tác Vận Chuyển
                  </button>
                </td>
              </tr>
            ) : (
              filteredShippers.map((s) => {
                const code = s.maDonVi || `DV-${s.id}`;
                const name = s.tenDonVi || 'Đơn vị vận chuyển';
                const phone = s.thongTinLienHe || '1900 xxxx';
                const website = s.website || '---';
                const status = s.trangThai || 'HOAT_DONG';

                return (
                  <tr key={s.id}>
                    <td>
                      <span className="shipper-code-badge">{code}</span>
                    </td>
                    <td>
                      <div className="shipper-name-box">
                        <FiTruck size={16} style={{ color: '#4f46e5' }} />
                        <strong>{name}</strong>
                      </div>
                    </td>
                    <td>
                      <div className="contact-phone">
                        <FiPhone size={13} style={{ color: '#64748b' }} />
                        <span>{phone}</span>
                      </div>
                    </td>
                    <td>
                      {website !== '---' ? (
                        <a 
                          href={website.startsWith('http') ? website : `https://${website}`} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="website-link"
                        >
                          <FiGlobe size={13} /> {website.replace('https://', '').replace('http://', '')}
                        </a>
                      ) : (
                        <span>---</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className={`status-tag ${status === 'HOAT_DONG' ? 'active' : 'inactive'}`}>
                        {status === 'HOAT_DONG' ? 'Đang kết nối' : 'Tạm ngắt'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="action-btns">
                        <button 
                          className="btn-icon edit" 
                          title="Chỉnh sửa đơn vị"
                          onClick={() => navigate(`/shipping/edit/${s.id}`)}
                        >
                          <FiEdit2 size={15} />
                        </button>
                        <button 
                          className="btn-icon delete" 
                          title="Xóa đơn vị"
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

      <div className="shipping-footer">
        <span>Tổng cộng: <strong>{filteredShippers.length}</strong> hãng vận chuyển</span>
      </div>
    </div>
  );
};

export default ShippingManagement;
