// src/components/Footer.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import {
  FaFacebook,
  FaInstagram,
  FaLinkedin,
  FaYoutube,
  FaApple,
  FaGooglePlay,
  FaQrcode,
  FaShieldAlt,
  FaCheckCircle,
} from 'react-icons/fa';
import './Footer.css';

/* ==========================================================================
   BỘ ICON LOGO THANH TOÁN CHUẨN SHOPEE (SVG SẮC NÉT, KHÔNG BỊ LỖI ẢNH)
   ========================================================================== */
const PaymentIcons = {
  visa: (
    <svg viewBox="0 0 64 24" className="pay-svg" aria-label="VISA">
      <polygon points="4,5 12,5 9,8" fill="#F7B600" />
      <text
        x="34"
        y="18"
        textAnchor="middle"
        fill="#1A1F71"
        fontFamily="Arial, Helvetica, sans-serif"
        fontWeight="900"
        fontStyle="italic"
        fontSize="16"
        letterSpacing="0.5"
      >
        VISA
      </text>
    </svg>
  ),
  mastercard: (
    <svg viewBox="0 0 56 30" className="pay-svg" aria-label="Mastercard">
      <circle cx="21" cy="15" r="10.5" fill="#EB001B" />
      <circle cx="35" cy="15" r="10.5" fill="#F79E1B" />
      <path
        d="M28 6.8a10.5 10.5 0 0 0 0 16.4 10.5 10.5 0 0 0 0-16.4z"
        fill="#FF5F00"
      />
    </svg>
  ),
  jcb: (
    <svg viewBox="0 0 60 28" className="pay-svg" aria-label="JCB">
      <rect x="6" y="4" width="14" height="20" rx="3" fill="#0E4C96" />
      <rect x="23" y="4" width="14" height="20" rx="3" fill="#CC0023" />
      <rect x="40" y="4" width="14" height="20" rx="3" fill="#007B40" />
      <text x="13" y="18" textAnchor="middle" fill="#FFFFFF" fontWeight="800" fontSize="11">
        J
      </text>
      <text x="30" y="18" textAnchor="middle" fill="#FFFFFF" fontWeight="800" fontSize="11">
        C
      </text>
      <text x="47" y="18" textAnchor="middle" fill="#FFFFFF" fontWeight="800" fontSize="11">
        B
      </text>
    </svg>
  ),
  amex: (
    <svg viewBox="0 0 64 26" className="pay-svg" aria-label="AMEX">
      <rect x="4" y="3" width="56" height="20" rx="3" fill="#2E77BC" />
      <text
        x="32"
        y="17"
        textAnchor="middle"
        fill="#FFFFFF"
        fontFamily="Arial, Helvetica, sans-serif"
        fontWeight="900"
        fontSize="11"
        letterSpacing="0.8"
      >
        AMEX
      </text>
    </svg>
  ),
  cod: (
    <svg viewBox="0 0 70 26" className="pay-svg" aria-label="Thanh toán khi nhận hàng COD">
      {/* Biểu tượng tờ tiền mặt / giao nhận giống Shopee */}
      <rect x="5" y="6" width="20" height="14" rx="2" fill="none" stroke="#111111" strokeWidth="1.8" />
      <circle cx="15" cy="13" r="3" fill="#111111" />
      <text
        x="48"
        y="17"
        textAnchor="middle"
        fill="#111111"
        fontFamily="Arial, Helvetica, sans-serif"
        fontWeight="900"
        fontSize="12"
      >
        COD
      </text>
    </svg>
  ),
  installment: (
    <svg viewBox="0 0 74 26" className="pay-svg" aria-label="Trả góp 0%">
      {/* Vòng tròn 0% giống thẻ Trả góp Shopee */}
      <circle cx="15" cy="13" r="8.5" fill="none" stroke="#0055AA" strokeWidth="2" />
      <text x="15" y="16" textAnchor="middle" fill="#EE4D2D" fontWeight="900" fontSize="8">
        0%
      </text>
      <text
        x="49"
        y="12"
        textAnchor="middle"
        fill="#111111"
        fontFamily="Arial, Helvetica, sans-serif"
        fontWeight="800"
        fontSize="8"
      >
        TRẢ GÓP
      </text>
      <text
        x="49"
        y="21"
        textAnchor="middle"
        fill="#EE4D2D"
        fontFamily="Arial, Helvetica, sans-serif"
        fontWeight="800"
        fontSize="7.5"
      >
        LÃI SUẤT 0%
      </text>
    </svg>
  ),
  momo: (
    <svg viewBox="0 0 72 26" className="pay-svg" aria-label="Ví MoMo">
      <rect x="4" y="4" width="18" height="18" rx="4" fill="#A50064" />
      <text x="13" y="12" textAnchor="middle" fill="#FFFFFF" fontWeight="900" fontSize="6.5">
        mo
      </text>
      <text x="13" y="19" textAnchor="middle" fill="#FFFFFF" fontWeight="900" fontSize="6.5">
        mo
      </text>
      <text
        x="46"
        y="17"
        textAnchor="middle"
        fill="#A50064"
        fontFamily="Arial, Helvetica, sans-serif"
        fontWeight="900"
        fontSize="12"
      >
        MoMo
      </text>
    </svg>
  ),
  vnpay: (
    <svg viewBox="0 0 74 26" className="pay-svg" aria-label="VNPay">
      <text
        x="21"
        y="17.5"
        textAnchor="middle"
        fill="#E31E24"
        fontFamily="Arial, Helvetica, sans-serif"
        fontWeight="900"
        fontSize="12.5"
      >
        VN
      </text>
      <text
        x="49"
        y="17.5"
        textAnchor="middle"
        fill="#005BAA"
        fontFamily="Arial, Helvetica, sans-serif"
        fontWeight="900"
        fontSize="12.5"
      >
        PAY
      </text>
    </svg>
  ),
  zalopay: (
    <svg viewBox="0 0 78 26" className="pay-svg" aria-label="ZaloPay">
      <rect x="3" y="5" width="16" height="16" rx="4" fill="#0068FF" />
      <text x="11" y="16.5" textAnchor="middle" fill="#FFFFFF" fontWeight="900" fontSize="10">
        Z
      </text>
      <text
        x="36"
        y="17"
        textAnchor="middle"
        fill="#0068FF"
        fontFamily="Arial, Helvetica, sans-serif"
        fontWeight="900"
        fontSize="11"
      >
        Zalo
      </text>
      <text
        x="61"
        y="17"
        textAnchor="middle"
        fill="#00B14F"
        fontFamily="Arial, Helvetica, sans-serif"
        fontWeight="900"
        fontSize="11"
      >
        Pay
      </text>
    </svg>
  ),
};

