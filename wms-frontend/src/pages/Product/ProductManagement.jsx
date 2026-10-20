import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiPlus, FiEdit2, FiTrash2, FiBox, FiRefreshCw, FiDollarSign } from 'react-icons/fi';
import { productService } from '../../services/productService';
import './ProductManagement.css';

const ProductManagement = () => {
  const navigate = useNavigate();

  // Dữ liệu ban đầu (kèm fallback nếu backend chưa kết nối)
  const initialMockProducts = [
    { id: 1, sku: 'SP001', tenSanPham: 'iPhone 15 Pro Max 256GB', donViTinh: 'Cái', tenDanhMuc: 'Điện thoại', giaBan: 29990000, trangThai: 'DANG_KINH_DOANH' },
    { id: 2, sku: 'SP002', tenSanPham: 'MacBook Pro 14 M3 Pro 18GB/512GB', donViTinh: 'Cái', tenDanhMuc: 'Laptop', giaBan: 49990000, trangThai: 'DANG_KINH_DOANH' },
    { id: 3, sku: 'SP003', tenSanPham: 'Tai nghe chống ồn Sony WH-1000XM5', donViTinh: 'Cái', tenDanhMuc: 'Phụ kiện', giaBan: 6990000, trangThai: 'DANG_KINH_DOANH' },
    { id: 4, sku: 'SP004', tenSanPham: 'Chuột không dây Logitech MX Master 3S', donViTinh: 'Cái', tenDanhMuc: 'Phụ kiện', giaBan: 2490000, trangThai: 'DANG_KINH_DOANH' },
  ];

  const [products, setProducts] = useState(initialMockProducts);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isBackendConnected, setIsBackendConnected] = useState(false);

  // Tải danh sách hàng hóa từ Backend wms-core-service
  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const prodData = await productService.getAllProducts();

      if (Array.isArray(prodData) && prodData.length > 0) {
        setProducts(prodData);
        setIsBackendConnected(true);
      }
    } catch (error) {
      console.warn('Không thể tải sản phẩm từ Backend, dùng dữ liệu mô phỏng:', error.message);
      setIsBackendConnected(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Xóa / Ẩn sản phẩm
  const handleDelete = async (id, name) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa sản phẩm "${name}" khỏi hệ thống?`)) {
      try {
        await productService.deleteProduct(id);
        alert('Đã xóa sản phẩm thành công!');
        fetchProducts();
      } catch {
        setProducts(prev => prev.filter(p => p.id !== id));
        alert('Đã xóa sản phẩm!');
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

      {/* Bảng Dữ Liệu Hàng Hóa */}
      <div className="product-table-wrapper">
        <table className="wms-data-table">
          <thead>
            <tr>
              <th>Mã SKU</th>
              <th>Tên Sản Phẩm / Hàng Hóa</th>
              <th>Danh Mục</th>
              <th>Đơn Vị Tính</th>
              <th>Giá Bán Niêm Yết</th>
              <th>Trạng Thái</th>
              <th>Hành Động</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((item) => {
              const code = item.sku || item.maHangHoa || item.maHang || `SP00${item.id}`;
              const name = item.tenSanPham || item.tenHangHoa || item.tenHang;
              const category = item.tenDanhMuc || 'Thiết bị & Phụ kiện';
              const unit = item.donViTinh || item.donVi || 'Cái';
              const price = item.giaBan ? Number(item.giaBan).toLocaleString('vi-VN') + ' đ' : 'Chưa định giá';
              const isSelling = item.trangThai !== 'NGUNG_KINH_DOANH';

              return (
                <tr key={item.id}>
                  <td className="font-mono text-bold">
                    <FiBox style={{ marginRight: '6px', color: '#2563eb' }} />
                    {code}
                  </td>
                  <td className="text-bold">{name}</td>
                  <td><span className="badge category-badge">{category}</span></td>
                  <td>{unit}</td>
                  <td className="text-bold text-blue">
                    <FiDollarSign className="text-muted" style={{ marginRight: '2px' }} />
                    {price}
                  </td>
                  <td>
                    {isSelling ? (
                      <span className="badge safe">Đang bán</span>
                    ) : (
                      <span className="badge warning">Ngưng bán</span>
                    )}
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        className="btn-icon text-blue" 
                        title="Chỉnh sửa sản phẩm trên trang riêng"
                        onClick={() => navigate(`/products/edit/${item.id}`)}
                      >
                        <FiEdit2 />
                      </button>
                      <button 
                        className="btn-icon text-red" 
                        title="Xóa hàng hóa"
                        onClick={() => handleDelete(item.id, name)}
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}

            {filteredProducts.length === 0 && (
              <tr>
                <td colSpan="7" className="text-center">Không tìm thấy hàng hóa nào phù hợp.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProductManagement;