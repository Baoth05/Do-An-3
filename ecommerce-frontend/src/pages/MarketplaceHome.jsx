/**
 * ==============================================================================
 * Module: MarketplaceHome.jsx
 * Mô tả: Trang chủ Sàn Thương Mại Điện Tử (CTUT Gear Marketplace) - Giao diện Shopee.
 * Chức năng:
 *   - Slider Banner Quảng cáo tuyển chọn bởi hệ thống.
 *   - Danh sách Gian hàng chính hãng.
 *   - Khối DANH MỤC lưới 2 hàng phong cách Shopee với bộ icon công nghệ nét mảnh.
 *   - Lọc đa tiêu chí (Danh mục, Gian hàng, Tìm kiếm, Mức giá, Sắp xếp).
 *   - Hiển thị thông báo "Không có dữ liệu sản phẩm" khi danh mục không có hàng.
 *   - Thẻ sản phẩm thiết kế theo layout, badge và bảng màu giá của Shopee (#ee4d2d).
 * ==============================================================================
 */
import { useState, useEffect, useContext, useMemo } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { marketplaceService } from '../services/marketplaceService';
import { authService } from '../services/authService';
import { CartContext } from '../context/CartContext';
import {
  FiCheck,
  FiShoppingCart,
  FiGrid,
  FiSearch,
  FiFilter,
  FiX,
  FiTrendingUp,
  FiPackage,
  FiMapPin,
} from 'react-icons/fi';
import PromoSlider from '../components/PromoSlider';
import './MarketplaceHome.css';

/**
 * ==============================================================================
 * BỘ ICON SVG NÉT MẢNH CHO DANH MỤC (PHONG CÁCH GEARVN / TECH STORE)
 * Bạn có thể thay đổi kích thước (size) hoặc độ dày nét (strokeWidth) tại đây.
 * ==============================================================================
 */
