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

  const initialMockSuppliers = [
    { 
      id: 1, 
      maNhaCungCap: 'NCC-001', 
      tenNhaCungCap: 'Công ty TNHH Logitech VN', 
      nguoiLienHe: 'Trần Minh Quân', 
      soDienThoai: '0901234567', 
      email: 'b2b@logitech.vn', 
      diaChi: 'Tầng 5, Tòa nhà Bitexco, Q.1, TP.HCM', 
      trangThai: 'HOAT_DONG' 
    },
    { 
      id: 2, 
      maNhaCungCap: 'NCC-002', 
      tenNhaCungCap: 'Đại lý phân phối AKKO', 
      nguoiLienHe: 'Lê Hoàng Phong', 
      soDienThoai: '0912345678', 
      email: 'sales@akko.vn', 
      diaChi: 'Số 123 Đường Cầu Giấy, Hà Nội', 
      trangThai: 'HOAT_DONG' 
    },
    { 
      id: 3, 
      maNhaCungCap: 'NCC-003', 
      tenNhaCungCap: 'Công ty Cổ phần Dell Việt Nam', 
      nguoiLienHe: 'Nguyễn Thị Bích', 
      soDienThoai: '0923456789', 
      email: 'contact@dell.com.vn', 
      diaChi: 'Tòa nhà Landmark 81, Bình Thạnh, TP.HCM', 
      trangThai: 'HOAT_DONG' 
    },
  ];

  const [suppliers, setSuppliers] = useState(initialMockSuppliers);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isBackendConnected, setIsBackendConnected] = useState(false);

  const fetchSuppliers = async () => {
    try {
      setIsLoading(true);
      const data = await wmsCoreService.getSuppliers();
      if (Array.isArray(data) && data.length > 0) {
        setSuppliers(data);
        setIsBackendConnected(true);
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

  // Xóa nhà cung cấp
  const handleDelete = async (id, name) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa nhà cung cấp "${name}" không?`)) {
      return;
    }

    try {
      await wmsCoreService.deleteSupplier(id);
      alert('Đã xóa nhà cung cấp thành công!');
      fetchSuppliers();
    } catch {
      setSuppliers(prev => prev.filter(s => s.id !== id));
      alert('Đã xóa nhà cung cấp!');
    }
  };

  // Lọc dữ liệu theo tên, mã hoặc SĐT
  const filteredSuppliers = suppliers.filter(supplier => {
    const name = supplier.tenNhaCungCap || supplier.tenNCC || '';
    const code = supplier.maNhaCungCap || supplier.maNCC || `NCC-${supplier.id}`;
    const phone = supplier.soDienThoai || supplier.sdt || '';
    const contact = supplier.nguoiLienHe || '';
    const search = searchTerm.toLowerCase();
    return name.toLowerCase().includes(search) || 
           code.toLowerCase().includes(search) || 
           phone.includes(search) ||
           contact.toLowerCase().includes(search);
  });

  return (
    <div className="supplier-container">
      <div className="supplier-header">
        <div>
          <h2>Quản Lý Nhà Cung Cấp</h2>
          <p>Danh sách các đối tác cung cấp hàng hóa cho chuỗi kho vận WMS</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn-secondary" onClick={fetchSuppliers} disabled={isLoading} title="Làm mới">
            <FiRefreshCw className={isLoading ? 'spin-icon' : ''} /> {isBackendConnected ? 'Backend Live' : 'Đồng bộ'}
          </button>
          <button 
            className="btn-primary" 
            onClick={() => navigate('/suppliers/create')}
          >
            <FiPlus size={16} /> Thêm Nhà Cung Cấp
          </button>
        </div>
      </div>

      <div className="supplier-toolbar">
        <div className="search-box">
          <FiSearch className="search-icon" />
          <input 
            type="text" 
            placeholder="Tìm theo mã, tên, người đại diện hoặc số điện thoại..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="supplier-table-wrapper">
        <table className="wms-data-table">
          <thead>
            <tr>
              <th>Mã NCC</th>
              <th>Tên Nhà Cung Cấp</th>
              <th>Đại Diện / Liên Hệ</th>
              <th>Số Điện Thoại</th>
              <th>Địa Chỉ Kho / Trụ Sở</th>
              <th>Trạng Thái</th>
              <th>Thao Tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredSuppliers.map((supplier) => {
              const code = supplier.maNhaCungCap || supplier.maNCC || `NCC-00${supplier.id}`;
              const name = supplier.tenNhaCungCap || supplier.tenNCC;
              const contactPerson = supplier.nguoiLienHe || 'Chưa cập nhật';
              const phone = supplier.soDienThoai || supplier.sdt || 'Chưa cập nhật';
              const address = supplier.diaChi || 'Chưa cập nhật';
              const isActive = supplier.trangThai !== 'TAM_NGUNG' && supplier.trangThai !== 'NGUNG_CUNG_CAP';

              return (
                <tr key={supplier.id}>
                  <td className="font-mono text-bold">
                    <FiBriefcase style={{ marginRight: '6px', color: '#3b82f6' }} />
                    {code}
                  </td>
                  <td className="text-bold">{name}</td>
                  <td>
                    <FiUser className="text-muted" style={{ marginRight: '4px' }} />
                    {contactPerson}
                  </td>
                  <td>
                    <FiPhone className="text-muted" style={{ marginRight: '4px' }} />
                    {phone}
                  </td>
                  <td>
                    <FiMapPin className="text-muted" style={{ marginRight: '4px' }} />
                    {address}
                  </td>
                  <td>
                    {isActive ? (
                      <span className="badge safe"><FiUserCheck /> Hoạt động</span>
                    ) : (
                      <span className="badge warning">Tạm ngưng</span>
                    )}
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        className="btn-icon text-blue" 
                        title="Chỉnh sửa thông tin chi tiết trên trang riêng"
                        onClick={() => navigate(`/suppliers/edit/${supplier.id}`)}
                      >
                        <FiEdit2 />
                      </button>
                      <button 
                        className="btn-icon text-red" 
                        title="Xóa nhà cung cấp"
                        onClick={() => handleDelete(supplier.id, name)}
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            
            {filteredSuppliers.length === 0 && (
              <tr>
                <td colSpan="7" className="text-center">Không tìm thấy nhà cung cấp nào phù hợp.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SupplierManagement;