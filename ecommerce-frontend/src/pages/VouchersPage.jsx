// src/pages/VouchersPage.jsx
import { useState, useEffect } from 'react';
import { marketplaceService } from '../services/marketplaceService';
import { FiTag, FiCheck, FiCopy, FiGift } from 'react-icons/fi';
import './VouchersPage.css';

const VouchersPage = () => {
  const [globalVouchers, setGlobalVouchers] = useState([]);
  const [copiedCode, setCopiedCode] = useState('');

  useEffect(() => {
    const fetchVouchers = async () => {
      const gVouchers = await marketplaceService.getGlobalVouchers();
      setGlobalVouchers(gVouchers);
    };
    fetchVouchers();
  }, []);

  const handleCopy = (code) => {
    navigator.clipboard?.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(''), 2500);
  };

  return (
    <div className="vouchers-page">
      <div className="container">
        <div className="vouchers-header">
          <div className="vouchers-title-wrap">
            <FiGift className="header-icon" />
            <div>
              <h2>Kho Voucher Khuyến Mãi Toàn Sàn</h2>
              <p>Thu thập mã giảm giá và áp dụng khi thanh toán giỏ hàng đa shop để tiết kiệm tối đa!</p>
            </div>
          </div>
        </div>

        <div className="vouchers-list-grid">
          {globalVouchers.map((v) => (
            <div key={v.id} className="big-voucher-card">
              <div className="b-voucher-left">
                <span className="b-voucher-icon">🏷️</span>
                <span className="b-percent">GIẢM {v.phanTramGiam}%</span>
                <span className="b-max">Tối đa {Number(v.giamToiDa).toLocaleString('vi-VN')} đ</span>
              </div>
              <div className="b-voucher-right">
                <div className="b-code-badge">{v.maVoucher}</div>
                <p className="b-desc">{v.moTa || `Đơn hàng tối thiểu ${Number(v.donHangToiThieu).toLocaleString('vi-VN')} đ`}</p>
                <div className="b-footer">
                  <span className="b-scope">🌐 Áp dụng cho mọi Gian hàng</span>
                  <button 
                    className="btn-copy-code"
                    onClick={() => handleCopy(v.maVoucher)}
                  >
                    {copiedCode === v.maVoucher ? <><FiCheck /> Đã Lưu Mã</> : <><FiCopy /> Lưu Mã Ngay</>}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default VouchersPage;

