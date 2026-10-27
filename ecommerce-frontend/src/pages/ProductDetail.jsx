// src/pages/ProductDetail.jsx
import { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import { marketplaceService } from '../services/marketplaceService';
import { CartContext } from '../context/CartContext';
import { 
  FiShoppingCart, FiStar, FiTruck, FiShield, 
  FiCheckCircle, FiMessageSquare, FiShoppingBag, FiCheck 
} from 'react-icons/fi';
import './ProductDetail.css';

const ProductDetail = () => {
  const { productId } = useParams();
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('desc'); // desc, reviews
  const [addedNotice, setAddedNotice] = useState(false);
  const [loading, setLoading] = useState(true);

  const { addToCart } = useContext(CartContext);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const allProds = await marketplaceService.getMarketplaceProducts();
        const found = allProds.find((p) => p.sanPhamId === Number(productId)) || allProds[0];
        setProduct(found);

        if (found?.sku) {
          const revs = await marketplaceService.getReviews(found.sku);
          setReviews(revs);
        }
      } catch (err) {
        console.error('Lỗi tải sản phẩm:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [productId]);

  const handleAddToCart = () => {
    if (!product) return;
    addToCart(product, quantity);
    setAddedNotice(true);
    setTimeout(() => setAddedNotice(false), 2500);
  };

  if (loading || !product) {
    return (
      <div className="container loading-container">
        <div className="spinner"></div>
        <p>Đang tải chi tiết sản phẩm...</p>
      </div>
    );
  }

  const price = product.giaBanHienTai || product.giaBan || 0;
  const originalPrice = product.giaBan || price;
  const hasDiscount = originalPrice > price;

  return (
    <div className="product-detail-page">
      <div className="container">
        {/* Breadcrumb */}
        <div className="detail-breadcrumb">
          <Link to="/">Trang Chủ</Link> / 
          <span>{product.danhMuc || 'Sản Phẩm'}</span> / 
          <strong>{product.tenSanPham}</strong>
        </div>

        {/* Thông tin chính của sản phẩm */}
        <div className="product-main-grid">
          {/* Cột Trái: Ảnh sản phẩm */}
          <div className="product-gallery">
            <div className="main-image-wrap">
              <img src={product.hinhAnh || 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800'} alt={product.tenSanPham} />
              {hasDiscount && <span className="detail-discount-tag">GIẢM GIÁ</span>}
            </div>
          </div>

          {/* Cột Phải: Thông tin giá & Mua hàng */}
          <div className="product-info-column">
            <div className="sku-badge">SKU: {product.sku}</div>
            <h2 className="detail-title">{product.tenSanPham}</h2>

            <div className="detail-rating-meta">
              <span className="stars">★★★★★</span>
              <span className="rating-num">5.0</span>
              <span className="divider">•</span>
              <span className="sold-meta">Đã bán {product.soLuongDaBan || 15}</span>
            </div>

            {/* Bảng giá */}
            <div className="detail-price-box">
              <span className="detail-sale-price">{Number(price).toLocaleString('vi-VN')} đ</span>
              {hasDiscount && (
                <span className="detail-orig-price">{Number(originalPrice).toLocaleString('vi-VN')} đ</span>
              )}
              <span className="price-tag-badge">Chính Hãng 100%</span>
            </div>

            {/* Hộp Thông Tin Gian Hàng Cung Cấp */}
            <div className="store-profile-box">
              <div className="store-box-header">
                <FiShoppingBag className="store-box-icon" />
                <div>
                  <span className="store-label">CUNG CẤP BỞI GIAN HÀNG:</span>
                  <h4 className="store-title">{product.tenShop || product.tenKho}</h4>
                </div>
              </div>
              <p className="store-sub">{product.moTaShop || 'Đại lý phân phối ủy quyền thuộc hệ sinh thái CTUT Gear'}</p>
              <Link to={`/stores/${product.khoHangId}`} className="btn-view-store-profile">
                Xem Trang Shop & Nhận Voucher →
              </Link>
            </div>

            {/* Tồn kho & Chọn số lượng */}
            <div className="stock-selection-section">
              <div className="qty-row">
                <span className="label-text">Số lượng:</span>
                <div className="detail-qty-control">
                  <button onClick={() => setQuantity((q) => Math.max(1, q - 1))}>-</button>
                  <input 
                    type="number" 
                    value={quantity} 
                    onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))} 
                  />
                  <button onClick={() => setQuantity((q) => q + 1)}>+</button>
                </div>
                <span className="stock-count">
                  (Còn {product.soLuongThucTe || 0} sản phẩm trong kho)
                </span>
              </div>

              <div className="action-buttons-group">
                <button 
                  className="btn-add-cart-large"
                  onClick={handleAddToCart}
                >
                  <FiShoppingCart size={20} />
                  {addedNotice ? 'Đã Thêm Vào Giỏ!' : 'Thêm Vào Giỏ Hàng'}
                </button>
                <Link to="/cart" className="btn-buy-now" onClick={handleAddToCart}>
                  Mua Ngay
                </Link>
              </div>

              {addedNotice && (
                <div className="added-success-alert">
                  <FiCheckCircle /> Đã thêm {quantity} sản phẩm vào giỏ hàng thành công!
                </div>
              )}
            </div>

            {/* Chính sách bảo hành & Giao hàng */}
            <div className="policy-highlights">
              <div className="p-item">
                <FiTruck /> Giao hàng nhanh 24h - 48h toàn quốc
              </div>
              <div className="p-item">
                <FiShield /> Bảo hành chính hãng 12 tháng tại Kho Tổng CTUT
              </div>
              <div className="p-item">
                <FiCheck /> Đổi trả trong 7 ngày nếu lỗi phần cứng
              </div>
            </div>
          </div>
        </div>

        {/* Tabs: Mô tả chi tiết & Đánh giá khách hàng */}
        <div className="detail-tabs-section">
          <div className="tabs-header">
            <button 
              className={`tab-btn ${activeTab === 'desc' ? 'active' : ''}`}
              onClick={() => setActiveTab('desc')}
            >
              Mô Tả Sản Phẩm
            </button>
            <button 
              className={`tab-btn ${activeTab === 'reviews' ? 'active' : ''}`}
              onClick={() => setActiveTab('reviews')}
            >
              Đánh Giá Khách Hàng ({reviews.length})
            </button>
          </div>

          <div className="tab-content-panel">
            {activeTab === 'desc' && (
              <div className="desc-content">
                <p>{product.moTa || 'Sản phẩm được phân phối chính hãng qua hệ thống phân phối 2 tầng WMS & E-commerce.'}</p>
                <div className="spec-table">
                  <div className="spec-row">
                    <span>Đơn vị tính:</span>
                    <strong>{product.donViTinh || 'Cái'}</strong>
                  </div>
                  <div className="spec-row">
                    <span>Ngành hàng:</span>
                    <strong>{product.danhMuc || 'Thiết bị công nghệ'}</strong>
                  </div>
                  <div className="spec-row">
                    <span>Kho cung ứng:</span>
                    <strong>{product.tenKho || 'Kho Tổng Trung Tâm'}</strong>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="reviews-content">
                {reviews.length === 0 ? (
                  <p>Chưa có đánh giá nào cho sản phẩm này.</p>
                ) : (
                  reviews.map((r) => (
                    <div key={r.id} className="review-item">
                      <div className="review-header">
                        <span className="reviewer-name">Khách hàng #{r.nguoiDungId || '101'}</span>
                        {r.daMuaHang && (
                          <span className="verified-buyer-badge">
                            <FiCheckCircle size={12} /> Đã mua hàng tại Shop
                          </span>
                        )}
                        <span className="review-stars">{'★'.repeat(r.soSao || 5)}</span>
                      </div>
                      <p className="review-text">{r.noiDung}</p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