export const Footer = () => {
  // Cột 1: Dịch vụ khách hàng (đã khớp route trong App.jsx)
  const customerServiceLinks = [
    { label: 'Trung Tâm Trợ Giúp CTUT', to: '/' },
    { label: 'Kho Voucher & Mã Giảm Giá', to: '/vouchers' },
    { label: 'Giỏ Hàng Của Bạn', to: '/cart' },
    { label: 'Quản Lý Tài Khoản', to: '/profile' },
    { label: 'Đăng Ký Bán Hàng Trên Sàn', to: '/seller/register' },
    { label: 'Đơn Hàng & Theo Dõi Vận Chuyển', to: '/my-orders' },
    { label: 'Hướng Dẫn Mua Hàng & Build PC', to: '/' },
    { label: 'Trả Hàng / Hoàn Tiền 1 Đổi 1', to: '/' },
    { label: 'Liên Hệ Chăm Sóc Khách Hàng', to: '/' },
    { label: 'Chính Sách Bảo Hành Linh Kiện', to: '/' },
  ];

  // Cột 2: Về CTUT GEAR (đã khớp route trong App.jsx)
  const aboutLinks = [
    { label: 'Về CTUT GEAR Việt Nam', to: '/' },
    { label: 'Tuyển Dụng Kỹ Thuật Viên', to: '/' },
    { label: 'Điều Khoản CTUT GEAR', to: '/' },
    { label: 'Chính Sách Bảo Mật', to: '/' },
    { label: 'Hệ Thống Kho Tổng Chuẩn Hóa', to: '/' },
    { label: 'Đăng Nhập Kênh Người Bán', to: '/seller/login' },
    { label: 'Flash Sale Công Nghệ', to: '/' },
    { label: 'Tiếp Thị Liên Kết (Affiliate)', to: '/' },
    { label: 'Liên Hệ Truyền Thông', to: '/' },
  ];

  // Cột 3: Chỉ giữ lại các phương thức Thanh toán có icon chuẩn Shopee
  const paymentMethods = [
    { key: 'visa', title: 'Thanh toán thẻ VISA' },
    { key: 'mastercard', title: 'Thanh toán thẻ Mastercard' },
    { key: 'jcb', title: 'Thanh toán thẻ JCB' },
    { key: 'amex', title: 'Thanh toán thẻ American Express' },
    { key: 'cod', title: 'Thanh toán khi nhận hàng (COD)' },
    { key: 'installment', title: 'Trả góp 0% lãi suất' },
    { key: 'momo', title: 'Thanh toán Ví MoMo' },
    { key: 'vnpay', title: 'Cổng thanh toán VNPay' },
    { key: 'zalopay', title: 'Thanh toán Ví ZaloPay' },
  ];

  // Khu vực phục vụ (Tầng 2)
  const regions = [
    'Cần Thơ',
    'TP. Hồ Chí Minh',
    'Hà Nội',
    'Đà Nẵng',
    'Hải Phòng',
    'Bình Dương',
    'Đồng Nai',
    'An Giang',
    'Kiên Giang',
    'Toàn Quốc',
  ];

  return (
    <footer id="ctut-shopee-footer" className="shopee-footer">
      {/* ==================== TẦNG 1: 5 CỘT CHÍNH ==================== */}
      <div className="footer-main-wrapper">
        <div className="footer-container">
          <div className="footer-grid-5">
            {/* CỘT 1: DỊCH VỤ KHÁCH HÀNG */}
            <div className="footer-col">
              <h4 className="footer-heading">DỊCH VỤ KHÁCH HÀNG</h4>
              <ul className="footer-link-list">
                {customerServiceLinks.map((item, idx) => (
                  <li key={idx}>
                    <Link to={item.to} className="footer-link">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* CỘT 2: VỀ CTUT GEAR */}
            <div className="footer-col">
              <h4 className="footer-heading">CTUT GEAR VIỆT NAM</h4>
              <ul className="footer-link-list">
                {aboutLinks.map((item, idx) => (
                  <li key={idx}>
                    <Link to={item.to} className="footer-link">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* CỘT 3: THANH TOÁN (ĐÃ BỎ LOGISTICS, THÊM ICON CHUẨN SHOPEE) */}
            <div className="footer-col">
              <h4 className="footer-heading">THANH TOÁN</h4>
              <div className="footer-badge-grid">
                {paymentMethods.map((method) => (
                  <div
                    key={method.key}
                    className="footer-mini-card"
                    title={method.title}
                  >
                    {PaymentIcons[method.key]}
                  </div>
                ))}
              </div>
            </div>

            {/* CỘT 4: THEO DÕI CHÚNG TÔI */}
            <div className="footer-col">
              <h4 className="footer-heading">THEO DÕI CTUT GEAR</h4>
              <ul className="footer-social-list">
                <li>
                  <a
                    href="https://facebook.com"
                    target="_blank"
                    rel="noreferrer"
                    className="footer-social-link"
                  >
                    <FaFacebook className="social-icon fb" />
                    <span>Facebook</span>
                  </a>
                </li>
                <li>
                  <a
                    href="https://instagram.com"
                    target="_blank"
                    rel="noreferrer"
                    className="footer-social-link"
                  >
                    <FaInstagram className="social-icon ig" />
                    <span>Instagram</span>
                  </a>
                </li>
                <li>
                  <a
                    href="https://linkedin.com"
                    target="_blank"
                    rel="noreferrer"
                    className="footer-social-link"
                  >
                    <FaLinkedin className="social-icon li" />
                    <span>LinkedIn</span>
                  </a>
                </li>
                <li>
                  <a
                    href="https://youtube.com"
                    target="_blank"
                    rel="noreferrer"
                    className="footer-social-link"
                  >
                    <FaYoutube className="social-icon yt" />
                    <span>YouTube</span>
                  </a>
                </li>
              </ul>
            </div>

            {/* CỘT 5: TẢI ỨNG DỤNG */}
            <div className="footer-col">
              <h4 className="footer-heading">TẢI ỨNG DỤNG CTUT GEAR</h4>
              <div className="footer-app-box">
                <div className="footer-qr-card" title="Quét mã tải ứng dụng">
                  <FaQrcode size={64} color="#000000" />
                </div>
                <div className="footer-store-list">
                  <a
                    href="#appstore"
                    className="footer-store-btn"
                    onClick={(e) => e.preventDefault()}
                  >
                    <FaApple size={15} />
                    <span>App Store</span>
                  </a>
                  <a
                    href="#googleplay"
                    className="footer-store-btn"
                    onClick={(e) => e.preventDefault()}
                  >
                    <FaGooglePlay size={13} />
                    <span>Google Play</span>
                  </a>
                  <a
                    href="#appgallery"
                    className="footer-store-btn"
                    onClick={(e) => e.preventDefault()}
                  >
                    <FaShieldAlt size={13} />
                    <span>AppGallery</span>
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* ==================== TẦNG 2: BẢN QUYỀN & KHU VỰC ==================== */}
          <div className="footer-copyright-bar">
            <div className="copyright-left">
              © 2026 CTUT GEAR. Tất cả các quyền được bảo lưu.
            </div>
            <div className="copyright-right">
              <span className="region-label">Khu vực phục vụ:</span>
              {regions.map((region, idx) => (
                <React.Fragment key={idx}>
                  <span className="region-item">{region}</span>
                  {idx < regions.length - 1 && (
                    <span className="region-divider">|</span>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ==================== TẦNG 3: CHÍNH SÁCH & PHÁP LÝ ==================== */}
      <div className="footer-bottom-wrapper">
        <div className="footer-container footer-bottom-content">
          {/* 4 link chính sách ngang */}
          <div className="footer-policy-links">
            <Link to="/" className="policy-item">
              CHÍNH SÁCH BẢO MẬT
            </Link>
            <Link to="/" className="policy-item">
              QUY CHẾ HOẠT ĐỘNG
            </Link>
            <Link to="/" className="policy-item">
              CHÍNH SÁCH VẬN CHUYỂN
            </Link>
            <Link to="/" className="policy-item">
              CHÍNH SÁCH TRẢ HÀNG VÀ HOÀN TIỀN
            </Link>
          </div>

          {/* Tem chứng nhận uy tín */}
          <div className="footer-certifications">
            <div className="cert-badge cert-red">
              <FaCheckCircle size={20} />
              <div className="cert-text">
                <strong>ĐÃ ĐĂNG KÝ</strong>
                <span>BỘ CÔNG THƯƠNG</span>
              </div>
            </div>
            <div className="cert-badge cert-orange">
              <FaShieldAlt size={20} />
              <div className="cert-text">
                <strong>CHỨNG NHẬN</strong>
                <span>HÀNG CHÍNH HÃNG</span>
              </div>
            </div>
          </div>

          {/* Thông tin sàn thương mại điện tử */}
          <div className="footer-company-name">
            Sàn Thương Mại Điện Tử Công Nghệ CTUT GEAR
          </div>
          <div className="footer-company-details">
            <p>
              Địa chỉ: Số 256 Nguyễn Văn Cừ, Phường An Hòa, Quận Ninh Kiều, TP. Cần Thơ, Việt Nam.
            </p>
            <p>
              Chăm sóc khách hàng: Gọi tổng đài 1900 2026 (miễn phí) hoặc trò chuyện trực tiếp qua khung Chat CTUT.
            </p>
            <p>
              Chịu Trách Nhiệm Quản Lý Nội Dung: Đội ngũ phát triển dự án CTUT GEAR - Khoa Công Nghệ Thông Tin.
            </p>
            <p>
              Mã số hệ thống: CTUT-ECOM-2026 — Bảo hành linh kiện & thiết bị chính hãng 1 đổi 1 toàn quốc.
            </p>
            <p className="footer-final-copy">
              © 2026 - Bản quyền thuộc về Sàn TMĐT CTUT GEAR
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;