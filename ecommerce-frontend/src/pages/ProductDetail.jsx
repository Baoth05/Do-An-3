// src/pages/ProductDetail.jsx
import { useState, useEffect, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { marketplaceService } from '../services/marketplaceService';
import { CartContext } from '../context/CartContext';
import { 
  FiShoppingCart, FiStar, FiTruck, FiShield, 
  FiCheckCircle, FiMessageSquare, FiShoppingBag, FiCheck, FiSend, FiUser 
} from 'react-icons/fi';
import './ProductDetail.css';

const ProductDetail = () => {
  const { productId } = useParams();
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [comments, setComments] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('desc'); // desc, reviews, comments
  const [addedNotice, setAddedNotice] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form Đánh Giá mới (Review Create CRUD)
  const [newReviewStar, setNewReviewStar] = useState(5);
  const [newReviewContent, setNewReviewContent] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewSuccessMsg, setReviewSuccessMsg] = useState('');

  // Form Bình Luận mới (Comment Create CRUD)
  const [newCommentContent, setNewCommentContent] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [commentSuccessMsg, setCommentSuccessMsg] = useState('');

  const { addToCart } = useContext(CartContext);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProductData = async () => {
      setLoading(true);
      try {
        const allProds = await marketplaceService.getMarketplaceProducts();
        let found = allProds.find((p) => p.sanPhamId === Number(productId) || p.id === Number(productId));

        // Nếu chưa tìm thấy từ danh sách đang bán, thử gọi trực tiếp getProductById
        if (!found) {
          const directProd = await marketplaceService.getProductById(productId);
          if (directProd) {
            found = {
              id: directProd.id,
              sanPhamId: directProd.id,
              sku: directProd.sku,
              tenSanPham: directProd.tenHangHoa || directProd.tenSanPham,
              giaBan: directProd.giaBan,
              giaBanHienTai: directProd.giaBan,
              soLuongThucTe: directProd.soLuongTon || 0,
              soLuongDaBan: 0,
              danhMuc: directProd.danhMuc?.tenDanhMuc || directProd.danhMuc,
              hinhAnh: directProd.hinhAnh,
              moTa: directProd.moTa,
              donViTinh: directProd.donViTinh,
              khoHangId: directProd.khoHangId || 2,
              tenShop: 'Gian Hàng Chính Hãng',
            };
          }
        }

        setProduct(found || null);

        if (found?.sku) {
          const [revs, comms] = await Promise.all([
            marketplaceService.getReviews(found.sku),
            marketplaceService.getComments(found.sku),
          ]);
          setReviews(revs || []);
          setComments(comms || []);
        }
      } catch (err) {
        console.error('Lỗi tải sản phẩm:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProductData();
  }, [productId]);

  const maxStock = product?.soLuongThucTe || 99;

  const handleAddToCart = () => {
    if (!product) return;
    const finalQty = Math.min(quantity, maxStock);
    addToCart(product, finalQty);
    setAddedNotice(true);
    setTimeout(() => setAddedNotice(false), 2500);
  };

  const handleBuyNow = () => {
    if (!product) return;
    const finalQty = Math.min(quantity, maxStock);
    addToCart(product, finalQty);
    navigate('/cart');
  };

  // Gửi Đánh Giá Mới (Reviews CRUD - Create)
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!newReviewContent.trim()) {
      alert('Vui lòng nhập nội dung đánh giá của bạn!');
      return;
    }

    setIsSubmittingReview(true);
    try {
      const payload = {
        nguoiDungId: 101, // Mock User ID
        cuaHangId: product.khoHangId,
        maHangHoa: product.sku,
        donHangId: 'DH-SAMPLE',
        soSao: newReviewStar,
        noiDung: newReviewContent.trim(),
      };

      const created = await marketplaceService.createReview(payload);
      setReviews([created, ...reviews]);
      setNewReviewContent('');
      setReviewSuccessMsg('Cảm ơn bạn! Đánh giá của bạn đã được ghi nhận.');
      setTimeout(() => setReviewSuccessMsg(''), 3000);
    } catch (err) {
      alert('Lỗi gửi đánh giá: ' + err.message);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Gửi Bình Luận / Hỏi Đáp Mới (Comments CRUD - Create)
  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!newCommentContent.trim()) {
      alert('Vui lòng nhập nội dung bình luận / câu hỏi!');
      return;
    }

    setIsSubmittingComment(true);
    try {
      const payload = {
        nguoiDungId: 101,
        cuaHangId: product.khoHangId,
        maHangHoa: product.sku,
        noiDung: newCommentContent.trim(),
      };

      const created = await marketplaceService.createComment(payload);
      setComments([created, ...comments]);
      setNewCommentContent('');
      setCommentSuccessMsg('Đã đăng bình luận thành công!');
      setTimeout(() => setCommentSuccessMsg(''), 3000);
    } catch (err) {
      alert('Lỗi đăng bình luận: ' + err.message);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  if (loading) {
    return (
      <div className="container loading-container">
        <div className="spinner"></div>
        <p>Đang tải chi tiết sản phẩm...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container empty-cart-container" style={{ textAlign: 'center', padding: '60px 20px' }}>
        <h3>Không tìm thấy sản phẩm!</h3>
        <p>Sản phẩm này hiện chưa được mở bán trên sàn hoặc đã bị chủ cửa hàng gỡ xuống.</p>
        <Link to="/" className="btn-continue-shopping">Quay Về Trang Chủ</Link>
      </div>
    );
  }

  const price = product.giaBanHienTai || product.giaBan || 0;
  const originalPrice = product.giaBan || price;
  const hasDiscount = originalPrice > price;

  // Tính rating trung bình
  const avgRating = reviews.length > 0 
    ? (reviews.reduce((s, r) => s + (r.soSao || 5), 0) / reviews.length).toFixed(1)
    : '5.0';

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
              <img 
                src={product.hinhAnh || 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800'} 
                alt={product.tenSanPham} 
              />
              {hasDiscount && <span className="detail-discount-tag">GIẢM GIÁ</span>}
            </div>
          </div>

          {/* Cột Phải: Thông tin giá & Mua hàng */}
          <div className="product-info-column">
            <div className="sku-badge">SKU: {product.sku}</div>
            <h2 className="detail-title">{product.tenSanPham}</h2>

            <div className="detail-rating-meta">
              <span className="stars">★</span>
              <span className="rating-num">{avgRating}</span>
              <span className="divider">•</span>
              <span className="reviews-count-meta">{reviews.length} đánh giá</span>
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
                  <button 
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                  >
                    -
                  </button>
                  <input 
                    type="number" 
                    min="1"
                    max={maxStock}
                    value={quantity} 
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      if (!isNaN(val)) {
                        setQuantity(Math.min(Math.max(1, val), maxStock));
                      }
                    }} 
                  />
                  <button 
                    onClick={() => setQuantity((q) => Math.min(maxStock, q + 1))}
                    disabled={quantity >= maxStock}
                  >
                    +
                  </button>
                </div>
                <span className="stock-count">
                  (Còn {maxStock} sản phẩm trong kho)
                </span>
              </div>

              <div className="action-buttons-group">
                <button 
                  className="btn-add-cart-large"
                  onClick={handleAddToCart}
                  disabled={maxStock <= 0}
                >
                  <FiShoppingCart size={20} />
                  {addedNotice ? 'Đã Thêm Vào Giỏ!' : 'Thêm Vào Giỏ Hàng'}
                </button>
                <button 
                  className="btn-buy-now" 
                  onClick={handleBuyNow}
                  disabled={maxStock <= 0}
                >
                  Mua Ngay
                </button>
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

        {/* Tabs: Mô tả chi tiết & Đánh giá khách hàng & Hỏi đáp */}
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
            <button 
              className={`tab-btn ${activeTab === 'comments' ? 'active' : ''}`}
              onClick={() => setActiveTab('comments')}
            >
              Hỏi Đáp & Bình Luận ({comments.length})
            </button>
          </div>

          <div className="tab-content-panel">
            {/* Tab Mô Tả */}
            {activeTab === 'desc' && (
              <div className="desc-content">
                <p>{product.moTa || 'Sản phẩm được phân phối chính hãng qua hệ thống phân phối 2 tầng WMS & E-commerce.'}</p>
                <div className="spec-table">
                  <div className="spec-row">
                    <span>Mã sản phẩm (SKU):</span>
                    <strong>{product.sku}</strong>
                  </div>
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

            {/* Tab Đánh Giá Khách Hàng (Reviews CRUD) */}
            {activeTab === 'reviews' && (
              <div className="reviews-content">
                {/* Form Viết Đánh Giá Mới */}
                <div className="create-review-card">
                  <h4>✍️ Viết Đánh Giá Của Bạn Cho Sản Phẩm</h4>
                  {reviewSuccessMsg && (
                    <div className="review-success-badge">
                      <FiCheckCircle /> {reviewSuccessMsg}
                    </div>
                  )}
                  <form onSubmit={handleSubmitReview}>
                    <div className="star-rating-selector">
                      <span>Đánh giá của bạn:</span>
                      <div className="star-buttons">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            type="button"
                            key={star}
                            className={`star-choice ${newReviewStar >= star ? 'selected' : ''}`}
                            onClick={() => setNewReviewStar(star)}
                          >
                            ★
                          </button>
                        ))}
                        <strong className="star-label-text">
                          {newReviewStar === 5 ? 'Tuyệt vời' : newReviewStar === 4 ? 'Rất tốt' : newReviewStar === 3 ? 'Bình thường' : 'Chưa hài lòng'}
                        </strong>
                      </div>
                    </div>

                    <div className="review-textarea-wrap">
                      <textarea
                        rows="3"
                        placeholder="Hãy chia sẻ cảm nhận thực tế về chất lượng sản phẩm, tốc độ giao hàng và đóng gói..."
                        value={newReviewContent}
                        onChange={(e) => setNewReviewContent(e.target.value)}
                        required
                      />
                    </div>

                    <button 
                      type="submit" 
                      className="btn-submit-review"
                      disabled={isSubmittingReview}
                    >
                      <FiSend /> {isSubmittingReview ? 'Đang Gửi Đánh Giá...' : 'Gửi Đánh Giá'}
                    </button>
                  </form>
                </div>

                {/* Danh Sách Đánh Giá Đã Có */}
                <div className="existing-reviews-list">
                  {reviews.length === 0 ? (
                    <p className="no-reviews-text">Chưa có đánh giá nào cho sản phẩm này. Hãy là người đầu tiên đánh giá!</p>
                  ) : (
                    reviews.map((r) => (
                      <div key={r.id} className="review-item">
                        <div className="review-header">
                          <div className="reviewer-info">
                            <span className="reviewer-avatar"><FiUser /></span>
                            <span className="reviewer-name">Khách hàng #{r.nguoiDungId || '101'}</span>
                            {r.daMuaHang && (
                              <span className="verified-buyer-badge">
                                <FiCheckCircle size={12} /> Đã mua tại Shop
                              </span>
                            )}
                          </div>
                          <div className="review-meta-right">
                            <span className="review-stars">{'★'.repeat(r.soSao || 5)}</span>
                            {r.ngayTao && <span className="review-date">{r.ngayTao}</span>}
                          </div>
                        </div>
                        <p className="review-text">{r.noiDung}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Tab Bình Luận & Hỏi Đáp (Comments CRUD) */}
            {activeTab === 'comments' && (
              <div className="comments-content">
                {/* Form Đăng Bình Luận */}
                <div className="create-comment-card">
                  <h4>💬 Hỏi Đáp Về Sản Phẩm Với Chủ Shop</h4>
                  {commentSuccessMsg && (
                    <div className="review-success-badge">
                      <FiCheckCircle /> {commentSuccessMsg}
                    </div>
                  )}
                  <form onSubmit={handleSubmitComment}>
                    <textarea
                      rows="3"
                      placeholder="Đặt câu hỏi về thông số kỹ thuật, bảo hành hoặc tình trạng hàng..."
                      value={newCommentContent}
                      onChange={(e) => setNewCommentContent(e.target.value)}
                      required
                    />
                    <button 
                      type="submit" 
                      className="btn-submit-comment"
                      disabled={isSubmittingComment}
                    >
                      <FiSend /> {isSubmittingComment ? 'Đang Đăng...' : 'Đăng Câu Hỏi'}
                    </button>
                  </form>
                </div>

                {/* Danh Sách Bình Luận */}
                <div className="existing-comments-list">
                  {comments.length === 0 ? (
                    <p className="no-reviews-text">Chưa có câu hỏi nào. Đặt câu hỏi để được chủ shop giải đáp ngay!</p>
                  ) : (
                    comments.map((c) => (
                      <div key={c.id} className="comment-item">
                        <div className="comment-header">
                          <span className="comment-user">👤 Người dùng #{c.nguoiDungId || '101'}</span>
                          {c.ngayTao && <span className="comment-date">{c.ngayTao}</span>}
                        </div>
                        <p className="comment-text">{c.noiDung}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
