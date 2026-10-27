import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiPlus, FiEdit2, FiTrash2, FiBox, FiRefreshCw } from 'react-icons/fi';
import { productService } from '../../services/productService';
import './ProductManagement.css';

const ProductManagement = () => {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isBackendConnected, setIsBackendConnected] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Tải danh sách hàng hóa từ Backend wms-core-service
  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      setErrorMsg('');
      const prodData = await productService.getAllProducts();

      if (Array.isArray(prodData)) {
        setProducts(prodData);
        setIsBackendConnected(true);
      } else {
        setProducts([]);
      }
    } catch (error) {
      console.warn('Không thể tải sản phẩm từ Backend:', error.message);
      setIsBackendConnected(false);
      setErrorMsg('Không thể tải dữ liệu từ máy chủ. Vui lòng kiểm tra backend.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Xóa sản phẩm
  const handleDelete = async (id, name) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa sản phẩm "${name}" khỏi hệ thống?`)) {
      try {
        await productService.deleteProduct(id);
        alert('Đã xóa sản phẩm thành công!');
        fetchProducts();
      } catch (err) {
        alert('Lỗi xóa sản phẩm: ' + (err.response?.data || err.message));
      }
    }
  };

  // Lọc dữ liệu theo tên hoặc mã SKU
  const filteredProducts = products.filter(p => {
    const code = p.sku || p.maHangHoa || p.maHang || '';
    const name = p.tenSanPham || p.tenHangHoa || p.tenHang || '';
    return name.toLowerCase().includes(searchTerm.toLowerCase()) || 
           code.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const formatCurrency = (val) => {
    if (!val) return '0 đ';
    return Number(val).toLocaleString('vi-VN') + ' đ';
  };

  return (
    <div className="product-container">
      {/* Thanh Tiêu Đề */}
      <div className="product-header">
        <div>
          <h2>Quản Lý Danh Mục Hàng Hóa (Master SKU)</h2>
          <p>Hệ thống danh mục sản phẩm, quy cách đóng gói và định giá toàn chuỗi kho</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn-secondary" onClick={fetchProducts} disabled={isLoading} title="Làm mới">
            <FiRefreshCw className={isLoading ? 'spin-icon' : ''} /> {isBackendConnected ? 'Backend Live' : 'Đồng bộ'}
          </button>
          <button 
            className="btn-primary" 
            onClick={() => navigate('/products/create')}
          >
            <FiPlus size={16} /> Thêm Hàng Hóa
          </button>
        </div>
      </div>

      {/* Thanh Tìm Kiếm & Công Cụ */}
      <div className="product-toolbar">
        <div className="search-box">
          <FiSearch className="search-icon" />
          <input 
            type="text" 
            placeholder="Tìm theo mã SKU hoặc tên sản phẩm..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {errorMsg && (
        <div style={{ background: '#fff5f5', color: '#c53030', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px' }}>
          {errorMsg}
        </div>
      )}

      {/* Bảng Dữ Liệu Hàng Hóa */}
      <div className="table-responsive">
        <table className="product-table">
          <thead>
            <tr>
              <th>Mã SKU</th>
              <th>Tên Hàng Hóa / Sản Phẩm</th>
              <th>Đơn Vị Tính</th>
              <th>Danh Mục</th>
              <th style={{ textAlign: 'right' }}>Giá Bán Niêm Yết</th>
              <th style={{ textAlign: 'center' }}>Trạng Thái</th>
              <th style={{ textAlign: 'right' }}>Hành Động</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '40px' }}>
                  <FiRefreshCw className="spin-icon" size={24} style={{ color: '#4f46e5' }} />
                  <p style={{ marginTop: '8px', color: '#64748b' }}>Đang nạp dữ liệu hàng hóa từ Backend...</p>
                </td>
              </tr>
            ) : filteredProducts.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                  <FiBox size={36} style={{ marginBottom: '8px', opacity: 0.5 }} />
                  <p>Chưa có sản phẩm nào trong hệ thống.</p>
                  <button 
                    className="btn-primary" 
                    style={{ marginTop: '12px' }}
                    onClick={() => navigate('/products/create')}
                  >
                    <FiPlus size={16} /> Thêm Sản Phẩm Mới
                  </button>
                </td>
              </tr>
            ) : (
              filteredProducts.map((p) => {
                const code = p.sku || p.maHangHoa || `SKU-${p.id}`;
                const name = p.tenSanPham || p.tenHangHoa || 'Sản phẩm chưa đặt tên';
                const unit = p.donViTinh || 'Cái';
                const catName = p.tenDanhMuc || 'Chưa phân loại';
                const price = p.giaBan || 0;
                const status = p.trangThai || 'DANG_KINH_DOANH';

                return (
                  <tr key={p.id}>
                    <td>
                      <span className="sku-badge">{code}</span>
                    </td>
                    <td>
                      <div className="prod-name-box">
                        <strong>{name}</strong>
                        {p.moTa && <small className="prod-sub">{p.moTa}</small>}
                      </div>
                    </td>
                    <td>{unit}</td>
                    <td>
                      <span className="cat-badge">{catName}</span>
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 600, color: '#0f172a' }}>
                      {formatCurrency(price)}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className={`status-tag ${status === 'DANG_KINH_DOANH' ? 'active' : 'inactive'}`}>
                        {status === 'DANG_KINH_DOANH' ? 'Kinh doanh' : 'Tạm dừng'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="action-btns">
                        <button 
                          className="btn-icon edit" 
                          title="Chỉnh sửa sản phẩm"
                          onClick={() => navigate(`/products/edit/${p.id}`)}
                        >
                          <FiEdit2 size={15} />
                        </button>
                        <button 
                          className="btn-icon delete" 
                          title="Xóa sản phẩm"
                          onClick={() => handleDelete(p.id, name)}
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

      <div className="product-footer">
        <span>Tổng cộng: <strong>{filteredProducts.length}</strong> sản phẩm</span>
      </div>
    </div>
  );
};

export default ProductManagement;
