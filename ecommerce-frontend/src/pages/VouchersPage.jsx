// src/pages/VouchersPage.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { marketplaceService } from '../services/marketplaceService';
import { 
  FiTag, FiCheck, FiCopy, FiGift, FiShoppingBag, FiTrash2, 
  FiArrowRight, FiCheckCircle 
} from 'react-icons/fi';
import './VouchersPage.css';

const VouchersPage = () => {
  const [globalVouchers, setGlobalVouchers] = useState([]);
  const [storeVouchersList, setStoreVouchersList] = useState([]);
  const [savedVouchers, setSavedVouchers] = useState([]);
  const [activeTab, setActiveTab] = useState('ALL'); // ALL, STORES, SAVED
  const [copiedCode, setCopiedCode] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  const loadData = async () => {
    // 1. Voucher Toàn Sàn
    const gVouchers = await marketplaceService.getGlobalVouchers();
    setGlobalVouchers(gVouchers);

    // 2. Voucher Gian Hàng (Store 1, 2, 3)
    try {
      const [s1, s2, s3] = await Promise.all([
        marketplaceService.getStoreVouchers(1),
        marketplaceService.getStoreVouchers(2),
        marketplaceService.getStoreVouchers(3)
      ]);
      const s1Tagged = s1.map((v) => ({ ...v, storeName: 'Apple Store Chính Hãng CTUT' }));
      const s2Tagged = s2.map((v) => ({ ...v, storeName: 'CTUT Gaming & Gear Hub' }));
      const s3Tagged = s3.map((v) => ({ ...v, storeName: 'ASUS ROG Official Store' }));
      setStoreVouchersList([...s1Tagged, ...s2Tagged, ...s3Tagged]);
    } catch (e) {
      console.warn(e);
    }

    // 3. Voucher người dùng đã lưu
    const saved = await marketplaceService.getUserSavedVouchers();
    setSavedVouchers(saved);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveVoucher = async (voucher) => {
    const saved = await marketplaceService.saveUserVoucher(voucher);
    const updated = await marketplaceService.getUserSavedVouchers();
    setSavedVouchers(updated);

    navigator.clipboard?.writeText(voucher.maVoucher);
    setCopiedCode(voucher.maVoucher);
    setToastMessage(`Đã lưu mã "${voucher.maVoucher}" vào ví ưu đãi của bạn!`);

    setTimeout(() => {
      setCopiedCode('');
      setToastMessage('');
    }, 2500);
  };

  const handleRemoveSavedVoucher = async (code) => {
    const updated = await marketplaceService.removeUserSavedVoucher(code);
    setSavedVouchers(updated);
    setToastMessage(`Đã bỏ lưu mã "${code}"`);
    setTimeout(() => setToastMessage(''), 2000);
  };

  const isSaved = (code) => {
    return savedVouchers.some((v) => v.maVoucher === code);
  };

  const getDisplayedVouchers = () => {
    if (activeTab === 'ALL') return globalVouchers;
    if (activeTab === 'STORES') return storeVouchersList;
    if (activeTab === 'SAVED') return savedVouchers;
    return globalVouchers;
  };

  const displayedList = getDisplayedVouchers();

  return (
    <div className="vouchers-page">
      {toastMessage && (
        <div className="voucher-toast-alert">
          <FiCheckCircle size={18} /> {toastMessage}
        </div>
      )}

      <div className="container">
        {/* Banner Header */}
        <div className="vouchers-header">
          <div className="vouchers-title-wrap">
            <FiGift className="header-icon" />
            <div>
              <h2>Kho Voucher Khuyến Mãi & Ưu Đãi CTUT GEAR</h2>
              <p>Thu thập mã giảm giá độc quyền từ Toàn Sàn và các Gian Hàng đối tác để áp dụng giảm tối đa khi thanh toán!</p>
            </div>
          </div>
          <Link to="/cart" className="btn-go-cart">
            <FiShoppingBag /> Xem Giỏ Hàng & Dùng Mã
          </Link>
        </div>

        {/* Tabs Điều Hướng */}
        <div className="voucher-tabs">
          <button 
            className={`v-tab-btn ${activeTab === 'ALL' ? 'active' : ''}`}
            onClick={() => setActiveTab('ALL')}
          >
            🌐 Mã Toàn Sàn ({globalVouchers.length})
          </button>
          <button 
            className={`v-tab-btn ${activeTab === 'STORES' ? 'active' : ''}`}
            onClick={() => setActiveTab('STORES')}
          >
            🏪 Mã Gian Hàng ({storeVouchersList.length})
          </button>
          <button 
            className={`v-tab-btn ${activeTab === 'SAVED' ? 'active' : ''}`}
            onClick={() => setActiveTab('SAVED')}
          >
            🏷️ Mã Của Tôi Đã Lưu ({savedVouchers.length})
          </button>
        </div>

        {/* Danh Sách Vouchers */}
        {displayedList.length === 0 ? (
          <div className="empty-vouchers-card">
            <p>
              {activeTab === 'SAVED'
                ? 'Bạn chưa lưu mã giảm giá nào vào ví. Hãy duyệt qua các tab bên trên để lưu mã ngay!'
                : 'Hiện chưa có mã giảm giá nào trong danh mục này.'}
            </p>
            <button className="btn-see-all-v" onClick={() => setActiveTab('ALL')}>
              Khám Phá Voucher Toàn Sàn
            </button>
          </div>
        ) : (
          <div className="vouchers-list-grid">
            {displayedList.map((v) => {
              const saved = isSaved(v.maVoucher);
              return (
                <div key={v.id || v.maVoucher} className="big-voucher-card">
                  <div className="b-voucher-left">
                    <span className="b-voucher-icon">🏷️</span>
                    <span className="b-percent">GIẢM {v.phanTramGiam}%</span>
                    <span className="b-max">Tối đa {Number(v.giamToiDa || 50000).toLocaleString('vi-VN')} đ</span>
                  </div>

                  <div className="b-voucher-right">
                    <div className="b-header-line">
                      <div className="b-code-badge">{v.maVoucher}</div>
                      {saved && activeTab === 'SAVED' && (
                        <button 
                          className="btn-remove-v" 
                          onClick={() => handleRemoveSavedVoucher(v.maVoucher)}
                          title="Bỏ lưu voucher này"
                        >
                          <FiTrash2 /> Bỏ lưu
                        </button>
                      )}
                    </div>

                    <p className="b-desc">{v.moTa || `Đơn hàng tối thiểu ${Number(v.donHangToiThieu || 150000).toLocaleString('vi-VN')} đ`}</p>

                    <div className="b-footer">
                      <span className="b-scope">
                        {v.cuaHangId ? (
                          <>🏪 {v.storeName || `Gian hàng #${v.cuaHangId}`}</>
                        ) : (
                          <>🌐 Áp dụng cho mọi Gian hàng</>
                        )}
                      </span>

                      <div className="voucher-actions-btn-group">
                        <button 
                          className={`btn-copy-code ${saved ? 'is-saved' : ''}`}
                          onClick={() => handleSaveVoucher(v)}
                        >
                          {copiedCode === v.maVoucher ? (
                            <><FiCheck /> Đã Lưu & Copy</>
                          ) : saved ? (
                            <><FiCheck /> Đã Lưu Vào Ví</>
                          ) : (
                            <><FiCopy /> Lưu Mã</>
                          )}
                        </button>

                        <Link 
                          to="/cart" 
                          state={{ autoApplyCode: v.maVoucher, targetShopId: v.cuaHangId }}
                          className="btn-use-now"
                        >
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
