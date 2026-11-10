// src/components/PromoSlider.jsx
import { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  FiChevronLeft, FiChevronRight, FiZap, 
  FiShoppingBag, FiShield, FiTruck, FiArrowRight 
} from 'react-icons/fi';
import './PromoSlider.css';

export const PromoSlider = ({ products = [], stores = [] }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef(null);

  // Thuật toán hệ thống: Tự động tuyển chọn sản phẩm Mới lên sàn và Bán chạy nhất để quảng bá
  const promoSlides = useMemo(() => {
    if (!products || products.length === 0) {
      // Fallback banner mặc định nếu CSDL chưa nạp sản phẩm
      return [
        {
          id: 'def-1',
          productId: 1,
          badgeType: 'BEST_SELLER',
          badgeText: '🔥 SẢN PHẨM BÁN CHẠY NHẤT TOÀN SÀN',
          tenSanPham: 'VGA ASUS ROG Strix GeForce RTX 4090 24GB GDDR6X Gaming OC',
          tenShop: 'ASUS ROG Flagship Store CTUT',
          giaBan: 52990000,
          giaGoc: 59990000,
          phanTramGiam: 12,
          hinhAnh: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=800&auto=format&fit=crop',
          moTa: 'Chiến mượt mọi tựa game AAA ở độ phân giải 4K Ultra Settings. Bảo hành 1 đổi 1 trong 30 ngày tại Kho Tổng.',
          highlight: 'Ray Tracing Thế Hệ 3 • DLSS 3.5 AI'
        },
        {
          id: 'def-2',
          productId: 2,
          badgeType: 'NEW_ARRIVAL',
          badgeText: '🚀 SIÊU PHẨM MỚI LÊN KỆ HÔM NAY',
          tenSanPham: 'Laptop Gaming Alienware M18 R2 Core i9-14900HX / RTX 4080',
          tenShop: 'CTUT Gaming & Gear Hub',
          giaBan: 76990000,
          giaGoc: 84990000,
          phanTramGiam: 10,
          hinhAnh: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=800&auto=format&fit=crop',
          moTa: 'Quái vật hiệu năng thế hệ mới với màn hình 18 inch QHD+ 165Hz. Phân phối chính hãng từ Master Catalog.',
          highlight: 'Hệ Thống Tản Nhiệt Cryo-Tech • Màn Hình 18 Inch'
        }
      ];
    }

    const slides = [];

    // 1. Tuyển chọn các sản phẩm Bán chạy nhất (Sắp xếp theo soLuongDaBan giảm dần)
    const sortedBySold = [...products].sort((a, b) => (b.soLuongDaBan || 0) - (a.soLuongDaBan || 0));
    const topSeller = sortedBySold[0];
    if (topSeller) {
      const price = topSeller.giaBanHienTai || topSeller.giaBan || 15000000;
      slides.push({
        id: `best-${topSeller.sanPhamId || topSeller.id}`,
        productId: topSeller.sanPhamId || topSeller.id,
        badgeType: 'BEST_SELLER',
        badgeText: '🔥 SẢN PHẨM BÁN CHẠY NHẤT TOÀN SÀN',
        tenSanPham: topSeller.tenSanPham,
        tenShop: topSeller.tenShop || topSeller.tenKho || 'CTUT Official Mall',
        giaBan: price,
        giaGoc: Math.round(price * 1.15),
        phanTramGiam: 15,
        hinhAnh: topSeller.hinhAnh || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800',
        moTa: topSeller.moTa || 'Sản phẩm công nghệ cao cấp chính hãng, bán chạy số 1 tại hệ thống kho bãi liên kết.',
        highlight: `Đã bán ${topSeller.soLuongDaBan || 250}+ chiếc • Sẵn hàng giao hỏa tốc`
      });
    }

    // 2. Tuyển chọn các sản phẩm Mới nhất đưa lên sàn (ID cao nhất hoặc ngày tạo mới nhất)
    const sortedByNew = [...products].sort((a, b) => (b.id || b.sanPhamId || 0) - (a.id || a.sanPhamId || 0));
    const topNew = sortedByNew.find((p) => (p.sanPhamId || p.id) !== (topSeller?.sanPhamId || topSeller?.id)) || sortedByNew[0];
    if (topNew) {
      const price = topNew.giaBanHienTai || topNew.giaBan || 20000000;
      slides.push({
        id: `new-${topNew.sanPhamId || topNew.id}`,
        productId: topNew.sanPhamId || topNew.id,
        badgeType: 'NEW_ARRIVAL',
        badgeText: '🚀 SIÊU PHẨM MỚI LÊN KỆ HÔM NAY',
        tenSanPham: topNew.tenSanPham,
        tenShop: topNew.tenShop || topNew.tenKho || 'Gian Hàng Chính Hãng',
        giaBan: price,
        giaGoc: Math.round(price * 1.12),
        phanTramGiam: 12,
        hinhAnh: topNew.hinhAnh || 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=800',
        moTa: topNew.moTa || 'Linh kiện công nghệ thế hệ mới nhất vừa được nhập từ Kho Tổng và kích hoạt mở bán.',
        highlight: 'Công Nghệ Đột Phá • Bảo Hành 1 Đổi 1 Tại Kho Tổng'
      });
    }

    // 3. Thêm một sản phẩm Deal Hot giá tốt
    if (products.length > 2) {
      const hotDeal = products[2];
      const price = hotDeal.giaBanHienTai || hotDeal.giaBan || 8000000;
      slides.push({
        id: `hot-${hotDeal.sanPhamId || hotDeal.id}`,
        productId: hotDeal.sanPhamId || hotDeal.id,
        badgeType: 'HOT_DEAL',
        badgeText: '⚡ DEAL CÔNG NGHỆ GIÁ SỐC HÔM NAY',
        tenSanPham: hotDeal.tenSanPham,
        tenShop: hotDeal.tenShop || hotDeal.tenKho || 'CTUT Gear Hub',
        giaBan: price,
        giaGoc: Math.round(price * 1.2),
        phanTramGiam: 20,
        hinhAnh: hotDeal.hinhAnh || 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=800',
        moTa: hotDeal.moTa || 'Ưu đãi số lượng có hạn do gian hàng đối tác tài trợ độc quyền.',
        highlight: 'Giảm Ngay 20% • Tặng Kèm Voucher Toàn Sàn'
      });
    }

    return slides;
  }, [products]);

  // Tự động chuyển slide sau mỗi 4.5 giây
  useEffect(() => {
    if (isPaused || promoSlides.length <= 1) return;

    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % promoSlides.length);
    }, 4500);

    return () => clearInterval(timerRef.current);
  }, [isPaused, promoSlides.length]);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + promoSlides.length) % promoSlides.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % promoSlides.length);
  };

  if (promoSlides.length === 0) return null;

  const currentSlide = promoSlides[currentIndex];

  return (
    <div 
      className="promo-slider-wrapper"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="promo-slider-container">
        {/* Nội dung Slide */}
        <div className="promo-slide-item">
          <div className="slide-content-left">
            <div className={`promo-badge-tag ${currentSlide.badgeType}`}>
              {currentSlide.badgeText}
            </div>

            <div className="slide-shop-name">
              <FiShoppingBag size={14} /> {currentSlide.tenShop}
            </div>

            <h2 className="slide-title">{currentSlide.tenSanPham}</h2>
            
            <p className="slide-desc">{currentSlide.moTa}</p>

            <div className="slide-highlight-pill">
              <FiZap size={13} color="#f59e0b" /> {currentSlide.highlight}
            </div>

            <div className="slide-pricing-row">
              <span className="slide-current-price">
                {Number(currentSlide.giaBan).toLocaleString('vi-VN')} đ
              </span>
              {currentSlide.giaGoc && (
                <span className="slide-original-price">
                  {Number(currentSlide.giaGoc).toLocaleString('vi-VN')} đ
                </span>
              )}
              {currentSlide.phanTramGiam && (
                <span className="slide-discount-badge">
                  -{currentSlide.phanTramGiam}%
                </span>
              )}
            </div>

            <div className="slide-actions-row">
              <Link to={`/products/${currentSlide.productId}`} className="btn-slide-cta">
                XEM CHI TIẾT SẢN PHẨM <FiArrowRight size={16} />
              </Link>
              <div className="slide-trust-tags">
                <span><FiShield size={13} /> 100% Chính Hãng</span>
                <span><FiTruck size={13} /> Giao Hỏa Tốc 2H</span>
              </div>
            </div>
          </div>

          <div className="slide-content-right">
            <Link to={`/products/${currentSlide.productId}`} className="slide-img-link">
              <div className="slide-img-glow"></div>
              <img 
                src={currentSlide.hinhAnh} 
                alt={currentSlide.tenSanPham} 
                className="slide-product-img"
              />
            </Link>
          </div>
        </div>

        {/* Nút Điều Hướng Trái / Phải */}
        <button className="slider-arrow-btn prev" onClick={handlePrev} aria-label="Slide trước">
          <FiChevronLeft size={22} />
        </button>
        <button className="slider-arrow-btn next" onClick={handleNext} aria-label="Slide tiếp theo">
          <FiChevronRight size={22} />
        </button>

        {/* Chấm Chỉ Số Slide (Dots Indicator) */}
        <div className="slider-dots-bar">
          {promoSlides.map((s, idx) => (
            <button
              key={s.id}
              className={`dot-indicator ${idx === currentIndex ? 'active' : ''}`}
              onClick={() => setCurrentIndex(idx)}
              aria-label={`Chuyển đến quảng cáo ${idx + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default PromoSlider;
