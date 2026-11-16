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
  // KHỞI TẠO STATE TRỐNG HOÀN TOÀN
  const [globalVouchers, setGlobalVouchers] = useState([]);
  const [storeVouchersList, setStoreVouchersList] = useState([]);
  const [savedVouchers, setSavedVouchers] = useState([]);
  const [activeTab, setActiveTab] = useState('ALL'); // ALL, STORES, SAVED
  const [copiedCode, setCopiedCode] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  const loadData = async () => {
    try {
      // 1. Voucher Toàn Sàn (Lấy từ API)
      const gVouchers = await marketplaceService.getGlobalVouchers();
      // Đảm bảo là mảng, nếu lỗi thì đặt mảng rỗng để không bị lỗi giao diện
      setGlobalVouchers(Array.isArray(gVouchers) ? gVouchers : []);

      // 2. Voucher Tất Cả Các Gian Hàng (Lấy từ API)
      // Chú ý: Cần đảm bảo marketplaceService.getAllStoreVouchers() gọi API thật (vd: GET /vouchers/stores)
      const sVouchers = await marketplaceService.getAllStoreVouchers();
      setStoreVouchersList(Array.isArray(sVouchers) ? sVouchers : []);

      // 3. Voucher người dùng đã lưu (Lấy từ API)
      const saved = await marketplaceService.getUserSavedVouchers();
      setSavedVouchers(Array.isArray(saved) ? saved : []);

    } catch (error) {
      console.error("Lỗi khi tải dữ liệu Voucher:", error);
      // Nếu lỗi kết nối, đảm bảo dữ liệu là rỗng
      setGlobalVouchers([]);
      setStoreVouchersList([]);
      setSavedVouchers([]);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveVoucher = async (voucher) => {
    try {
      await marketplaceService.saveUserVoucher(voucher);
      const updated = await marketplaceService.getUserSavedVouchers();
      setSavedVouchers(Array.isArray(updated) ? updated : []);

      navigator.clipboard?.writeText(voucher.maVoucher);
      setCopiedCode(voucher.maVoucher);
      setToastMessage(`Đã lưu mã "${voucher.maVoucher}" vào ví ưu đãi của bạn!`);

      setTimeout(() => {
        setCopiedCode('');
        setToastMessage('');
      }, 2500);
    } catch (error) {
      console.error("Lỗi khi lưu voucher:", error);
      setToastMessage("Không thể lưu mã. Vui lòng thử lại sau.");
      setTimeout(() => setToastMessage(''), 2500);
    }
  };

  const handleRemoveSavedVoucher = async (code) => {
    try {
      const updated = await marketplaceService.removeUserSavedVoucher(code);
      setSavedVouchers(Array.isArray(updated) ? updated : []);
      setToastMessage(`Đã bỏ lưu mã "${code}"`);
      setTimeout(() => setToastMessage(''), 2000);
    } catch (error) {
      console.error("Lỗi khi bỏ lưu voucher:", error);
    }
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