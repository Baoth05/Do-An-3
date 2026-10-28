// src/pages/Product/ProductDetail.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  FiArrowLeft, FiBox, FiInfo, FiDollarSign, 
  FiImage, FiRefreshCw, FiEdit, FiTag, FiLayers, FiFileText 
} from 'react-icons/fi';
import { productService } from '../../services/productService';
import './ProductDetail.css';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const fetchProductDetail = async () => {
      try {
        setIsLoading(true);
        const data = await productService.getProductById(id);
        if (data) {
          setProduct(data);
        } else {
          setErrorMsg('Không tìm thấy thông tin sản phẩm.');
        }
      } catch (err) {
        setErrorMsg('Lỗi tải dữ liệu: ' + (err.message || 'Lỗi kết nối Backend.'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchProductDetail();
  }, [id]);

  const formatCurrency = (val) => {
    if (!val) return '0 đ';
    return Number(val).toLocaleString('vi-VN') + ' đ';
  };

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 20px' }}>
        <FiRefreshCw className="spin-icon" size={36} style={{ color: '#0f766e', marginBottom: '16px' }} />
        <p style={{ color: '#64748b', fontSize: '16px' }}>Đang tải dữ liệu chi tiết sản phẩm...</p>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="product-detail-wrapper">
        <div className="pd-actions">
          <button className="pd-btn pd-btn-outline" onClick={() => navigate('/products')}>
            <FiArrowLeft size={18} /> Quay lại danh sách
          </button>
        </div>
        <div style={{ background: '#fef2f2', color: '#b91c1c', padding: '20px', borderRadius: '8px', border: '1px solid #f87171' }}>
          <strong>Lỗi:</strong> {errorMsg}
        </div>
      </div>
    );
  }

  // Chuẩn bị dữ liệu hiển thị an toàn
  const code = product.sku || product.maHangHoa || `SKU-${product.id}`;
  const name = product.tenSanPham || product.tenHangHoa || 'Sản phẩm chưa đặt tên';
  const isActive = product.trangThai === 'DANG_KINH_DOANH';

  return (
    <div className="product-detail-wrapper">
      
      {/* 1. Phần Header */}
      <div className="pd-header">
        <div className="pd-header-left">
          <button className="pd-btn pd-btn-outline" style={{ padding: '6px 12px', fontSize: '13px' }} onClick={() => navigate('/products')}>
            <FiArrowLeft size={16} /> Quay lại
          </button>
          <h2 className="pd-page-title">Chi Tiết Sản Phẩm: {code}</h2>
        </div>
        
        <div className="pd-actions">
          <button 
            className="pd-btn pd-btn-primary" 
            onClick={() => navigate(`/products/edit/${id}`)}
          >
            <FiEdit size={16} /> Chỉnh sửa sản phẩm
          </button>
        </div>
      </div>

      {/* 2. Bố cục 2 cột: Ảnh & Thông tin nổi bật */}
      <div className="pd-grid">
        
        {/* Cột trái: Khu vực Hình Ảnh */}
        <div className="pd-card">
          <h3 className="pd-card-title"><FiImage /> Hình Ảnh Đại Diện</h3>
          <div className="pd-image-wrapper">
            {product.hinhAnh ? (
              <img src={product.hinhAnh} alt={name} />
            ) : (
              <div className="pd-no-image">
                <FiImage size={48} style={{ opacity: 0.3 }} />
                <span>Sản phẩm chưa có hình ảnh</span>
              </div>
            )}
          </div>
        </div>

        {/* Cột phải: Thông tin cơ bản & Giá */}
        <div className="pd-card">
          <h3 className="pd-card-title"><FiInfo /> Thông Tin Cơ Bản</h3>
          
          <div className="pd-info-list">
            <div className="pd-info-item full-width">
              <span className="pd-label">Tên Hàng Hóa / Sản Phẩm</span>
              <span className="pd-value large">{name}</span>
            </div>

            <div className="pd-info-item">
              <span className="pd-label"><FiTag /> Mã SKU</span>
              <span className="pd-value sku">{code}</span>
            </div>

            <div className="pd-info-item">
              <span className="pd-label">Trạng Thái</span>
              <span className={`pd-status ${isActive ? 'active' : 'inactive'}`}>
                {isActive ? 'Đang kinh doanh' : 'Ngừng kinh doanh'}
              </span>
            </div>

            <div className="pd-info-item">
              <span className="pd-label"><FiLayers /> Danh Mục</span>
              <span className="pd-value">{product.tenDanhMuc || 'Chưa phân loại'}</span>
            </div>

            <div className="pd-info-item">
              <span className="pd-label"><FiBox /> Đơn Vị Tính / Khối lượng</span>
              <span className="pd-value">
                {product.donViTinh || 'N/A'} {product.khoiLuong ? `(≈ ${product.khoiLuong} kg)` : ''}
              </span>
            </div>
            
            <div style={{ gridColumn: 'span 2', height: '1px', background: '#e2e8f0', margin: '8px 0' }}></div>

            <div className="pd-info-item">
              <span className="pd-label"><FiDollarSign /> Giá Bán Niêm Yết</span>
              <span className="pd-value price">{formatCurrency(product.giaBan)}</span>
            </div>

            <div className="pd-info-item">
              <span className="pd-label">Giá Nhập Tham Khảo</span>
              <span className="pd-value price-import">{formatCurrency(product.giaNhap)}</span>
            </div>
          </div>
        </div>

      </div>

      {/* 3. Phần dưới: Mô tả chi tiết (Nằm trải dài hết chiều ngang) */}
      <div className="pd-card">
        <h3 className="pd-card-title"><FiFileText /> Mô Tả & Quy Cách Đóng Gói</h3>
        <div className="pd-desc-content">
          {product.moTa ? product.moTa : <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Không có mô tả cho sản phẩm này.</span>}
        </div>
      </div>

    </div>
  );
};

export default ProductDetail;