const CategoryIcon = ({ type }) => {
  const props = {
    width: 28,
    height: 28,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.7,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  };

  switch (type) {
    case 'laptop':
      return (
        <svg {...props}>
          <rect x="3" y="4" width="18" height="12" rx="1.5" />
          <path d="M1 19h22" />
          <path d="M8 19l1-3h6l1 3" />
        </svg>
      );
    case 'laptop-gaming':
      return (
        <svg {...props}>
          <rect x="3" y="4" width="18" height="12" rx="1.5" />
          <path d="M1 19h22" />
          <path d="M10 8.5l2 1.5-2 1.5" />
          <path d="M14 11.5h2" />
        </svg>
      );
    case 'pc':
      return (
        <svg {...props}>
          <rect x="6" y="2" width="12" height="20" rx="1.5" />
          <line x1="9" y1="6" x2="15" y2="6" />
          <line x1="9" y1="9" x2="15" y2="9" />
          <circle cx="12" cy="16" r="2.2" />
        </svg>
      );
    case 'vga':
      return (
        <svg {...props}>
          <rect x="2" y="6" width="20" height="11" rx="1.5" />
          <circle cx="8" cy="11.5" r="2.5" />
          <circle cx="16" cy="11.5" r="2.5" />
          <path d="M6 17v2h8v-2" />
        </svg>
      );
    case 'main-cpu':
      return (
        <svg {...props}>
          <rect x="6" y="6" width="12" height="12" rx="1.5" />
          <rect x="9.5" y="9.5" width="5" height="5" />
          <path d="M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4" />
        </svg>
      );
    case 'case':
      return (
        <svg {...props}>
          <rect x="5" y="3" width="14" height="18" rx="1.5" />
          <circle cx="12" cy="9" r="2.5" />
          <circle cx="12" cy="16" r="2" />
        </svg>
      );
    case 'ram-ssd':
      return (
        <svg {...props}>
          <rect x="2" y="7" width="20" height="9" rx="1" />
          <rect x="5" y="9.5" width="3" height="4" />
          <rect x="10.5" y="9.5" width="3" height="4" />
          <rect x="16" y="9.5" width="3" height="4" />
          <path d="M5 16v2M9 16v2M15 16v2M19 16v2" />
        </svg>
      );
    case 'monitor':
      return (
        <svg {...props}>
          <rect x="2" y="3" width="20" height="13" rx="1.5" />
          <path d="M8 21h8" />
          <path d="M12 16v5" />
        </svg>
      );
    case 'keyboard':
      return (
        <svg {...props}>
          <rect x="2" y="6" width="20" height="12" rx="1.5" />
          <path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01" />
          <path d="M6 14h.01M18 14h.01M9 14h6" />
        </svg>
      );
    case 'mouse':
      return (
        <svg {...props}>
          <rect x="7" y="3" width="10" height="18" rx="5" />
          <line x1="12" y1="7" x2="12" y2="10" />
        </svg>
      );
    case 'headset':
      return (
        <svg {...props}>
          <path d="M4 13v-1a8 8 0 0 1 16 0v1" />
          <rect x="2" y="13" width="4" height="6" rx="1.5" />
          <rect x="18" y="13" width="4" height="6" rx="1.5" />
        </svg>
      );
    case 'speaker':
      return (
        <svg {...props}>
          <rect x="5" y="2" width="14" height="20" rx="2" />
          <circle cx="12" cy="7" r="1.5" />
          <circle cx="12" cy="15" r="3.5" />
        </svg>
      );
    case 'phone':
      return (
        <svg {...props}>
          <rect x="6" y="2" width="12" height="20" rx="2" />
          <line x1="11" y1="18" x2="13" y2="18" />
        </svg>
      );
    case 'console':
      return (
        <svg {...props}>
          <rect x="2" y="7" width="20" height="10" rx="4" />
          <path d="M6 12h4M8 10v4" />
          <circle cx="15.5" cy="11" r="0.8" fill="currentColor" />
          <circle cx="17.5" cy="13" r="0.8" fill="currentColor" />
        </svg>
      );
    case 'chair':
      return (
        <svg {...props}>
          <path d="M8 3h8l1 9H7l1-9z" />
          <path d="M5 12h14v3H5z" />
          <path d="M12 15v6M8 21h8" />
        </svg>
      );
    case 'accessory':
    default:
      return (
        <svg {...props}>
          <path d="M12 2v12" />
          <path d="M8 6l4-4 4 4" />
          <circle cx="12" cy="17" r="3" />
          <path d="M5 11v2a3 3 0 0 0 3 3h1" />
          <path d="M19 11v2a3 3 0 0 1-3 3h-1" />
        </svg>
      );
  }
};

/**
 * ==============================================================================
 * DANH SÁCH DANH MỤC (CÓ THỂ DỄ DÀNG THÊM / SỬA TỪ KHÓA LỌC TẠI ĐÂY)
 * - id: Mã định danh duy nhất của danh mục.
 * - label: Tên hiển thị dưới icon.
 * - icon: Loại icon tương ứng trong CategoryIcon.
 * - keywords: Danh sách từ khóa tìm trong `danhMuc` hoặc `tenSanPham`.
 * - excludeKeywords: (Tùy chọn) Từ khóa loại trừ để tránh hiển thị nhầm sản phẩm.
 * ==============================================================================
 */
