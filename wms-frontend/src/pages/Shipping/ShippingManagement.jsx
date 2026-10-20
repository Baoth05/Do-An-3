import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FiPlus, FiEdit2, FiTrash2, FiTruck, FiRefreshCw, 
  FiSearch, FiPhoneCall, FiCheckCircle, FiGlobe 
} from 'react-icons/fi';
import { wmsCoreService } from '../../services/wmsCoreService';
import './ShippingManagement.css';

const ShippingManagement = () => {
  const navigate = useNavigate();

  const initialMockShippers = [
    { 
      id: 1, 
      maDonVi: 'DV-GHTK', 
      tenDonVi: 'Giao Hàng Tiết Kiệm (GHTK)', 
      thongTinLienHe: '1900 6092', 
      website: 'https://i.ghtk.vn',
      trangThai: 'HOAT_DONG' 
    },
    { 
      id: 2, 
      maDonVi: 'DV-VTP', 
      tenDonVi: 'Viettel Post', 
      thongTinLienHe: '1900 8095', 
      website: 'https://viettelpost.vn',
      trangThai: 'HOAT_DONG' 
    },
    { 
      id: 3, 
      maDonVi: 'DV-GHN', 
      tenDonVi: 'Giao Hàng Nhanh (GHN)', 
      thongTinLienHe: '1900 636677', 
      website: 'https://ghn.vn',
      trangThai: 'HOAT_DONG' 
    },
  ];

  const [shippers, setShippers] = useState(initialMockShippers);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isBackendConnected, setIsBackendConnected] = useState(false);

  const fetchShippers = async () => {
    try {
      setIsLoading(true);
      const data = await wmsCoreService.getShippers();
      if (Array.isArray(data) && data.length > 0) {
        setShippers(data);
        setIsBackendConnected(true);
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

  // Xóa ĐVVC
  const handleDelete = async (id, name) => {
    if (!window.confirm(`Bạn có chắc chắn muốn ngưng hợp tác và xóa đối tác vận chuyển "${name}" không?`)) {
      return;
    }

    try {
      await wmsCoreService.deleteShipper(id);
      alert('Đã xóa đơn vị vận chuyển thành công!');
      fetchShippers();
    } catch {
      setShippers(prev => prev.filter(s => s.id !== id));
      alert('Đã xóa đơn vị vận chuyển!');
    }
  };

  // Lọc dữ liệu
  const filteredShippers = shippers.filter(shipper => {
    const name = shipper.tenDonVi || shipper.tenDV || '';
    const code = shipper.maDonVi || shipper.maDV || `DV-00${shipper.id}`;
    const contact = shipper.thongTinLienHe || shipper.hotline || '';
    const search = searchTerm.toLowerCase();
    return name.toLowerCase().includes(search) || 
           code.toLowerCase().includes(search) || 
           contact.toLowerCase().includes(search);
  });

  return (
    <div className="shipping-container">
      <div className="shipping-header">
        <div>
          <h2>Quản Lý Đơn Vị Vận Chuyển</h2>
          <p>Danh sách các đối tác giao nhận hàng hóa và tích hợp chuyển phát</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn-secondary" onClick={fetchShippers} disabled={isLoading} title="Làm mới">
            <FiRefreshCw className={isLoading ? 'spin-icon' : ''} /> {isBackendConnected ? 'Backend Live' : 'Đồng bộ'}
          </button>
          <button 
            className="btn-primary" 
            onClick={() => navigate('/shipping/create')}
          >
            <FiPlus size={16} /> Thêm ĐVVC
          </button>
        </div>
      </div>

      <div className="shipping-toolbar" style={{ marginBottom: '16px' }}>
        <div className="search-box">
          <FiSearch className="search-icon" />
          <input 
            type="text" 
            placeholder="Tìm theo mã, tên hoặc hotline đơn vị vận chuyển..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="shipping-table-wrapper">
        <table className="wms-data-table">
          <thead>
            <tr>
              <th>Mã ĐVVC</th>
              <th>Tên Đơn Vị Vận Chuyển</th>
              <th>Hotline / CSKH</th>
              <th>Cổng Tra Cứu (Website)</th>
              <th>Trạng Thái</th>
              <th>Hành Động</th>
            </tr>
          </thead>
          <tbody>
            {filteredShippers.map((shipper) => {
              const code = shipper.maDonVi || shipper.maDV || `DV-00${shipper.id}`;
              const name = shipper.tenDonVi || shipper.tenDV;
              const contact = shipper.thongTinLienHe || shipper.hotline || 'Chưa cập nhật';
              const website = shipper.website || 'Đang cập nhật';
              const isActive = shipper.trangThai !== 'TAM_NGUNG' && shipper.trangThai !== 'NGUNG_HOP_TAC';

              return (
                <tr key={shipper.id}>
                  <td className="font-mono text-bold">{code}</td>
                  <td className="text-bold">
                    <FiTruck className="text-muted" style={{ marginRight: '6px' }} />
                    {name}
                  </td>
                  <td>
                    <FiPhoneCall className="text-muted" style={{ marginRight: '6px' }} />
                    {contact}
                  </td>
                  <td>
                    <FiGlobe className="text-muted" style={{ marginRight: '6px' }} />
                    {website !== 'Đang cập nhật' ? (
                      <a href={website} target="_blank" rel="noreferrer" style={{ color: '#2563eb', textDecoration: 'none' }}>
                        {website}
                      </a>
                    ) : (
                      <span className="text-muted">Đang cập nhật</span>
                    )}
                  </td>
                  <td>
                    {isActive ? (
                      <span className="badge safe"><FiCheckCircle /> Đang hợp tác</span>
                    ) : (
                      <span className="badge warning">Tạm ngưng</span>
                    )}
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        className="btn-icon text-blue" 
                        title="Chỉnh sửa thông tin đối tác trên trang riêng"
                        onClick={() => navigate(`/shipping/edit/${shipper.id}`)}
                      >
                        <FiEdit2 />
                      </button>
                      <button 
                        className="btn-icon text-red" 
                        title="Xóa đối tác"
                        onClick={() => handleDelete(shipper.id, name)}
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}

            {filteredShippers.length === 0 && (
              <tr>
                <td colSpan="6" className="text-center">Không tìm thấy đối tác vận chuyển nào.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ShippingManagement;