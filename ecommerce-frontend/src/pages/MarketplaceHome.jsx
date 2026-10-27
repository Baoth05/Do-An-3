// src/pages/MarketplaceHome.jsx
import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { marketplaceService } from '../services/marketplaceService';
import { CartContext } from '../context/CartContext';
import { FiCheck, FiShoppingCart, FiStar, FiTruck, FiShield, FiZap, FiGrid } from 'react-icons/fi';
import './MarketplaceHome.css';

const MarketplaceHome = () => {
  const [products, setProducts] = useState([]);
  const [stores, setStores] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedStore, setSelectedStore] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [addedNotice, setAddedNotice] = useState('');

  const { addToCart } = useContext(CartContext);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [prodData, storeData] = await Promise.all([
          marketplaceService.getMarketplaceProducts(),
          marketplaceService.getStores(),
        ]);
        setProducts(prodData);
        setStores(storeData);
      } catch (err) {
        console.error('Lỗi tải dữ liệu marketplace:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleAddToCart = (product, e) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product, 1);
    setAddedNotice(`Đã thêm "${product.tenSanPham}" vào giỏ hàng!`);
    setTimeout(() => setAddedNotice(''), 2500);
  };

  const categories = ['ALL', 'Điện Thoại & Tablet', 'Laptop & Máy Tính', 'Phụ Kiện Gaming & Văn Phòng'];

  const filteredProducts = products.filter((p) => {
    const matchCat = selectedCategory === 'ALL' || p.danhMuc === selectedCategory;
    const matchStore = selectedStore === 'ALL' || p.khoHangId === Number(selectedStore);
    return matchCat && matchStore;
  });

  return (
    <div className="marketplace-home">
      {/* Toast thông báo thêm giỏ hàng */}
      {addedNotice && (
        <div className="toast-notification">
          <FiCheck size={18} /> {addedNotice}
        </div>
      )}

      {/* Hero Banner Sàn */}
      <section className="market-hero">
        <div className="container hero-container">
          <div className="hero-text">
            <span className="hero-badge">🌟 MÔ HÌNH SÀN TẬP TRUNG B2B2C</span>
            <h2>Sàn Thương Mại Điện Tử & Vận Hành Kho Chuỗi</h2>
            <p>
              Khám phá hàng ngàn sản phẩm công nghệ chính hãng từ các Gian hàng uy tín được kiểm định 
              và cung ứng trực tiếp từ hệ thống Kho Tổng Trung Tâm CTUT.
            </p>
            <div className="hero-features">
              <div className="feature-item">
                <FiShield className="feat-icon" /> 100% Chính Hãng Master Catalog
              </div>
              <div className="feature-item">
                <FiTruck className="feat-icon" /> Tách Đơn Tự Động Theo Shop
              </div>
              <div className="feature-item">
                <FiZap className="feat-icon" /> Thanh Toán MoMo & Web3 Crypto
              </div>
            </div>
          </div>
          <div className="hero-stats-card">
            <div className="stat-box">
              <h3>2+</h3>
              <p>Gian Hàng Uy Tín</p>
            </div>
            <div className="stat-box">
              <h3>100%</h3>
              <p>Kho Hàng Thật</p>
            </div>
            <div className="stat-box">
              <h3>24/7</h3>
              <p>Giao Vận Siêu Tốc</p>
            </div>
          </div>
        </div>
      </section>

      {/* Gian hàng nổi bật (Stores Section) */}
      <section className="stores-section">
        <div className="container">
          <div className="section-header">
            <div>
              <h3 className="section-title">Gian Hàng Chính Hãng Trên Sàn</h3>
              <p className="section-subtitle">Ghé thăm trang riêng của từng Chủ cửa hàng để nhận Voucher độc quyền</p>
            </div>
            <button 
              className={`store-pill ${selectedStore === 'ALL' ? 'active' : ''}`}
              onClick={() => setSelectedStore('ALL')}
            >
              <FiGrid /> Tất Cả Gian Hàng
            </button>
          </div>

          <div className="stores-grid">
            {stores.map((store) => (
              <div 
                key={store.id} 
                className={`store-card ${selectedStore === store.id ? 'selected' : ''}`}
                onClick={() => setSelectedStore(store.id === selectedStore ? 'ALL' : store.id)}
              >
                <div className="store-avatar-wrap">
                  <img src={store.anhDaiDienShop || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=100'} alt={store.tenKho} />
                </div>
                <div className="store-info">
                  <h4>{store.tenKho}</h4>
                  <p className="store-address">📍 {store.diaChi || 'Cần Thơ'}</p>
                  <div className="store-meta">
                    <span className="store-rating">★ 4.9</span>
                    <span className="store-verified">✓ Đã kiểm duyệt</span>
                  </div>
                </div>
                <Link 
                  to={`/stores/${store.id}`} 
                  className="btn-visit-store" 
                  onClick={(e) => e.stopPropagation()}
                >
                  Xem Shop →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Lọc danh mục sản phẩm */}
      <section className="catalog-section">
        <div className="container">
          <div className="catalog-toolbar">
            <div className="category-pills">
              {categories.map((cat) => (
                <button
                  key={cat}
                  className={`cat-pill ${selectedCategory === cat ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat === 'ALL' ? 'Tất Cả Sản Phẩm' : cat}
                </button>
              ))}
            </div>
            <div className="product-count">
              Hiển thị <strong>{filteredProducts.length}</strong> sản phẩm đang mở bán
            </div>
          </div>

          {/* Grid Sản Phẩm */}
          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Đang tải danh sách sản phẩm từ các gian hàng...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="empty-state">
              <p>Không tìm thấy sản phẩm nào trong danh mục hoặc gian hàng này.</p>
            </div>
          ) : (
            <div className="products-grid">
              {filteredProducts.map((p) => {
                const price = p.giaBanHienTai || p.giaBan || 0;
                const originalPrice = p.giaBan || price;
                const hasDiscount = originalPrice > price;

                return (
                  <div key={`${p.sanPhamId}-${p.khoHangId}`} className="product-card">
                    <Link to={`/products/${p.sanPhamId}`} className="product-card-link">
                      <div className="product-img-wrap">
                        <img src={p.hinhAnh || 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500'} alt={p.tenSanPham} />
                        {hasDiscount && <span className="discount-tag">GIẢM SỐC</span>}
                        <span className="store-tag">🏪 {p.tenShop || p.tenKho}</span>
                      </div>

                      <div className="product-content">
                        <div className="product-sku">Mã: {p.sku}</div>
                        <h4 className="product-name">{p.tenSanPham}</h4>
                        
                        <div className="product-pricing">
                          <span className="sale-price">{Number(price).toLocaleString('vi-VN')} đ</span>
                          {hasDiscount && (
                            <span className="orig-price">{Number(originalPrice).toLocaleString('vi-VN')} đ</span>
                          )}
                        </div>

                        <div className="product-footer-meta">
                          <span className="sold-count">Đã bán {p.soLuongDaBan || 0}</span>
                          <span className="stock-status">Sẵn hàng: {p.soLuongThucTe || 0}</span>
                        </div>
                      </div>
                    </Link>

                    <div className="product-action-bar">
                      <button 
                        className="btn-add-cart"
                        onClick={(e) => handleAddToCart(p, e)}
                        title="Thêm vào giỏ hàng"
                      >
                        <FiShoppingCart size={16} /> Thêm Giỏ Hàng
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default MarketplaceHome;