const SHOPEE_CATEGORIES = [
  {
    id: 'laptop',
    label: 'Laptop',
    icon: 'laptop',
    keywords: ['laptop', 'macbook', 'ultrabook', 'máy tính xách tay'],
  },
  {
    id: 'laptop-gaming',
    label: 'Laptop Gaming',
    icon: 'laptop-gaming',
    keywords: ['laptop gaming', 'rog', 'tuf', 'nitro', 'legion', 'predator', 'katana', 'loq', 'victus'],
  },
  {
    id: 'pc',
    label: 'PC - Máy Bộ',
    icon: 'pc',
    keywords: ['pc', 'máy bộ', 'desktop', 'máy tính bàn', 'imac'],
    excludeKeywords: ['laptop'],
  },
  {
    id: 'vga',
    label: 'VGA - Card Đồ Họa',
    icon: 'vga',
    keywords: ['vga', 'card màn hình', 'card đồ họa', 'rtx', 'gtx', 'radeon', 'gpu'],
    excludeKeywords: ['laptop', 'pc', 'máy bộ'],
  },
  {
    id: 'main-cpu',
    label: 'Main, CPU',
    icon: 'main-cpu',
    keywords: ['mainboard', 'bo mạch chủ', 'cpu', 'vi xử lý', 'intel core', 'ryzen'],
    excludeKeywords: ['laptop', 'pc'],
  },
  {
    id: 'case',
    label: 'Case, Nguồn, Tản',
    icon: 'case',
    keywords: ['case', 'vỏ máy', 'nguồn', 'psu', 'tản nhiệt', 'fan'],
    excludeKeywords: ['laptop', 'điện thoại'],
  },
  {
    id: 'ram-ssd',
    label: 'Ổ Cứng, RAM',
    icon: 'ram-ssd',
    keywords: ['ram', 'ssd', 'hdd', 'ổ cứng', 'thẻ nhớ', 'nvme'],
    excludeKeywords: ['laptop', 'điện thoại', 'tablet'],
  },
  {
    id: 'monitor',
    label: 'Màn Hình',
    icon: 'monitor',
    keywords: ['màn hình', 'monitor', 'lcd', 'oled'],
    excludeKeywords: ['laptop', 'điện thoại'],
  },
  {
    id: 'keyboard',
    label: 'Bàn Phím',
    icon: 'keyboard',
    keywords: ['bàn phím', 'keyboard', 'keycap'],
  },
  {
    id: 'mouse',
    label: 'Chuột + Lót Chuột',
    icon: 'mouse',
    keywords: ['chuột', 'mouse', 'lót chuột', 'pad chuột'],
  },
  {
    id: 'headset',
    label: 'Tai Nghe',
    icon: 'headset',
    keywords: ['tai nghe', 'headset', 'headphone', 'earphone', 'airpods'],
  },
  {
    id: 'speaker',
    label: 'Loa, Mic, Webcam',
    icon: 'speaker',
    keywords: ['loa', 'speaker', 'micro', 'mic', 'webcam'],
  },
  {
    id: 'phone',
    label: 'Điện Thoại & Tablet',
    icon: 'phone',
    keywords: ['điện thoại', 'tablet', 'iphone', 'ipad', 'samsung', 'xiaomi', 'smartphone'],
  },
  {
    id: 'console',
    label: 'Handheld, Console',
    icon: 'console',
    keywords: ['handheld', 'console', 'ps5', 'xbox', 'nintendo', 'tay cầm', 'rog ally', 'steam deck'],
  },
  {
    id: 'chair',
    label: 'Ghế - Bàn Gaming',
    icon: 'chair',
    keywords: ['ghế', 'bàn gaming', 'chair', 'desk'],
  },
  {
    id: 'accessory',
    label: 'Phụ Kiện (Hub, Cáp)',
    icon: 'accessory',
    keywords: ['phụ kiện', 'hub', 'cáp', 'sạc', 'adapter', 'pin dự phòng', 'giá đỡ'],
  },
];

