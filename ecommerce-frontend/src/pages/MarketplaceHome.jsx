/**
 * ==============================================================================
 * Module: MarketplaceHome.jsx
 * Mô tả: Trang chủ Sàn Thương Mại Điện Tử Tập Trung (CTUT Gear Marketplace).
 * Chức năng:
 *   - Lấy danh sách sản phẩm & Gian hàng từ API/Mock.
 *   - Tìm kiếm từ URL param (?q=...) kết hợp tìm kiếm nội trang.
 *   - Bộ lọc danh mục đa tầng, bộ lọc theo Gian hàng.
 *   - Sắp xếp giá tăng/giảm, bán chạy nhất, tên A-Z.
 *   - Thêm nhanh sản phẩm vào giỏ hàng với thông báo mượt mà.
 * ==============================================================================
 */
import { useState, useEffect, useContext, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { marketplaceService } from '../services/marketplaceService';
import { CartContext } from '../context/CartContext';
import { 
  FiCheck, FiShoppingCart, FiStar, FiTruck, FiShield, 
  FiZap, FiGrid, FiSearch, FiFilter, FiX, FiTrendingUp 
} from 'react-icons/fi';
import './MarketplaceHome.css';

const MarketplaceHome = () => {
  const [products, setProducts] = useState([]);
  const [stores, setStores] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedStore, setSelectedStore] = useState('ALL');
  const [sortBy, setSortBy] = useState('DEFAULT'); // DEFAULT, PRICE_ASC, PRICE_DESC, SOLD, NAME
  const [priceRange, setPriceRange] = useState('ALL'); // ALL, UNDER_5M, 5M_20M, OVER_20M
  const [loading, setLoading] = useState(true);
  const [addedNotice, setAddedNotice] = useState('');

  const [searchParams, setSearchParams] = useSearchParams();
  const queryParam = searchParams.get('q') || '';

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

  // Bộ lọc sản phẩm đa tiêu chí
  const filteredProducts = useMemo(() => {
    let result = products.filter((p) => {
      // Lọc theo danh mục
      const matchCat = selectedCategory === 'ALL' || p.danhMuc === selectedCategory;
      // Lọc theo shop
      const matchStore = selectedStore === 'ALL' || p.khoHangId === Number(selectedStore);
      
      // Lọc theo từ khóa tìm kiếm (Tên, SKU, Mô tả, Gian hàng)
      let matchQuery = true;
      if (queryParam.trim()) {
        const q = queryParam.toLowerCase().trim();
        const nameMatch = (p.tenSanPham || '').toLowerCase().includes(q);
        const skuMatch = (p.sku || '').toLowerCase().includes(q);
        const shopMatch = (p.tenShop || p.tenKho || '').toLowerCase().includes(q);
        const catMatch = (p.danhMuc || '').toLowerCase().includes(q);
        matchQuery = nameMatch || skuMatch || shopMatch || catMatch;
      }

      // Lọc theo khoảng giá
      const price = p.giaBanHienTai || p.giaBan || 0;
      let matchPrice = true;
      if (priceRange === 'UNDER_5M') matchPrice = price < 5000000;
      else if (priceRange === '5M_20M') matchPrice = price >= 5000000 && price <= 20000000;
      else if (priceRange === 'OVER_20M') matchPrice = price > 20000000;

      return matchCat && matchStore && matchQuery && matchPrice;
    });

    // Sắp xếp
    if (sortBy === 'PRICE_ASC') {
      result.sort((a, b) => (a.giaBanHienTai || a.giaBan) - (b.giaBanHienTai || b.giaBan));
    } else if (sortBy === 'PRICE_DESC') {
      result.sort((a, b) => (b.giaBanHienTai || b.giaBan) - (a.giaBanHienTai || a.giaBan));
    } else if (sortBy === 'SOLD') {
      result.sort((a, b) => (b.soLuongDaBan || 0) - (a.soLuongDaBan || 0));
    } else if (sortBy === 'NAME') {
      result.sort((a, b) => (a.tenSanPham || '').localeCompare(b.tenSanPham || ''));
    }

    return result;
  }, [products, selectedCategory, selectedStore, queryParam, priceRange, sortBy]);

  const clearAllFilters = () => {
    setSelectedCategory('ALL');
    setSelectedStore('ALL');
    setSortBy('DEFAULT');
    setPriceRange('ALL');
    setSearchParams({});
  };

  const hasActiveFilters = selectedCategory !== 'ALL' || selectedStore !== 'ALL' || queryParam || priceRange !== 'ALL' || sortBy !== 'DEFAULT';

  return (
    <div className="marketplace-home">
      {/* Toast thông báo thêm giỏ hàng */}
      {addedNotice && (
        <div className="toast-notification">
          <FiCheck size={18} /> {addedNotice}
        </div>
      )}

      {/* Hero Banner Sàn */}
      {!queryParam && (
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
                <h3>{stores.length || 2}+</h3>
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
      )}

      {/* Gian hàng nổi bật (Stores Section) */}
      {!queryParam && (
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
                      <span className="store-rating">★ {store.rating || '4.9'}</span>
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
      )}

      {/* Catalog & Filter Section */}
      <section className="catalog-section">
        <div className="container">
          {/* Thông báo kết quả tìm kiếm nếu có query */}
          {queryParam && (
            <div className="search-result-banner">
              <div>
                <span className="search-tag-label"><FiSearch /> Kết quả tìm kiếm cho:</span>
                <strong className="search-query-text">"{queryParam}"</strong>
                <span className="search-count-pill">({filteredProducts.length} sản phẩm)</span>
              </div>
              <button className="btn-clear-query" onClick={() => setSearchParams({})}>
                <FiX /> Bỏ tìm kiếm
              </button>
            </div>
          )}

          {/* Lọc danh mục sản phẩm */}
          <div className="catalog-toolbar">
            <div className="category-pills">
              {categories.map((cat) => (
                <button
                  key={cat}
                  className={`cat-pill ${selectedCategory === cat ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat === 'ALL' ? 'Tất Cả Danh Mục' : cat}
                </button>
              ))}
            </div>

            {/* Thanh công cụ sắp xếp & lọc giá */}
            <div className="filter-controls-row">
              <div className="sort-select-wrap">
                <label><FiTrendingUp /> Sắp xếp:</label>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                  <option value="DEFAULT">Mặc định</option>
                  <option value="SOLD">Bán chạy nhất</option>
                  <option value="PRICE_ASC">Giá: Thấp đến Cao</option>
                  <option value="PRICE_DESC">Giá: Cao đến Thấp</option>
                  <option value="NAME">Tên: A - Z</option>
                </select>
              </div>

              <div className="price-filter-wrap">
                <label><FiFilter /> Mức giá:</label>
                <select value={priceRange} onChange={(e) => setPriceRange(e.target.value)}>
                  <option value="ALL">Tất cả mức giá</option>
                  <option value="UNDER_5M">Dưới 5 triệu</option>
                  <option value="5M_20M">Từ 5 - 20 triệu</option>
                  <option value="OVER_20M">Trên 20 triệu</option>
                </select>
              </div>

              {hasActiveFilters && (
                <button className="btn-reset-filters" onClick={clearAllFilters} title="Đặt lại bộ lọc">
                  <FiX size={14} /> Xóa Lọc
                </button>
              )}
            </div>
          </div>

          <div className="product-summary-bar">
            <span>Hiển thị <strong>{filteredProducts.length}</strong> sản phẩm đang mở bán</span>
            {selectedStore !== 'ALL' && (
              <span className="active-filter-badge">
                Gian hàng: #{selectedStore} <FiX onClick={() => setSelectedStore('ALL')} />
              </span>
            )}
          </div>

          {/* Grid Sản Phẩm */}
          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Đang tải danh sách sản phẩm từ các gian hàng...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="empty-state">
              <p>Không tìm thấy sản phẩm nào phù hợp với điều kiện tìm kiếm và bộ lọc.</p>
              <button className="btn-reset-filters-large" onClick={clearAllFilters}>
                Xem Toàn Bộ Sản Phẩm Sàn
              </button>
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
                        <img 
                          src={p.hinhAnh || 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500'} 
                          alt={p.tenSanPham} 
                        />
                        {hasDiscount && <span className="discount-tag">GIẢM SỐC</span>}
                        <span className="store-tag">🏪 {p.tenShop || p.tenKho}</span>
                      </div>

                      <div className="product-content">
                        <div className="product-sku">Mã SKU: {p.sku}</div>
                        <h4 className="product-name">{p.tenSanPham}</h4>
                        
                        <div className="product-pricing">
                          <span className="sale-price">{Number(price).toLocaleString('vi-VN')} đ</span>
                          {hasDiscount && (
                            <span className="orig-price">{Number(originalPrice).toLocaleString('vi-VN')} đ</span>
                          )}
                        </div>

                        <div className="product-footer-meta">
                          <span className="sold-count">Đã bán {p.soLuongDaBan || 0}</span>
                          <span className="stock-status">Sẵn kho: {p.soLuongThucTe || 0}</span>
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
