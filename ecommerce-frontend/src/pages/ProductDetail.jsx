// src/pages/ProductDetail.jsx
import { useState, useEffect, useContext } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { marketplaceService } from '../services/marketplaceService';
import { authService } from '../services/authService';
import { CartContext } from '../context/CartContext';
import {
  FiShoppingCart,
  FiTruck,
  FiShield,
  FiCheckCircle,
  FiMessageSquare,
  FiShoppingBag,
  FiCheck,
  FiSend,
  FiUser,
  FiChevronLeft,
  FiChevronRight,
  FiEdit3,
} from 'react-icons/fi';
import './ProductDetail.css';

const FALLBACK_PRODUCT_IMG = 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800';
const FALLBACK_SHOP_IMG = 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=200';

const formatShopJoinDate = (rawDate) => {
  if (!rawDate) return 'Đối tác chính thức';
  const d = new Date(rawDate);
  if (Number.isNaN(d.getTime())) return 'Đối tác chính thức';
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${month}/${d.getFullYear()}`;
};

const formatReviewDate = (rawDate) => {
  if (!rawDate) return '';
  return String(rawDate).replace('T', ' ').slice(0, 16);
};

const ProductDetail = () => {
  const { productId } = useParams();
  const [product, setProduct] = useState(null);
  const [storeInfo, setStoreInfo] = useState(null);
  const [shopStats, setShopStats] = useState({ productCount: 0, reviewCount: 0 });
  const [reviews, setReviews] = useState([]);
  const [comments, setComments] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [reviewFilter, setReviewFilter] = useState('ALL'); // ALL, 5, 4, 3, 2, 1, WITH_COMMENT
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [addedNotice, setAddedNotice] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form Đánh Giá mới
  const [newReviewStar, setNewReviewStar] = useState(5);
  const [newReviewContent, setNewReviewContent] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewSuccessMsg, setReviewSuccessMsg] = useState('');

  // Form Bình Luận mới
  const [newCommentContent, setNewCommentContent] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [commentSuccessMsg, setCommentSuccessMsg] = useState('');

  const { addToCart } = useContext(CartContext);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchProductData = async () => {
      setLoading(true);
      try {
        const allProds = await marketplaceService.getMarketplaceProducts();
        let found = allProds.find((p) => p.sanPhamId === Number(productId) || p.id === Number(productId));

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
        setSelectedImageIdx(0);
        setReviewFilter('ALL');

        if (found) {
          const storeId = found.khoHangId;
          const [revs, comms, storeRes, storeProdsRes, storeReviewsRes] = await Promise.all([
            found.sku ? marketplaceService.getReviews(found.sku) : Promise.resolve([]),
            found.sku ? marketplaceService.getComments(found.sku) : Promise.resolve([]),
            storeId ? marketplaceService.getStoreById(storeId) : Promise.resolve(null),
            storeId ? marketplaceService.getProductsByStore(storeId) : Promise.resolve([]),
            storeId ? marketplaceService.getStoreReviews(storeId) : Promise.resolve([]),
          ]);
          const revList = Array.isArray(revs) ? revs : [];
          setReviews(revList);
          setComments(Array.isArray(comms) ? comms : []);
          setStoreInfo(storeRes || null);
          setShopStats({
            productCount: Array.isArray(storeProdsRes) ? storeProdsRes.length : 0,
            reviewCount: Array.isArray(storeReviewsRes) && storeReviewsRes.length > 0
              ? storeReviewsRes.length
              : revList.length,
          });
        }
      } catch (err) {
        console.error('Lỗi tải sản phẩm:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProductData();
  }, [productId]);

  const maxStock = product?.soLuongKhaDung ?? product?.soLuongThucTe ?? 0;

  const requireCustomerLogin = () => {
    navigate('/login', {
      state: {
        from: location,
        message: 'Vui lòng đăng nhập tài khoản khách hàng để thêm sản phẩm vào giỏ hàng và mua sắm!',
      },
    });
  };

  const handleAddToCart = () => {
    if (!product || maxStock <= 0) return;
    const finalQty = Math.min(quantity, maxStock);
    if (!authService.isCustomerAuthenticated() || !addToCart(product, finalQty)) {
      requireCustomerLogin();
      return;
    }
    setAddedNotice(true);
    setTimeout(() => setAddedNotice(false), 2500);
  };

  const handleBuyNow = () => {
    if (!product || maxStock <= 0) return;
    const finalQty = Math.min(quantity, maxStock);
    if (!authService.isCustomerAuthenticated() || !addToCart(product, finalQty)) {
      requireCustomerLogin();
      return;
    }
    navigate('/cart');
  };

  const handleOpenChatWithShop = () => {
    if (!product?.khoHangId) return;
    navigate('/profile', {
      state: {
        activeTab: 'chat',
        targetStoreId: product.khoHangId,
        storeName: storeInfo?.tenKho || product.tenShop || product.tenKho,
      },
    });
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!newReviewContent.trim()) {
      alert('Vui lòng nhập nội dung đánh giá của bạn!');
      return;
    }

    setIsSubmittingReview(true);
    try {
      const currentCustomer = authService.getCurrentCustomer();
      const currentUserId = currentCustomer?.id || 101;
      const payload = {
        nguoiDungId: currentUserId,
        cuaHangId: product.khoHangId || 1,
        maHangHoa: product.sku,
        donHangId: 'DH-SAMPLE',
        soSao: newReviewStar,
        noiDung: newReviewContent.trim(),
      };

      const created = await marketplaceService.createReview(payload);
      setReviews((prev) => [created, ...prev]);
      setShopStats((prev) => ({ ...prev, reviewCount: prev.reviewCount + 1 }));
      setNewReviewContent('');
      setReviewSuccessMsg('Cảm ơn bạn! Đánh giá của bạn đã được ghi nhận.');
      setShowReviewForm(false);
      setTimeout(() => setReviewSuccessMsg(''), 3500);
    } catch (err) {
      alert('Lỗi gửi đánh giá: ' + err.message);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!newCommentContent.trim()) {
      alert('Vui lòng nhập nội dung bình luận / câu hỏi!');
      return;
    }

    setIsSubmittingComment(true);
    try {
      const currentCustomer = authService.getCurrentCustomer();
      const currentUserId = currentCustomer?.id || 101;
      const payload = {
        nguoiDungId: currentUserId,
        cuaHangId: product.khoHangId || 1,
        maHangHoa: product.sku,
        noiDung: newCommentContent.trim(),
      };

      const created = await marketplaceService.createComment(payload);
      setComments((prev) => [created, ...prev]);
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

  const price = Number(product.giaBanHienTai || product.giaBan || 0);
  const originalPrice = Number(product.giaBan || price);
  const hasDiscount = originalPrice > price;

  const avgRating = reviews.length > 0
    ? (reviews.reduce((s, r) => s + (r.soSao || 5), 0) / reviews.length).toFixed(1)
    : '5.0';

  const countByStar = (star) => reviews.filter((r) => Number(r.soSao || 5) === star).length;
  const countWithComment = reviews.filter((r) => r.noiDung && String(r.noiDung).trim().length > 0).length;

  const filteredReviews = reviews.filter((r) => {
    if (reviewFilter === 'ALL') return true;
    if (reviewFilter === 'WITH_COMMENT') return Boolean(r.noiDung && String(r.noiDung).trim());
    return Number(r.soSao || 5) === Number(reviewFilter);
  });

  const galleryImages = (() => {
    const rawList = Array.isArray(product.danhSachHinhAnh) && product.danhSachHinhAnh.length > 0
      ? product.danhSachHinhAnh
      : [product.hinhAnh || FALLBACK_PRODUCT_IMG];
    const clean = [...new Set(rawList.filter(Boolean))];
    return clean.length > 0 ? clean : [FALLBACK_PRODUCT_IMG];
  })();
  const currentMainImage = galleryImages[selectedImageIdx] || galleryImages[0];

  const customSpecLines = (product.thongSoKyThuat || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const sep = line.indexOf(':');
      return sep > 0
        ? { label: line.slice(0, sep).trim(), value: line.slice(sep + 1).trim() }
        : { label: 'Thông số', value: line };
    });

  const shopDisplayName = storeInfo?.tenKho || product.tenShop || product.tenKho || 'Gian Hàng Chính Hãng';
  const shopLogo = storeInfo?.anhDaiDienShop || product.logoShop || FALLBACK_SHOP_IMG;
  const shopLocation = storeInfo?.diaChi || 'Kho Tổng & Cửa Hàng CTUT';

  return (
    <div className="product-detail-page">
      <div className="container detail-page-stack">
        {/* Breadcrumb */}
        <div className="detail-breadcrumb">
          <Link to="/">Trang Chủ</Link>
          <span>&gt;</span>
          <span>{product.danhMuc || 'Thiết Bị Công Nghệ'}</span>
          <span>&gt;</span>
          <strong>{product.tenSanPham}</strong>
        </div>

        {/* 1. Khối Ảnh & Mua Hàng Chính */}
        <div className="product-main-grid">
          {/* Cột Trái: Bộ Sưu Tập Ảnh */}
          <div className="product-gallery">
            <div className="main-image-wrap">
              <img src={currentMainImage} alt={product.tenSanPham} />
              {hasDiscount && <span className="detail-discount-tag">GIẢM GIÁ</span>}
              {galleryImages.length > 1 && (
                <>
                  <button
                    type="button"
                    className="gallery-nav-btn prev"
                    onClick={() => setSelectedImageIdx((i) => (i - 1 + galleryImages.length) % galleryImages.length)}
                  >
                    <FiChevronLeft size={20} />
                  </button>
                  <button
                    type="button"
                    className="gallery-nav-btn next"
                    onClick={() => setSelectedImageIdx((i) => (i + 1) % galleryImages.length)}
                  >
                    <FiChevronRight size={20} />
                  </button>
                </>
              )}
            </div>

            {galleryImages.length > 1 && (
              <div className="gallery-thumbnails-row">
                {galleryImages.map((imgUrl, idx) => (
                  <button
                    type="button"
                    key={`${idx}-${imgUrl.slice(0, 24)}`}
                    className={`gallery-thumb-btn ${idx === selectedImageIdx ? 'active' : ''}`}
                    onClick={() => setSelectedImageIdx(idx)}
                  >
                    <img src={imgUrl} alt={`${product.tenSanPham} ${idx + 1}`} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Cột Phải: Thông tin giá & Mua hàng */}
          <div className="product-info-column">
            <div className="sku-badge">SKU: {product.sku}</div>
            <h2 className="detail-title">{product.tenSanPham}</h2>

            <div className="detail-rating-meta">
              <span className="rating-num shopee-accent">{avgRating}</span>
              <span className="stars">{'★'.repeat(Math.round(Number(avgRating)))}</span>
              <span className="divider">|</span>
              <span className="reviews-count-meta"><strong>{reviews.length}</strong> Đánh Giá</span>
              <span className="divider">|</span>
              <span className="sold-meta"><strong>{product.soLuongDaBan ?? 0}</strong> Đã Bán</span>
            </div>

            <div className="detail-price-box">
              <span className="detail-sale-price">{price.toLocaleString('vi-VN')} đ</span>
              {hasDiscount && (
                <span className="detail-orig-price">{originalPrice.toLocaleString('vi-VN')} đ</span>
              )}
              <span className="price-tag-badge">Chính Hãng 100%</span>
            </div>

            <div className="stock-selection-section">
              <div className="qty-row">
                <span className="label-text">Số Lượng:</span>
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
                    max={Math.max(1, maxStock)}
                    value={quantity}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      if (!isNaN(val)) {
                        setQuantity(Math.min(Math.max(1, val), Math.max(1, maxStock)));
                      }
                    }}
                  />
                  <button
                    onClick={() => setQuantity((q) => Math.min(Math.max(1, maxStock), q + 1))}
                    disabled={quantity >= maxStock}
                  >
                    +
                  </button>
                </div>
                <span className="stock-count">
                  {maxStock > 0 ? `${maxStock} sản phẩm có sẵn` : 'Tạm hết hàng'}
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

            <div className="policy-highlights">
              <div className="p-item">
                <FiTruck /> Giao hàng nhanh toàn quốc • Đóng gói chống sốc
              </div>
              <div className="p-item">
                <FiShield /> Bảo hành chính hãng tại Gian hàng & Kho Tổng CTUT
              </div>
              <div className="p-item">
                <FiCheck /> Kiểm tra hàng trước khi thanh toán / Đổi trả lỗi phần cứng
              </div>
            </div>
          </div>
        </div>

        {/* 2. Thanh Thông Tin Gian Hàng Kiểu Shopee */}
        <section className="shopee-shop-strip-card">
          <div className="shop-strip-left">
            <img src={shopLogo} alt={shopDisplayName} className="shop-strip-avatar" />
            <div className="shop-strip-identity">
              <h3 className="shop-strip-name">{shopDisplayName}</h3>
              <span className="shop-strip-online">
                {storeInfo?.gioMoCua ? `Hoạt động: ${storeInfo.gioMoCua}` : 'Gian Hàng Chính Hãng'}
              </span>
              <div className="shop-strip-buttons">
                <button type="button" className="btn-shopee-chat" onClick={handleOpenChatWithShop}>
                  <FiMessageSquare size={14} /> Chat Ngay
                </button>
                <Link to={`/stores/${product.khoHangId}`} className="btn-shopee-view-shop">
                  <FiShoppingBag size={14} /> Xem Shop
                </Link>
              </div>
            </div>
          </div>

          <div className="shop-strip-stats-grid">
            <div className="shop-metric-item">
              <span className="metric-label">Đánh Giá</span>
              <strong className="metric-value accent">{shopStats.reviewCount}</strong>
            </div>
            <div className="shop-metric-item">
              <span className="metric-label">Hotline</span>
              <strong className="metric-value accent">{storeInfo?.soDienThoai || 'Chính hãng'}</strong>
            </div>
            <div className="shop-metric-item">
              <span className="metric-label">Tham Gia</span>
              <strong className="metric-value accent">{formatShopJoinDate(storeInfo?.ngayTao)}</strong>
            </div>
            <div className="shop-metric-item">
              <span className="metric-label">Sản Phẩm</span>
              <strong className="metric-value accent">{shopStats.productCount || 1}</strong>
            </div>
            <div className="shop-metric-item">
              <span className="metric-label">Giờ Mở Cửa</span>
              <strong className="metric-value">{storeInfo?.gioMoCua || '08:00 - 21:30'}</strong>
            </div>
            <div className="shop-metric-item">
              <span className="metric-label">Gửi Từ</span>
              <strong className="metric-value">{shopLocation}</strong>
            </div>
          </div>
        </section>

        {/* 3. CHI TIẾT SẢN PHẨM & MÔ TẢ SẢN PHẨM Kiểu Shopee */}
        <section className="shopee-white-section">
          <div className="shopee-section-block">
            <h3 className="shopee-section-title">CHI TIẾT SẢN PHẨM</h3>
            <div className="shopee-detail-list">
              <div className="shopee-detail-row">
                <span className="detail-key">Danh Mục</span>
                <span className="detail-val">
                  <Link to="/" className="detail-cat-link">CTUT Gear</Link>
                  {' > '}
                  <span className="detail-cat-link">{product.danhMuc || 'Thiết Bị Công Nghệ'}</span>
                  {' > '}
                  <span>{product.tenSanPham}</span>
                </span>
              </div>
              <div className="shopee-detail-row">
                <span className="detail-key">Kho</span>
                <span className="detail-val">{maxStock > 0 ? `CÒN HÀNG (${maxStock} ${product.donViTinh || 'cái'})` : 'HẾT HÀNG'}</span>
              </div>
              <div className="shopee-detail-row">
                <span className="detail-key">Mã SKU</span>
                <span className="detail-val">{product.sku}</span>
              </div>
              {customSpecLines.map((spec, idx) => (
                <div key={idx} className="shopee-detail-row">
                  <span className="detail-key">{spec.label}</span>
                  <span className="detail-val">{spec.value}</span>
                </div>
              ))}
              <div className="shopee-detail-row">
                <span className="detail-key">Gửi từ</span>
                <span className="detail-val">{shopLocation}</span>
              </div>
            </div>
          </div>

          <div className="shopee-section-block">
            <h3 className="shopee-section-title">MÔ TẢ SẢN PHẨM</h3>
            <div className="shopee-description-body">
              <p className="desc-paragraph">
                {product.moTa || 'Sản phẩm được phân phối chính hãng qua hệ thống kho vận 2 tầng WMS & E-commerce CTUT Gear.'}
              </p>

              {(storeInfo?.chinhSachBaoHanh || storeInfo?.chinhSachGiaoHang) && (
                <div className="shop-policy-inline-notes">
                  {storeInfo?.chinhSachBaoHanh && (
                    <div>
                      <strong>Chính sách bảo hành & đổi trả của {shopDisplayName}:</strong>
                      <p>{storeInfo.chinhSachBaoHanh}</p>
                    </div>
                  )}
                  {storeInfo?.chinhSachGiaoHang && (
                    <div>
                      <strong>Quy cách đóng gói & vận chuyển:</strong>
                      <p>{storeInfo.chinhSachGiaoHang}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* 4. ĐÁNH GIÁ SẢN PHẨM Kiểu Shopee */}
        <section className="shopee-white-section">
          <div className="shopee-reviews-head">
            <h3 className="shopee-plain-title">ĐÁNH GIÁ SẢN PHẨM</h3>
            <button
              type="button"
              className="btn-toggle-write-review"
              onClick={() => setShowReviewForm((prev) => !prev)}
            >
              <FiEdit3 size={14} /> {showReviewForm ? 'Đóng Khung Đánh Giá' : 'Viết Đánh Giá'}
            </button>
          </div>

          {reviewSuccessMsg && (
            <div className="review-success-badge">
              <FiCheckCircle /> {reviewSuccessMsg}
            </div>
          )}

          {/* Khung Điểm Trung Bình & Bộ Lọc Sao */}
          <div className="shopee-rating-overview-box">
            <div className="rating-score-col">
              <div className="score-big-row">
                <strong>{avgRating}</strong> <span>trên 5</span>
              </div>
              <div className="score-stars-row">
                {'★'.repeat(Math.round(Number(avgRating)))}
              </div>
            </div>

            <div className="rating-filter-pills">
              <button
                type="button"
                className={`shopee-filter-btn ${reviewFilter === 'ALL' ? 'active' : ''}`}
                onClick={() => setReviewFilter('ALL')}
              >
                Tất Cả ({reviews.length})
              </button>
              {[5, 4, 3, 2, 1].map((star) => (
                <button
                  type="button"
                  key={star}
                  className={`shopee-filter-btn ${reviewFilter === String(star) ? 'active' : ''}`}
                  onClick={() => setReviewFilter(String(star))}
                >
                  {star} Sao ({countByStar(star)})
                </button>
              ))}
              <button
                type="button"
                className={`shopee-filter-btn ${reviewFilter === 'WITH_COMMENT' ? 'active' : ''}`}
                onClick={() => setReviewFilter('WITH_COMMENT')}
              >
                Có Bình Luận ({countWithComment})
              </button>
            </div>
          </div>

          {/* Form Viết Đánh Giá Mới */}
          {showReviewForm && (
            <div className="create-review-card">
              <h4>✍️ Viết Đánh Giá Của Bạn Cho Sản Phẩm</h4>
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
          )}

          {/* Danh Sách Đánh Giá */}
          <div className="shopee-reviews-list">
            {filteredReviews.length === 0 ? (
              <p className="no-reviews-text">
                {reviews.length === 0
                  ? 'Chưa có đánh giá nào cho sản phẩm này. Hãy là người đầu tiên đánh giá!'
                  : 'Không có đánh giá nào khớp bộ lọc sao đã chọn.'}
              </p>
            ) : (
              filteredReviews.map((r) => (
                <div key={r.id} className="shopee-review-item">
                  <div className="shopee-review-avatar">
                    <FiUser size={18} />
                  </div>
                  <div className="shopee-review-body">
                    <div className="shopee-review-user-row">
                      <span className="reviewer-name">Khách hàng #{r.nguoiDungId || '101'}</span>
                      {r.daMuaHang && (
                        <span className="verified-buyer-badge">
                          <FiCheckCircle size={12} /> Đã mua hàng
                        </span>
                      )}
                    </div>
                    <div className="shopee-review-stars">
                      {'★'.repeat(r.soSao || 5)}
                    </div>
                    <div className="shopee-review-meta">
                      {formatReviewDate(r.ngayTao) || 'Gần đây'} | Sản phẩm: {product.sku}
                    </div>
                    <p className="shopee-review-text">{r.noiDung}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* 5. HỎI ĐÁP & BÌNH LUẬN VỚI SHOP */}
        <section className="shopee-white-section">
          <h3 className="shopee-plain-title" style={{ marginBottom: 16 }}>
            HỎI ĐÁP & BÌNH LUẬN ({comments.length})
          </h3>

          <div className="create-comment-card">
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

          <div className="existing-comments-list">
            {comments.length === 0 ? (
              <p className="no-reviews-text">Chưa có câu hỏi nào. Đặt câu hỏi để được chủ shop giải đáp ngay!</p>
            ) : (
              comments.map((c) => (
                <div key={c.id} className="comment-item">
                  <div className="comment-header">
                    <span className="comment-user">👤 Người dùng #{c.nguoiDungId || '101'}</span>
                    {c.ngayTao && <span className="comment-date">{formatReviewDate(c.ngayTao)}</span>}
                  </div>
                  <p className="comment-text">{c.noiDung}</p>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default ProductDetail;
