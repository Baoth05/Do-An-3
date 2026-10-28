/**
 * ==============================================================================
 * Module: ProductManagement.jsx
 * Mô tả: Phân hệ Quản lý Danh mục Hàng hóa Master (Master SKU).
 * Tính năng bổ sung: Cột Giá Nhập, Phân trang (Pagination) 10 mục/trang, Chống vỡ Layout.
 * ==============================================================================
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// Thêm Icon FiArrowRight, FiArrowLeft cho nút qua trang, FiInbox cho Giá Nhập
import { FiSearch, FiEdit2, FiTrash2, FiBox, FiRefreshCw, FiTag, FiLayers, FiDollarSign, FiActivity, FiArrowLeft, FiArrowRight, FiInbox, FiEye } from 'react-icons/fi';
import { productService } from '../../services/productService';
import './ProductManagement.css';

const ProductManagement = () => {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isBackendConnected, setIsBackendConnected] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // --- STATE CHO PHÂN TRANG (PAGINATION) ---
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Tải danh sách hàng hóa
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

  // 1. Lọc dữ liệu theo Search (Nếu gõ tìm kiếm, đưa về trang 1)
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset về trang 1 mỗi khi gõ tìm kiếm mới
  };

  const filteredProducts = products.filter(p => {
    const code = p.sku || p.maHangHoa || p.maHang || '';
    const name = p.tenSanPham || p.tenHangHoa || p.tenHang || '';
    return name.toLowerCase().includes(searchTerm.toLowerCase()) || 
           code.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // 2. Tính toán Phân Trang dựa trên danh sách đã lọc
  const totalItems = filteredProducts.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  
  // Xác định vị trí (index) đầu và cuối của mảng để cắt ra 10 phần tử
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  
  // Lấy ra danh sách sản phẩm chỉ riêng cho TRANG HIỆN TẠI
  const currentItems = filteredProducts.slice(indexOfFirstItem, indexOfLastItem);

  // Hàm chuyển trang
  const goToNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };
  const goToPrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

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
            <FiRefreshCw className={isLoading ? 'spin-icon' : ''} size={16} /> 
            {isBackendConnected ? 'Backend Live' : 'Đồng bộ'}
          </button>
        </div>
      </div>

      {errorMsg && (
        <div style={{ background: '#fef2f2', color: '#b91c1c', padding: '12px 16px', borderRadius: '8px', border: '1px solid #f87171' }}>
          {errorMsg}
        </div>
      )}

      {/* Khối Card chứa toàn bộ Tìm kiếm và Bảng */}
      <div className="pm-card">
        {/* Thanh Tìm Kiếm */}
        <div className="product-toolbar">
          <div className="search-box">
            <FiSearch className="search-icon" />
            <input 
              type="text" 
              placeholder="Tìm theo mã SKU hoặc tên sản phẩm..." 
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </div>
        </div>

        {/* Bảng Dữ Liệu Hàng Hóa */}
        <div className="table-responsive">
          <table className="product-table">
            <thead>
              <tr>
                <th><div className="th-content"><FiTag size={14} /> Mã SKU</div></th>
                <th><div className="th-content"><FiBox size={14} /> Tên Hàng Hóa / Sản Phẩm</div></th>
                <th>Đơn Vị Tính</th>
                <th><div className="th-content"><FiLayers size={14} /> Danh Mục</div></th>
                {/* BỔ SUNG CỘT GIÁ NHẬP */}
                <th style={{ textAlign: 'right' }}>
                  <div className="th-content" style={{ justifyContent: 'flex-end' }}><FiInbox size={14} /> Giá Nhập</div>
                </th>
                <th style={{ textAlign: 'right' }}>
                  <div className="th-content" style={{ justifyContent: 'flex-end' }}><FiDollarSign size={14} /> Giá Bán Niêm Yết</div>
                </th>
                <th style={{ textAlign: 'center' }}>
                  <div className="th-content" style={{ justifyContent: 'center' }}><FiActivity size={14} /> Trạng Thái</div>
                </th>
                <th style={{ textAlign: 'right' }}>Hành Động</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '60px' }}>
                    <FiRefreshCw className="spin-icon" size={28} style={{ color: '#3b82f6' }} />
                    <p style={{ marginTop: '12px', color: '#64748b', fontSize: '14px' }}>Đang nạp dữ liệu hàng hóa từ Backend...</p>
                  </td>
                </tr>
              ) : currentItems.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>
                    <FiBox size={48} style={{ marginBottom: '16px', opacity: 0.3 }} />
                    <p style={{ fontSize: '15px' }}>Chưa có sản phẩm nào trong hệ thống hoặc không tìm thấy kết quả.</p>
                  </td>
                </tr>
              ) : (
                /* HIỂN THỊ currentItems THAY VÌ filteredProducts */
                currentItems.map((p) => {
                  const code = p.sku || p.maHangHoa || `SKU-${p.id}`;
                  const name = p.tenSanPham || p.tenHangHoa || 'Sản phẩm chưa đặt tên';
                  const unit = p.donViTinh || 'Cái';
                  const catName = p.tenDanhMuc || 'Chưa phân loại';
                  const importPrice = p.giaNhap || 0; // Thêm Giá Nhập
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
                      <td style={{ textAlign: 'right', color: '#64748b' }}>
                        {formatCurrency(importPrice)}
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
                          {/* BƯỚC 2B: Thêm nút Xem chi tiết */}
                          <button 
                            className="btn-icon view" 
                            title="Xem chi tiết sản phẩm"
                            onClick={() => navigate(`/products/${p.id}`)}
                          >
                            <FiEye size={16} />
                          </button>
                          
                          <button 
                            className="btn-icon edit" 
                            title="Chỉnh sửa sản phẩm"
                            onClick={() => navigate(`/products/edit/${p.id}`)}
                          >
                            <FiEdit2 size={16} />
                          </button>
                          
                          <button 
                            className="btn-icon delete" 
                            title="Xóa sản phẩm"
                            onClick={() => handleDelete(p.id, name)}
                          >
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

        {/* --- THANH ĐIỀU HƯỚNG PHÂN TRANG (PAGINATION) --- */}
        <div className="product-footer">
          <span>
            Đang hiển thị <strong>{currentItems.length > 0 ? indexOfFirstItem + 1 : 0} - {Math.min(indexOfLastItem, totalItems)}</strong> trong tổng số <strong>{totalItems}</strong> sản phẩm
          </span>
          
          {totalPages > 1 && (
            <div className="pagination-controls">
              <button 
                className="btn-page" 
                onClick={goToPrevPage} 
                disabled={currentPage === 1}
              >
                <FiArrowLeft /> Trước
              </button>
              
              <span className="page-info">Trang {currentPage} / {totalPages}</span>
              
              <button 
                className="btn-page" 
                onClick={goToNextPage} 
                disabled={currentPage === totalPages}
              >
                Sau <FiArrowRight />
              </button>
            </div>
          )}
        </div>
        
      </div>
    </div>
  );
};

export default ProductManagement;