// src/pages/VouchersPage.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { marketplaceService } from '../services/marketplaceService';
import { FiTag, FiCheck, FiCopy, FiGift, FiShoppingBag, FiTrash2, FiArrowRight } from 'react-icons/fi';
import './VouchersPage.css';

const VouchersPage = () => {
  const [globalVouchers, setGlobalVouchers] = useState([]);
  const [savedCodes, setSavedCodes] = useState(() => {
    try {
      const raw = localStorage.getItem('user_saved_vouchers');
      return raw ? JSON.parse(raw) : ['CTUT50K'];
    } catch {
      return ['CTUT50K'];
    }
  });
  const [activeTab, setActiveTab] = useState('ALL'); // ALL, SAVED
  const [copiedCode, setCopiedCode] = useState('');

  useEffect(() => {
    const fetchVouchers = async () => {
      const gVouchers = await marketplaceService.getGlobalVouchers();
      setGlobalVouchers(gVouchers);
    };
    fetchVouchers();
  }, []);

  const handleSaveVoucher = (code) => {
    navigator.clipboard?.writeText(code);
    setCopiedCode(code);
    if (!savedCodes.includes(code)) {
      const next = [...savedCodes, code];
      setSavedCodes(next);
      localStorage.setItem('user_saved_vouchers', JSON.stringify(next));
    }
    setTimeout(() => setCopiedCode(''), 2500);
  };

  const handleRemoveSavedVoucher = (code) => {
    const next = savedCodes.filter((c) => c !== code);
    setSavedCodes(next);
    localStorage.setItem('user_saved_vouchers', JSON.stringify(next));
  };

  const displayedVouchers = activeTab === 'ALL' 
    ? globalVouchers 
    : globalVouchers.filter((v) => savedCodes.includes(v.maVoucher));

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
          <Link to="/cart" className="btn-go-cart">
            <FiShoppingBag /> Xem Giỏ Hàng & Dùng Mã
          </Link>
        </div>

        {/* Tabs chọn */}
        <div className="voucher-tabs">
          <button 
            className={`v-tab-btn ${activeTab === 'ALL' ? 'active' : ''}`}
            onClick={() => setActiveTab('ALL')}
          >
            Tất Cả Voucher Toàn Sàn ({globalVouchers.length})
          </button>
          <button 
            className={`v-tab-btn ${activeTab === 'SAVED' ? 'active' : ''}`}
            onClick={() => setActiveTab('SAVED')}
          >
            Voucher Của Tôi Đã Lưu ({savedCodes.length})
          </button>
        </div>

        {displayedVouchers.length === 0 ? (
          <div className="empty-vouchers-card">
            <p>Bạn chưa lưu voucher nào. Hãy khám phá và lưu các mã giảm giá hấp dẫn bên dưới!</p>
            <button className="btn-see-all-v" onClick={() => setActiveTab('ALL')}>
              Xem Tất Cả Voucher
            </button>
          </div>
        ) : (
          <div className="vouchers-list-grid">
            {displayedVouchers.map((v) => {
              const isSaved = savedCodes.includes(v.maVoucher);
              return (
                <div key={v.id} className="big-voucher-card">
                  <div className="b-voucher-left">
                    <span className="b-voucher-icon">🏷️</span>
                    <span className="b-percent">GIẢM {v.phanTramGiam}%</span>
                    <span className="b-max">Tối đa {Number(v.giamToiDa).toLocaleString('vi-VN')} đ</span>
                  </div>
                  <div className="b-voucher-right">
                    <div className="b-header-line">
                      <div className="b-code-badge">{v.maVoucher}</div>
                      {isSaved && activeTab === 'SAVED' && (
                        <button 
                          className="btn-remove-v" 
                          onClick={() => handleRemoveSavedVoucher(v.maVoucher)}
                          title="Bỏ lưu voucher"
                        >
                          <FiTrash2 /> Bỏ lưu
                        </button>
                      )}
                    </div>
                    <p className="b-desc">{v.moTa || `Đơn hàng tối thiểu ${Number(v.donHangToiThieu).toLocaleString('vi-VN')} đ`}</p>
                    <div className="b-footer">
                      <span className="b-scope">🌐 Áp dụng cho mọi Gian hàng</span>
                      <div className="voucher-actions-btn-group">
                        <button 
                          className="btn-copy-code"
                          onClick={() => handleSaveVoucher(v.maVoucher)}
                        >
                          {copiedCode === v.maVoucher ? (
                            <><FiCheck /> Đã Lưu & Copy</>
                          ) : isSaved ? (
                            <><FiCheck /> Đã Lưu Mã</>
                          ) : (
                            <><FiCopy /> Lưu Mã Ngay</>
                          )}
                        </button>
                        <Link to="/cart" className="btn-use-now">
                          Dùng Ngay <FiArrowRight />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default VouchersPage;
