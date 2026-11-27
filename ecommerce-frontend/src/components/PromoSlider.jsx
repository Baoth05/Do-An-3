// src/components/PromoSlider.jsx
import React, { useState, useEffect } from 'react';
import { 
  FiChevronLeft, FiChevronRight, 
  FiShield, FiTruck, FiTag, FiAward, FiHeadphones 
} from 'react-icons/fi';
import './PromoSlider.css';

// Import đủ 12 hình ảnh
import img1 from '../assets/01_Laptop_AI.png';
import img2 from '../assets/02_NVIDIA_GeForce_RTX.png';
import img3 from '../assets/03_Gaming_PC.png';
import img4 from '../assets/04_Intel_AMD_CPU.png';
import img5 from '../assets/05_Linh_kien_PC.png';
import img6 from '../assets/06_Laptop_Deal.png';
import img7 from '../assets/07_NVIDIA_RTX_50.png';
import img8 from '../assets/08_AMD_Ryzen.png';
import img9 from '../assets/09_Intel_Core_Ultra.png';
import img10 from '../assets/10_Phu_kien_PC.png';
import img11 from '../assets/11_Man_hinh_Gaming.png';
import img12 from '../assets/12_SSD_Luu_tru.png';

export const PromoSlider = () => {
  // 10 ảnh có hiệu ứng trượt tự động (Bên trái - chiếm 2/3)
  const sliderImages = [
    { src: img1, alt: 'Banner 1' },
    { src: img2, alt: 'Banner 2' },
    { src: img3, alt: 'Banner 3' },
    { src: img4, alt: 'Banner 4' },
    { src: img5, alt: 'Banner 5' },
    { src: img6, alt: 'Banner 6' },
    { src: img7, alt: 'Banner 7' },
    { src: img8, alt: 'Banner 8' },
    { src: img9, alt: 'Banner 9' },
    { src: img10, alt: 'Banner 10' },
  ];

  // 2 ảnh phụ cố định xếp chồng (Bên phải - chiếm 1/3)
  const sideImages = [
    { src: img11, alt: 'Banner Phụ 1' },
    { src: img12, alt: 'Banner Phụ 2' },
  ];

  const marketingBadges = [
    { icon: <FiShield size={20} />, title: '100% Chính Hãng' },
    { icon: <FiTruck size={20} />, title: 'Giao Hỏa Tốc 2H' },
    { icon: <FiTag size={20} />, title: 'Deal Sốc Mỗi Ngày' },
    { icon: <FiAward size={20} />, title: 'Bảo Hành 1 Đổi 1' },
    { icon: <FiHeadphones size={20} />, title: 'Tư Vấn 24/7' },
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev === sliderImages.length - 1 ? 0 : prev + 1));
    }, 4000);
    return () => clearInterval(timer);
  }, [isPaused, sliderImages.length]);

  const nextSlide = () => setCurrentIndex((prev) => (prev === sliderImages.length - 1 ? 0 : prev + 1));
  const prevSlide = () => setCurrentIndex((prev) => (prev === 0 ? sliderImages.length - 1 : prev - 1));

  return (
    <div className="promo-wrapper">
      
      {/* KHỐI BANNER THEO BỐ CỤC 2/3 & 1/3 */}
      <div className="banners-layout">
        
        {/* 1. SLIDER TRÁI */}
        <div 
          className="main-slider-box"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <div 
            className="slider-track" 
            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          >
            {sliderImages.map((item, index) => (
              <div className="slide-image" key={index}>
                <img src={item.src} alt={item.alt} />
              </div>
            ))}
          </div>

          <button className="nav-arrow prev" onClick={prevSlide}>
            <FiChevronLeft size={24} />
          </button>
          <button className="nav-arrow next" onClick={nextSlide}>
            <FiChevronRight size={24} />
          </button>

          <div className="slider-indicators">
            {sliderImages.map((_, index) => (
              <span
                key={index}
                className={`indicator-dot ${currentIndex === index ? 'active' : ''}`}
                onClick={() => setCurrentIndex(index)}
              />
            ))}
          </div>
        </div>

        {/* 2. ẢNH PHỤ PHẢI */}
        <div className="side-banners-box">
          {sideImages.map((item, index) => (
            <div className="side-banner-item" key={index}>
              <img src={item.src} alt={item.alt} />
            </div>
          ))}
        </div>
        
      </div>

      {/* DẢI CAM KẾT DƯỚI CÙNG KIỂU SHOPEE */}
      <div className="marketing-strip">
        {marketingBadges.map((badge, idx) => (
          <div className="marketing-item" key={idx}>
            <span className="marketing-icon">{badge.icon}</span>
            <span className="marketing-title">{badge.title}</span>
          </div>
        ))}
      </div>

    </div>
  );
};

export default PromoSlider;