// Hàm rút gọn số lượng đã bán giống Shopee (VD: 1250 -> 1,2k)
const formatSoldCount = (count = 0) => {
  const num = Number(count) || 0;
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1).replace('.', ',')}k`;
  }
  return num.toString();
};

const MarketplaceHome = () => {
  const [products, setProducts] = useState([]);
  const [stores, setStores] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedStore, setSelectedStore] = useState('ALL');
  const [sortBy, setSortBy] = useState('DEFAULT'); // DEFAULT, PRICE_ASC, PRICE_DESC, SOLD, NAME
  const [priceRange, setPriceRange] = useState('ALL'); // ALL, UNDER_5M, 5M_20M, OVER_20M
  const [loading, setLoading] = useState(true);
  const [addedNotice, setAddedNotice] = useState('');

  const navigate = useNavigate();
  const location = useLocation();
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
    if (!authService.isCustomerAuthenticated() || !addToCart(product, 1)) {
      navigate('/login', {
        state: {
          from: location,
          message: 'Vui lòng đăng nhập tài khoản khách hàng để thêm sản phẩm vào giỏ hàng và mua sắm!',
        },
      });
      return;
    }
    setAddedNotice(`Đã thêm "${product.tenSanPham}" vào giỏ hàng!`);
    setTimeout(() => setAddedNotice(''), 2500);
  };

  // Xử lý click chọn danh mục (bấm lại danh mục đang chọn sẽ trở về ALL)
  const handleSelectCategory = (catId) => {
    setSelectedCategory((prev) => (prev === catId ? 'ALL' : catId));
  };

  // Lấy thông tin danh mục đang được chọn để hiển thị tên trong thông báo
  const activeCategoryObj = useMemo(
    () => SHOPEE_CATEGORIES.find((c) => c.id === selectedCategory) || null,
    [selectedCategory]
  );

  // Bộ lọc sản phẩm đa tiêu chí
  const filteredProducts = useMemo(() => {
    let result = products.filter((p) => {
      // 1. Lọc theo danh mục kiểu Shopee
      let matchCat = true;
      if (selectedCategory !== 'ALL' && activeCategoryObj) {
        const prodName = (p.tenSanPham || '').toLowerCase();
        const prodCat = (p.danhMuc || '').toLowerCase();
        const combinedText = `${prodName} ${prodCat}`;

        const hasKeyword = activeCategoryObj.keywords.some((kw) =>
          combinedText.includes(kw.toLowerCase())
        );
        const hasExcluded = (activeCategoryObj.excludeKeywords || []).some((ex) =>
          combinedText.includes(ex.toLowerCase())
        );

        matchCat = hasKeyword && !hasExcluded;
      }

      // 2. Lọc theo gian hàng (Shop)
      const matchStore = selectedStore === 'ALL' || p.khoHangId === Number(selectedStore);

      // 3. Lọc theo từ khóa tìm kiếm (Tên, SKU, Gian hàng, Danh mục)
      let matchQuery = true;
      if (queryParam.trim()) {
        const q = queryParam.toLowerCase().trim();
        const nameMatch = (p.tenSanPham || '').toLowerCase().includes(q);
        const skuMatch = (p.sku || '').toLowerCase().includes(q);
        const shopMatch = (p.tenShop || p.tenKho || '').toLowerCase().includes(q);
        const catMatch = (p.danhMuc || '').toLowerCase().includes(q);
        matchQuery = nameMatch || skuMatch || shopMatch || catMatch;
      }

      // 4. Lọc theo khoảng giá
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
  }, [products, selectedCategory, activeCategoryObj, selectedStore, queryParam, priceRange, sortBy]);

  const clearAllFilters = () => {
    setSelectedCategory('ALL');
    setSelectedStore('ALL');
    setSortBy('DEFAULT');
    setPriceRange('ALL');
    setSearchParams({});
  };

  const hasActiveFilters =
    selectedCategory !== 'ALL' ||
    selectedStore !== 'ALL' ||
    queryParam ||
    priceRange !== 'ALL' ||
    sortBy !== 'DEFAULT';

  return (
    <div className="marketplace-home">
      {/* Toast thông báo thêm giỏ hàng */}
      {addedNotice && (
        <div className="toast-notification">
          <FiCheck size={18} /> {addedNotice}
        </div>
      )}

      {/* 🌟 THANH TRƯỢT QUẢNG CÁO */}
      {!queryParam && (
        <section className="container promo-slider-section" style={{ paddingTop: '20px' }}>
          <PromoSlider products={products} stores={stores} />
        </section>
      )}

      {/* 🏪 GIAN HÀNG CHÍNH HÃNG */}
      {!queryParam && (
        <section className="stores-section">
          <div className="container">
            <div className="shopee-white-box">
              <div className="section-header">
                <div>
                  <h3 className="section-title">GIAN HÀNG CHÍNH HÃNG TRÊN SÀN</h3>
                  <p className="section-subtitle">
                    Ghé thăm trang riêng của từng Chủ cửa hàng để nhận Voucher độc quyền
                  </p>
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
                      <img
                        src={
                          store.anhDaiDienShop ||
                          'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=100'
                        }
                        alt={store.tenKho}
                      />
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
          </div>
        </section>
      )}

      {/* 📦 KHỐI DANH MỤC PHONG CÁCH SHOPEE + ICON CÔNG NGHỆ */}
      <section className="shopee-category-section">
        <div className="container">
          <div className="shopee-category-card">
            <div className="shopee-category-header">
              <h3 className="shopee-category-title">DANH MỤC</h3>
              {selectedCategory !== 'ALL' && (
                <button
                  className="btn-category-reset"
                  onClick={() => setSelectedCategory('ALL')}
                >
                  Xem tất cả danh mục
                </button>
              )}
            </div>

            <div className="shopee-category-grid">
              {SHOPEE_CATEGORIES.map((cat) => {
                const isActive = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    className={`shopee-cat-item ${isActive ? 'active' : ''}`}
                    onClick={() => handleSelectCategory(cat.id)}
                  >
                    <div className="shopee-cat-icon-circle">
                      <CategoryIcon type={cat.icon} />
                    </div>
                    <span className="shopee-cat-label">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* 🛒 DANH SÁCH SẢN PHẨM PHONG CÁCH SHOPEE */}
      <section className="catalog-section">
        <div className="container">
          {/* Thông báo kết quả tìm kiếm nếu có query */}
          {queryParam && (
            <div className="search-result-banner">
              <div>
                <span className="search-tag-label">
                  <FiSearch /> Kết quả tìm kiếm cho:
                </span>
                <strong className="search-query-text">"{queryParam}"</strong>
                <span className="search-count-pill">({filteredProducts.length} sản phẩm)</span>
              </div>
              <button className="btn-clear-query" onClick={() => setSearchParams({})}>
                <FiX /> Bỏ tìm kiếm
              </button>
            </div>
          )}

          {/* Thanh tiêu đề GỢI Ý HÔM NAY + Bộ lọc sắp xếp & mức giá */}
          <div className="shopee-section-bar">
            <div className="shopee-section-tab">
              {activeCategoryObj ? `SẢN PHẨM: ${activeCategoryObj.label.toUpperCase()}` : 'GỢI Ý HÔM NAY'}
            </div>

            <div className="filter-controls-row">
              <div className="sort-select-wrap">
                <label>
                  <FiTrendingUp /> Sắp xếp:
                </label>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                  <option value="DEFAULT">Phổ biến</option>
                  <option value="SOLD">Bán chạy nhất</option>
                  <option value="PRICE_ASC">Giá: Thấp đến Cao</option>
                  <option value="PRICE_DESC">Giá: Cao đến Thấp</option>
                  <option value="NAME">Tên: A - Z</option>
                </select>
              </div>

              <div className="price-filter-wrap">
                <label>
                  <FiFilter /> Mức giá:
                </label>
                <select value={priceRange} onChange={(e) => setPriceRange(e.target.value)}>
                  <option value="ALL">Tất cả mức giá</option>
                  <option value="UNDER_5M">Dưới 5 triệu</option>
                  <option value="5M_20M">Từ 5 - 20 triệu</option>
                  <option value="OVER_20M">Trên 20 triệu</option>
                </select>
              </div>

              {hasActiveFilters && (
                <button
                  className="btn-reset-filters"
                  onClick={clearAllFilters}
                  title="Đặt lại bộ lọc"
                >
                  <FiX size={14} /> Xóa Lọc
                </button>
              )}
            </div>
          </div>

          {/* Thanh tóm tắt trạng thái lọc */}
          <div className="product-summary-bar">
            <span>
              Hiển thị <strong>{filteredProducts.length}</strong> sản phẩm đang mở bán
            </span>
            {activeCategoryObj && (
              <span className="active-filter-badge">
                Danh mục: {activeCategoryObj.label}{' '}
                <FiX onClick={() => setSelectedCategory('ALL')} />
              </span>
            )}
            {selectedStore !== 'ALL' && (
              <span className="active-filter-badge">
                Gian hàng: #{selectedStore} <FiX onClick={() => setSelectedStore('ALL')} />
              </span>
            )}
          </div>

          {/* Lưới Sản Phẩm */}
          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Đang tải danh sách sản phẩm từ các gian hàng...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="empty-state-box">
              <div className="empty-state-icon">
                <FiPackage size={44} />
              </div>
              <h4 className="empty-state-title">Không có dữ liệu sản phẩm</h4>
              <p className="empty-state-desc">
                {activeCategoryObj
                  ? `Hiện tại chưa có sản phẩm nào thuộc danh mục "${activeCategoryObj.label}". Vui lòng chọn danh mục khác hoặc xem toàn bộ sản phẩm.`
                  : 'Không tìm thấy sản phẩm nào phù hợp với điều kiện tìm kiếm và bộ lọc hiện tại.'}
              </p>
              <button className="btn-reset-filters-large" onClick={clearAllFilters}>
                Xem Toàn Bộ Sản Phẩm
              </button>
            </div>
          ) : (
            <div className="shopee-products-grid">
              {filteredProducts.map((p) => {
                const price = Number(p.giaBanHienTai || p.giaBan || 0);
                const originalPrice = Number(p.giaBan || price);
                const hasDiscount = originalPrice > price;
                const discountPercent = hasDiscount
                  ? Math.round(((originalPrice - price) / originalPrice) * 100)
                  : 0;
                const rating = p.rating || '4.9';

                return (
                  <div key={`${p.sanPhamId}-${p.khoHangId}`} className="shopee-product-card">
                    <Link to={`/products/${p.sanPhamId}`} className="shopee-card-link">
                      {/* Khung ảnh vuông 1:1 chuẩn Shopee */}
                      <div className="shopee-img-wrap">
                        <img
                          src={
                            p.hinhAnh ||
                            'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500'
                          }
                          alt={p.tenSanPham}
                        />

                        {/* Tem Yêu thích góc trái */}
                        <span className="shopee-badge-like">Yêu thích</span>

                        {/* Tem % giảm giá góc phải */}
                        {hasDiscount && discountPercent > 0 && (
                          <span className="shopee-badge-discount">-{discountPercent}%</span>
                        )}
                      </div>

                      {/* Nội dung thẻ sản phẩm */}
                      <div className="shopee-card-body">
                        <h4 className="shopee-product-name" title={p.tenSanPham}>
                          {p.tenSanPham}
                        </h4>

                        {/* Nhãn phụ + Tên gian hàng giống tag Shopee */}
                        <div className="shopee-tags-row">
                          <span className="shopee-tag-outline">Chính hãng</span>
                          {hasDiscount && <span className="shopee-tag-deal">Rẻ Vô Địch</span>}
                        </div>

                        {/* Khu vực giá bán màu cam đỏ Shopee (#ee4d2d) */}
                        <div className="shopee-price-row">
                          <div className="shopee-price-current">
                            <span className="shopee-currency">₫</span>
                            <span className="shopee-sale-price">
                              {price.toLocaleString('vi-VN')}
                            </span>
                          </div>
                          {hasDiscount && (
                            <span className="shopee-orig-price">
                              ₫{originalPrice.toLocaleString('vi-VN')}
                            </span>
                          )}
                        </div>

                        {/* Đánh giá sao + Đã bán */}
                        <div className="shopee-meta-row">
                          <span className="shopee-rating">
                            <span className="shopee-star">★</span> {rating}
                          </span>
                          <span className="shopee-sold">
                            Đã bán {formatSoldCount(p.soLuongDaBan)}
                          </span>
                        </div>

                        {/* Vị trí / Tên shop */}
                        <div className="shopee-shop-row">
                          <FiMapPin size={11} />
                          <span className="shopee-shop-name">{p.tenShop || p.tenKho || 'Cần Thơ'}</span>
                        </div>
                      </div>
                    </Link>

                    {/* Nút thêm giỏ hàng đồng bộ phong cách Shopee */}
                    <button
                      type="button"
                      className="shopee-btn-cart"
                      onClick={(e) => handleAddToCart(p, e)}
                      title="Thêm vào giỏ hàng"
                    >
                      <FiShoppingCart size={14} /> Thêm vào giỏ hàng
                    </button>
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