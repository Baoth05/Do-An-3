// src/pages/Seller/SellerProducts.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { marketplaceService } from '../../services/marketplaceService';
import { 
  FiBox, FiCheckCircle, FiEyeOff, FiEdit2, FiSearch, FiImage 
} from 'react-icons/fi';
import './SellerProducts.css';

const SellerProducts = () => {
  const navigate = useNavigate();
  const { storeId } = useOutletContext();
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('ALL'); // ALL, PUBLISHED, UNPUBLISHED
  const [searchKey, setSearchKey] = useState('');
  const [alertNotice, setAlertNotice] = useState('');

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
    const handleUpdate = () => {
      fetchInventory();
    };
    window.addEventListener('seller-inventory-updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('seller-inventory-updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [storeId]);

  // Mở trang chỉnh sửa chi tiết sản phẩm, nhiều hình ảnh và giá bán
  const handleOpenEditPage = (item) => {
    navigate(`/seller/products/${item.id}/edit`);
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
                        <small className="prod-cat">
                          {item.danhMuc || 'Thiết bị'}
                          {Array.isArray(item.danhSachHinhAnh) && item.danhSachHinhAnh.length > 1 && (
                            <> • <FiImage size={11} style={{ verticalAlign: 'middle' }} /> {item.danhSachHinhAnh.length} ảnh</>
                          )}
                        </small>
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
                          onClick={() => handleOpenEditPage(item)}
                          title="Mở trang chỉnh sửa chi tiết giá bán, nhiều hình ảnh và mô tả"
                        >
                          <FiEdit2 size={14} /> Chỉnh Sửa & Ảnh
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
    </div>
  );
};

export default SellerProducts;

