import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FiSearch, FiPlus, FiEdit2, FiTrash2, 
  FiRefreshCw, FiPhone, FiMail, FiMapPin, FiBriefcase, FiUser, FiBox, FiX
} from 'react-icons/fi';
import { wmsCoreService } from '../../services/wmsCoreService';
import './SupplierManagement.css';

const SupplierManagement = () => {
  const navigate = useNavigate();

  const [suppliers, setSuppliers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isBackendConnected, setIsBackendConnected] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [supplierProducts, setSupplierProducts] = useState([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);

  const fetchSuppliers = async () => {
    try {
      setIsLoading(true);
      const response = await wmsCoreService.getSuppliers();
      const data = Array.isArray(response) ? response : (response?.data || []);
      
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

  const handleViewProducts = async (supplier) => {
    setSelectedSupplier(supplier);
    setIsModalOpen(true);
    setIsLoadingProducts(true);

    try {
      // Ưu tiên danhSachSanPham theo Entity chuẩn
      const embeddedProducts = supplier.danhSachSanPham || supplier.sanPhamCungCap || supplier.products;
      if (Array.isArray(embeddedProducts) && embeddedProducts.length > 0) {
        setSupplierProducts(embeddedProducts);
        setIsLoadingProducts(false);
        return;
      }

      const allProductsRes = await wmsCoreService.getProducts();
      const allProducts = Array.isArray(allProductsRes) ? allProductsRes : (allProductsRes?.data || []);

      const matchedProducts = allProducts.filter(p => {
        const pSupplierId = p.nhaCungCap?.id || p.nhaCungCapId || p.supplierId;
        const pSupplierCode = p.nhaCungCap?.maNhaCungCap || p.maNhaCungCap;
        return String(pSupplierId) === String(supplier.id) ||
               (pSupplierCode && String(pSupplierCode) === String(supplier.maNhaCungCap));
      });

      setSupplierProducts(matchedProducts);
    } catch (error) {
      console.error('Lỗi khi tải danh sách sản phẩm:', error);
      setSupplierProducts([]);
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const filteredSuppliers = suppliers.filter(s => {
    const code = s.maNhaCungCap || '';
    const name = s.tenNhaCungCap || '';
    const contact = s.nguoiLienHe || '';
    const phone = s.soDienThoai || '';
    const email = s.email || '';
    const mst = s.maSoThue || ''; // Hỗ trợ tìm kiếm theo Mã số thuế
    
    return code.toLowerCase().includes(searchTerm.toLowerCase()) ||
           name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           contact.toLowerCase().includes(searchTerm.toLowerCase()) ||
           mst.includes(searchTerm) ||
           phone.includes(searchTerm) ||
           email.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="supplier-container">
      <div className="supplier-header">
        <div>
          <h2>Quản Lý Nhà Cung Cấp Đối Tác (B2B)</h2>
          <p>Hồ sơ nhà sản xuất, phân phối thiết bị và đầu mối liên hệ nhập hàng</p>
        </div>
        <div className="header-actions">
          <button className="btn-secondary" onClick={fetchSuppliers} disabled={isLoading}>
            <FiRefreshCw className={isLoading ? 'spin-icon' : ''} size={16} /> 
            {isBackendConnected ? 'Backend Live' : 'Đồng bộ'}
          </button>
          <button className="btn-primary" onClick={() => navigate('/suppliers/create')}>
            <FiPlus size={18} /> Thêm Đối Tác Mới
          </button>
        </div>
      </div>

      <div className="supplier-toolbar">
        <div className="search-box">
          <FiSearch className="search-icon" />
          <input 
            type="text" 
            placeholder="Tìm theo tên công ty, mã đối tác, MST, người liên hệ, SĐT, email..." 
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
              <th>Số Điện Thoại</th>
              <th>Email Hợp Tác</th>
              <th>Địa Chỉ Trụ Sở</th>
              <th style={{ textAlign: 'center' }}>Trạng Thái</th>
              <th style={{ textAlign: 'right' }}>Hành Động</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '60px 0' }}>
                  <FiRefreshCw className="spin-icon" size={28} style={{ color: '#2563eb' }} />
                  <p style={{ marginTop: '12px', color: '#64748b' }}>Đang nạp dữ liệu nhà cung cấp...</p>
                </td>
              </tr>
            ) : filteredSuppliers.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '60px 0', color: '#64748b' }}>
                  <FiBriefcase size={48} style={{ marginBottom: '16px', opacity: 0.3 }} />
                  <p>Chưa có đối tác nhà cung cấp nào được tìm thấy.</p>
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
                    <td><span className="ncc-code-badge">{code}</span></td>
                    <td><strong style={{ color: '#0f172a', fontSize: '14px' }}>{name}</strong></td>
                    <td>
                      <div className="contact-person">
                        <FiUser size={14} style={{ color: '#94a3b8' }} />
                        <span>{contact}</span>
                      </div>
                    </td>
                    <td>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#334155' }}>
                        <FiPhone size={13} style={{ color: '#94a3b8' }} /> {phone}
                      </span>
                    </td>
                    <td>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#334155' }}>
                        <FiMail size={13} style={{ color: '#94a3b8' }} /> {email}
                      </span>
                    </td>
                    <td>
                      <span className="address-text" title={address}>
                        <FiMapPin size={14} style={{ color: '#94a3b8' }} /> {address}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className={`status-tag ${status === 'HOAT_DONG' ? 'active' : 'inactive'}`}>
                        {status === 'HOAT_DONG' ? 'Đang hợp tác' : 'Tạm dừng'}
                      </span>
                    </td>
                    <td>
                      <div className="action-btns">
                        <button className="btn-icon view" title="Xem danh sách sản phẩm" onClick={() => handleViewProducts(s)}>
                          <FiBox size={16} />
                        </button>
                        <button className="btn-icon edit" title="Chỉnh sửa đối tác" onClick={() => navigate(`/suppliers/edit/${s.id}`)}>
                          <FiEdit2 size={16} />
                        </button>
                        <button className="btn-icon delete" title="Xóa nhà cung cấp" onClick={() => handleDelete(s.id, name)}>
                          <FiTrash2 size={16} />
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

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Danh Sách Sản Phẩm: {selectedSupplier?.tenNhaCungCap}</h3>
              <button className="close-modal" onClick={() => setIsModalOpen(false)}><FiX size={20}/></button>
            </div>
            <div className="modal-body">
              {isLoadingProducts ? (
                <p style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>Đang nạp danh sách sản phẩm...</p>
              ) : supplierProducts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px 0', color: '#64748b' }}>
                  <FiBox size={36} style={{ marginBottom: '8px', opacity: 0.4 }} />
                  <p>Nhà cung cấp này chưa gắn sản phẩm nào.</p>
                </div>
              ) : (
                <table className="supplier-table">
                  <thead>
                    <tr>
                      <th>Mã SP (SKU)</th>
                      <th>Tên Sản Phẩm</th>
                      <th>Đơn Vị Tính</th>
                      <th>Giá Nhập</th>
                      <th>Giá Bán</th>
                    </tr>
                  </thead>
                  <tbody>
                    {supplierProducts.map((prod, idx) => (
                      <tr key={prod.id || idx}>
                        <td>
                          <span className="ncc-code-badge">
                            {prod.sku || prod.maSanPham || `SP-${idx + 1}`}
                          </span>
                        </td>
                        <td><strong>{prod.tenSanPham || 'Chưa đặt tên'}</strong></td>
                        <td>{prod.donViTinh || '---'}</td>
                        <td>{prod.giaNhap ? `${Number(prod.giaNhap).toLocaleString('vi-VN')} VNĐ` : (prod.gia || '0 VNĐ')}</td>
                        <td>{prod.giaBan ? `${Number(prod.giaBan).toLocaleString('vi-VN')} VNĐ` : '---'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="supplier-footer">
        <span>Tổng cộng: <strong style={{ color: '#0f172a' }}>{filteredSuppliers.length}</strong> nhà cung cấp</span>
      </div>
    </div>
  );
};

export default SupplierManagement;