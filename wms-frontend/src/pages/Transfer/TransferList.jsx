import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiPlus, FiArrowRight, FiRefreshCw, FiRepeat, FiMapPin, FiBox } from 'react-icons/fi';
import { wmsCoreService } from '../../services/wmsCoreService';
import '../Product/ProductManagement.css';

const TransferList = () => {
  const navigate = useNavigate();

  const [transfers, setTransfers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isBackendConnected, setIsBackendConnected] = useState(false);

  const fetchTransfers = async () => {
    try {
      setIsLoading(true);
      const data = await wmsCoreService.getTransfers();
      if (Array.isArray(data)) {
        setTransfers(data);
        setIsBackendConnected(true);
      } else {
        setTransfers([]);
      }
    } catch (e) {
      console.warn('Lỗi lấy danh sách chuyển kho từ Backend:', e.message);
      setIsBackendConnected(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransfers();
  }, []);

  const filteredTransfers = transfers.filter(t => {
    const code = t.maDieuChuyen || '';
    const kn = t.tenKhoNguon || '';
    const kd = t.tenKhoDich || '';
    const sp = t.tenSanPham || '';
    const sku = t.sku || '';
    return code.toLowerCase().includes(searchTerm.toLowerCase()) ||
           kn.toLowerCase().includes(searchTerm.toLowerCase()) ||
           kd.toLowerCase().includes(searchTerm.toLowerCase()) ||
           sp.toLowerCase().includes(searchTerm.toLowerCase()) ||
           sku.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="product-container">
      <div className="product-header">
        <div>
          <h2>Quản Lý Luân Chuyển Hàng Giữa Các Kho</h2>
          <p>Lịch sử điều chuyển, cân bằng lượng tồn kho giữa các chi nhánh vật lý</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn-secondary" onClick={fetchTransfers} disabled={isLoading} title="Làm mới">
            <FiRefreshCw className={isLoading ? 'spin-icon' : ''} /> {isBackendConnected ? 'Backend Live' : 'Đồng bộ'}
          </button>
          <button 
            className="btn-primary" 
            onClick={() => navigate('/transfers/create')}
          >
            <FiPlus size={16} /> Lập Lệnh Chuyển Kho
          </button>
        </div>
      </div>

      <div className="product-toolbar">
        <div className="search-box">
          <FiSearch className="search-icon" />
          <input 
            type="text" 
            placeholder="Tìm theo mã điều chuyển, kho nguồn, kho đích, sản phẩm..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="table-responsive">
        <table className="product-table">
          <thead>
            <tr>
              <th>Mã Điều Chuyển</th>
              <th>Sản Phẩm Luân Chuyển</th>
              <th>Kho Nguồn (Xuất)</th>
              <th></th>
              <th>Kho Đích (Nhập)</th>
              <th style={{ textAlign: 'center' }}>Số Lượng</th>
              <th style={{ textAlign: 'center' }}>Thời Gian</th>
              <th style={{ textAlign: 'center' }}>Trạng Thái</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '40px' }}>
                  <FiRefreshCw className="spin-icon" size={24} style={{ color: '#4f46e5' }} />
                  <p style={{ marginTop: '8px', color: '#64748b' }}>Đang nạp dữ liệu điều chuyển...</p>
                </td>
              </tr>
            ) : filteredTransfers.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                  <FiRepeat size={36} style={{ marginBottom: '8px', opacity: 0.5 }} />
                  <p>Chưa có giao dịch điều chuyển kho nào.</p>
                  <button 
                    className="btn-primary" 
                    style={{ marginTop: '12px' }}
                    onClick={() => navigate('/transfers/create')}
                  >
                    <FiPlus size={16} /> Tạo Lệnh Chuyển Kho Mới
                  </button>
                </td>
              </tr>
            ) : (
              filteredTransfers.map((t) => (
                <tr key={t.id}>
                  <td>
                    <span className="sku-badge">{t.maDieuChuyen}</span>
                  </td>
                  <td>
                    <div className="prod-name-box">
                      <strong>{t.tenSanPham || 'Sản phẩm'}</strong>
                      <small className="prod-sub">SKU: {t.sku} • {t.donViTinh || 'Cái'}</small>
                    </div>
                  </td>
                  <td>
                    <span style={{ color: '#c53030', fontWeight: 600 }}>{t.tenKhoNguon}</span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <FiArrowRight style={{ color: '#64748b' }} />
                  </td>
                  <td>
                    <span style={{ color: '#2b6cb0', fontWeight: 600 }}>{t.tenKhoDich}</span>
                  </td>
                  <td style={{ textAlign: 'center', fontWeight: 700 }}>
                    {t.soLuong}
                  </td>
                  <td style={{ textAlign: 'center', fontSize: '13px', color: '#64748b' }}>
                    {t.ngayDieuChuyen ? new Date(t.ngayDieuChuyen).toLocaleString('vi-VN') : 'Vừa xong'}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span className="status-tag active">
                      {t.trangThai || 'HOÀN THÀNH'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="product-footer">
        <span>Tổng cộng: <strong>{filteredTransfers.length}</strong> lệnh chuyển kho</span>
      </div>
    </div>
  );
};

export default TransferList;

