// src/pages/Seller/SellerProducts.jsx
import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { marketplaceService } from '../../services/marketplaceService';
import { 
  FiBox, FiCheckCircle, FiEyeOff, FiEdit2, FiSearch, 
  FiFilter, FiAlertTriangle, FiDollarSign, FiPlusCircle, FiX 
} from 'react-icons/fi';
import './SellerProducts.css';

const SellerProducts = () => {
  const { storeId, currentStore } = useOutletContext();
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('ALL'); // ALL, PUBLISHED, UNPUBLISHED
  const [searchKey, setSearchKey] = useState('');
  const [alertNotice, setAlertNotice] = useState('');

  // Modal Đăng bán / Cập nhật giá bán
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [publishForm, setPublishForm] = useState({
    dangBan: true,
    giaBanHienTai: '',
    soLuongCanhBao: 5,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const data = await marketplaceService.getSellerInventory(storeId);
      setInventory(data);
    } catch (err) {
      console.error('Lỗi tải tồn kho shop:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (storeId) {
      fetchInventory();
    }
  }, [storeId]);

  // Mở modal đăng bán / sửa thông tin bán
  const handleOpenPublishModal = (item) => {
    setSelectedItem(item);
    setPublishForm({
      dangBan: item.dangBan !== undefined ? item.dangBan : true,
      giaBanHienTai: item.giaBanHienTai || item.giaBan || 0,
      soLuongCanhBao: item.soLuongToiThieu || 5,
    });
    setModalOpen(true);
  };

  // Nhanh: Bật/Tắt đăng bán ngay trên dòng
  const handleTogglePublishQuick = async (item) => {
    try {
      const newStatus = !item.dangBan;
      await marketplaceService.publishProductToMarketplace(item.id, {
        dangBan: newStatus,
        giaBanHienTai: item.giaBanHienTai || item.giaBan || 0,
        soLuongCanhBao: item.soLuongToiThieu || 5,
      });

      setAlertNotice(
        newStatus 
          ? `Đã đăng bán "${item.tenSanPham}" lên Sàn TMĐT thành công!`
          : `Đã gỡ sản phẩm "${item.tenSanPham}" khỏi Sàn TMĐT!`
      );
      setTimeout(() => setAlertNotice(''), 3000);
      await fetchInventory();
    } catch (err) {
      alert('Lỗi cập nhật trạng thái bán: ' + (err.response?.data || err.message));
    }
  };

  // Lưu cấu hình đăng bán từ Modal
  const handleSavePublish = async (e) => {
    e.preventDefault();
    if (!selectedItem) return;

    setIsSubmitting(true);
    try {
      await marketplaceService.publishProductToMarketplace(selectedItem.id, {
        dangBan: publishForm.dangBan,
        giaBanHienTai: Number(publishForm.giaBanHienTai),
        soLuongCanhBao: Number(publishForm.soLuongCanhBao),
      });

      setAlertNotice(`Cập nhật đăng bán sản phẩm "${selectedItem.tenSanPham}" thành công!`);
      setModalOpen(false);
      setSelectedItem(null);
      await fetchInventory();
    } catch (err) {
      alert('Lỗi lưu đăng bán: ' + (err.response?.data || err.message));
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setAlertNotice(''), 3000);
    }
  };

  const filteredItems = inventory.filter((item) => {
    const matchStatus = 
      filterStatus === 'ALL' || 
      (filterStatus === 'PUBLISHED' && item.dangBan === true) ||
      (filterStatus === 'UNPUBLISHED' && !item.dangBan);

    const q = searchKey.toLowerCase().trim();
    const matchSearch = 
      !q || 
      (item.tenSanPham || '').toLowerCase().includes(q) ||
      (item.sku || '').toLowerCase().includes(q) ||
      (item.danhMuc || '').toLowerCase().includes(q);

    return matchStatus && matchSearch;
  });

  const totalInWarehouse = inventory.length;
  const totalPublished = inventory.filter((i) => i.dangBan === true).length;
  const totalUnpublished = totalInWarehouse - totalPublished;

  return (
    <div className="seller-products-page">
      {/* Toast thông báo */}
      {alertNotice && (
        <div className="seller-toast-alert">
          <FiCheckCircle size={18} /> {alertNotice}
        </div>
      )}

      {/* Header và Thống kê nhanh */}
      <div className="seller-page-header">
        <div>
          <h2>Quản Lý Hàng Hóa & Đăng Bán Lên Sàn</h2>
          <p>
            Chủ động chọn lọc sản phẩm trong kho của bạn để đưa lên Sàn TMĐT. Chỉ những sản phẩm được 
            bật <strong>"Đang Mở Bán"</strong> mới hiển thị cho người mua sắm.
          </p>
        </div>
      </div>

      {/* Thẻ Thống Kê Nhanh */}
      <div className="stock-stats-grid">
        <div className="stat-card" onClick={() => setFilterStatus('ALL')}>
          <div className="stat-icon-wrap icon-blue"><FiBox /></div>
          <div>
            <span className="stat-num">{totalInWarehouse}</span>
            <span className="stat-desc">Tổng Sản Phẩm Trong Kho Shop</span>
          </div>
        </div>

        <div className="stat-card" onClick={() => setFilterStatus('PUBLISHED')}>
          <div className="stat-icon-wrap icon-green"><FiCheckCircle /></div>
          <div>
            <span className="stat-num">{totalPublished}</span>
            <span className="stat-desc">Đang Mở Bán Trên Sàn (Khách Thấy)</span>
          </div>
        </div>

        <div className="stat-card" onClick={() => setFilterStatus('UNPUBLISHED')}>
          <div className="stat-icon-wrap icon-gray"><FiEyeOff /></div>
          <div>
            <span className="stat-num">{totalUnpublished}</span>
            <span className="stat-desc">Đang Lưu Kho (Chưa Đăng Bán)</span>
          </div>
        </div>
      </div>

      {/* Thanh Công Cụ & Bộ Lọc */}
      <div className="seller-toolbar-card">
        <div className="search-filter-box">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Tìm theo tên sản phẩm, mã SKU trong kho..."
            value={searchKey}
            onChange={(e) => setSearchKey(e.target.value)}
          />
        </div>

        <div className="status-filter-pills">
          <button 
            className={`pill-btn ${filterStatus === 'ALL' ? 'active' : ''}`}
            onClick={() => setFilterStatus('ALL')}
          >
            Tất Cả ({totalInWarehouse})
          </button>
          <button 
            className={`pill-btn ${filterStatus === 'PUBLISHED' ? 'active' : ''}`}
            onClick={() => setFilterStatus('PUBLISHED')}
          >
            Đang Bán ({totalPublished})
          </button>
          <button 
            className={`pill-btn ${filterStatus === 'UNPUBLISHED' ? 'active' : ''}`}
            onClick={() => setFilterStatus('UNPUBLISHED')}
          >
            Chưa Đăng Bán ({totalUnpublished})
          </button>
        </div>
      </div>

      {/* Bảng Danh Sách Hàng Tồn Kho */}
      <div className="seller-table-card">
        {loading ? (
          <div className="seller-loading-state">
            <div className="spinner"></div>
            <p>Đang tải dữ liệu kho hàng của Gian hàng...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="seller-empty-state">
            <FiBox size={48} className="empty-icon" />
            <h3>Không có sản phẩm nào phù hợp</h3>
            <p>Kho hàng của shop chưa có sản phẩm theo bộ lọc này.</p>
          </div>
        ) : (
          <table className="seller-data-table">
            <thead>
              <tr>
                <th>Sản Phẩm Trong Kho</th>
                <th>Mã SKU</th>
                <th>Số Lượng Tồn Kho</th>
                <th>Giá Bán Sàn</th>
                <th>Trạng Thái Trên Sàn</th>
                <th>Thao Tác Đăng Bán</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => {
                const isPublished = item.dangBan === true;
                const price = item.giaBanHienTai || item.giaBan || 0;

                return (
                  <tr key={item.id} className={isPublished ? 'row-published' : 'row-unpublished'}>
                    <td className="product-info-cell">
                      <img 
                        src={item.hinhAnh || 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=100'} 
                        alt={item.tenSanPham} 
                        className="prod-img-small"
                      />
                      <div>
                        <strong>{item.tenSanPham}</strong>
                        <small className="prod-cat">{item.danhMuc || 'Thiết bị'}</small>
                      </div>
                    </td>

                    <td className="sku-cell">
                      <code>{item.sku}</code>
                    </td>

                    <td>
                      <span className={`stock-pill ${item.soLuongThucTe <= (item.soLuongToiThieu || 5) ? 'low-stock' : ''}`}>
                        {item.soLuongThucTe || 0} {item.donViTinh || 'Cái'}
                      </span>
                    </td>

                    <td className="price-cell">
                      <strong>{Number(price).toLocaleString('vi-VN')} đ</strong>
                    </td>

                    <td>
                      {isPublished ? (
                        <span className="badge-status-published">
                          <FiCheckCircle /> ĐANG MỞ BÁN
                        </span>
                      ) : (
                        <span className="badge-status-hidden">
                          <FiEyeOff /> LƯU KHO (ẨN)
                        </span>
                      )}
                    </td>

                    <td className="action-cell">
                      <div className="table-actions-group">
                        {isPublished ? (
                          <button 
                            className="btn-unpublish-quick" 
                            onClick={() => handleTogglePublishQuick(item)}
                            title="Gỡ sản phẩm khỏi sàn (khách sẽ không thấy)"
                          >
                            Gỡ Khỏi Sàn
                          </button>
                        ) : (
                          <button 
                            className="btn-publish-quick" 
                            onClick={() => handleTogglePublishQuick(item)}
                            title="Đăng bán ngay lên sàn với giá mặc định"
                          >
                            Đăng Bán Sàn
                          </button>
                        )}

                        <button 
                          className="btn-edit-pricing"
                          onClick={() => handleOpenPublishModal(item)}
                          title="Chỉnh sửa giá bán lẻ và thông số bán"
                        >
                          <FiEdit2 size={14} /> Chỉnh Giá
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal Chỉnh Sửa Thông Tin Đăng Bán Lên Sàn */}
      {modalOpen && selectedItem && (
        <div className="modal-backdrop-overlay" onClick={() => setModalOpen(false)}>
          <div className="publish-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>⚙️ Thiết Lập Đăng Bán Lên Sàn TMĐT</h3>
              <FiX className="btn-close-modal" onClick={() => setModalOpen(false)} />
            </div>

            <form onSubmit={handleSavePublish}>
              <div className="modal-prod-summary">
                <img 
                  src={selectedItem.hinhAnh || 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=100'} 
                  alt={selectedItem.tenSanPham} 
                />
                <div>
                  <h4>{selectedItem.tenSanPham}</h4>
                  <p>Mã SKU: <strong>{selectedItem.sku}</strong> • Tồn kho: <strong>{selectedItem.soLuongThucTe} {selectedItem.donViTinh || 'Cái'}</strong></p>
                </div>
              </div>

              <div className="form-group-seller">
                <label>Trạng Thái Mở Bán Khách Hàng:</label>
                <div className="radio-options-group">
                  <label className={`radio-card ${publishForm.dangBan ? 'active' : ''}`}>
                    <input
                      type="radio"
                      name="dangBan"
                      checked={publishForm.dangBan === true}
                      onChange={() => setPublishForm({ ...publishForm, dangBan: true })}
                    />
                    <div>
                      <strong>Đang Mở Bán Công Khai</strong>
                      <small>Sản phẩm xuất hiện trên trang chủ sàn & trang gian hàng</small>
                    </div>
                  </label>

                  <label className={`radio-card ${!publishForm.dangBan ? 'active' : ''}`}>
                    <input
                      type="radio"
                      name="dangBan"
                      checked={publishForm.dangBan === false}
                      onChange={() => setPublishForm({ ...publishForm, dangBan: false })}
                    />
                    <div>
                      <strong>Tạm Ẩn / Giữ Trong Kho</strong>
                      <small>Khách hàng trên sàn sẽ không tìm thấy sản phẩm này</small>
                    </div>
                  </label>
                </div>
              </div>

              <div className="form-group-seller">
                <label>Giá Bán Lẻ Trên Sàn (VNĐ) *</label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  required
                  value={publishForm.giaBanHienTai}
                  onChange={(e) => setPublishForm({ ...publishForm, giaBanHienTai: e.target.value })}
                />
              </div>

              <div className="form-group-seller">
                <label>Ngưỡng Cảnh Báo Tồn Kho Thấp (Cái)</label>
                <input
                  type="number"
                  min="1"
                  value={publishForm.soLuongCanhBao}
                  onChange={(e) => setPublishForm({ ...publishForm, soLuongCanhBao: e.target.value })}
                />
                <small className="help-text">Hệ thống sẽ cảnh báo khi số lượng hàng trong kho chạm ngưỡng này.</small>
              </div>

              <div className="modal-actions-footer">
                <button 
                  type="button" 
                  className="btn-cancel" 
                  onClick={() => setModalOpen(false)}
                >
                  Hủy Bỏ
                </button>
                <button 
                  type="submit" 
                  className="btn-save-publish"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Đang Lưu...' : 'Lưu Thay Đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerProducts;

