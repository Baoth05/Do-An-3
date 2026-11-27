// src/pages/Seller/SellerShopSettings.jsx
import { useState, useEffect } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { marketplaceService } from '../../services/marketplaceService';
import { parseImageGallery, readImageFilesAsDataUrls } from '../../utils/imageHelpers';
import {
  FiBox,
  FiCheckCircle,
  FiClock,
  FiExternalLink,
  FiGlobe,
  FiImage,
  FiMail,
  FiMapPin,
  FiPackage,
  FiPhone,
  FiPlus,
  FiSave,
  FiShield,
  FiShoppingBag,
  FiTag,
  FiTrash2,
  FiTruck,
  FiUpload,
} from 'react-icons/fi';
import './SellerShopSettings.css';

const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=240';
const DEFAULT_BANNER = 'https://images.unsplash.com/photo-1593640408182-31c70c8268f5?w=1200';

const SellerShopSettings = () => {
  const { storeId, currentStore } = useOutletContext();
  const [formData, setFormData] = useState({
    tenKho: '',
    diaChi: '',
    soDienThoai: '',
    email: '',
    gioMoCua: '',
    websiteHoacMangXaHoi: '',
    sucChuaToiDa: 1000,
    moTaGianHang: '',
    anhDaiDienShop: '',
    anhBiaShop: '',
    chinhSachBaoHanh: '',
    chinhSachGiaoHang: '',
  });
  const [gallery, setGallery] = useState([]);
  const [newPhotoUrls, setNewPhotoUrls] = useState('');
  const [stats, setStats] = useState({
    totalProducts: 0,
    publishedProducts: 0,
    totalOrders: 0,
    activeVouchers: 0,
  });
  const [loading, setLoading] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [alertNotice, setAlertNotice] = useState('');

  useEffect(() => {
    if (currentStore) {
      setFormData({
        tenKho: currentStore.tenKho || '',
        diaChi: currentStore.diaChi || '',
        soDienThoai: currentStore.soDienThoai || '',
        email: currentStore.email || '',
        gioMoCua: currentStore.gioMoCua || '',
        websiteHoacMangXaHoi: currentStore.websiteHoacMangXaHoi || '',
        sucChuaToiDa: currentStore.sucChuaToiDa ?? 1000,
        moTaGianHang: currentStore.moTaGianHang || '',
        anhDaiDienShop: currentStore.anhDaiDienShop || '',
        anhBiaShop: currentStore.anhBiaShop || '',
        chinhSachBaoHanh: currentStore.chinhSachBaoHanh || '',
        chinhSachGiaoHang: currentStore.chinhSachGiaoHang || '',
      });
      setGallery(parseImageGallery(currentStore.hinhAnhCuaHang));
    }
  }, [currentStore]);

  useEffect(() => {
    if (!storeId) return;
    const loadStats = async () => {
      try {
        const [inv, orders, vouchers] = await Promise.all([
          marketplaceService.getSellerInventory(storeId),
          marketplaceService.getStoreOrders(storeId),
          marketplaceService.getStoreVouchers(storeId),
        ]);
        const listInv = Array.isArray(inv) ? inv : [];
        const listOrders = Array.isArray(orders) ? orders : [];
        const listVouchers = Array.isArray(vouchers) ? vouchers : [];
        setStats({
          totalProducts: listInv.length,
          publishedProducts: listInv.filter((i) => i.dangBan === true).length,
          totalOrders: listOrders.length,
          activeVouchers: listVouchers.filter((v) => v.trangThai !== false).length,
        });
      } catch (err) {
        console.warn('Không tải được thống kê gian hàng:', err?.message);
      }
    };
    loadStats();
  }, [storeId]);

  const handleSingleImageUpload = async (field, e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploadingMedia(true);
    try {
      const [encoded] = await readImageFilesAsDataUrls([files[0]], field === 'anhBiaShop' ? 1400 : 800, 0.85);
      if (encoded) {
        setFormData((prev) => ({ ...prev, [field]: encoded }));
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setUploadingMedia(false);
      e.target.value = '';
    }
  };

  const handleGalleryUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploadingMedia(true);
    try {
      const encoded = await readImageFilesAsDataUrls(files);
      setGallery((prev) => [...new Set([...prev, ...encoded])]);
    } catch (err) {
      alert(err.message);
    } finally {
      setUploadingMedia(false);
      e.target.value = '';
    }
  };

  const handleAddGalleryUrls = () => {
    const urls = newPhotoUrls
      .split(/\r?\n/)
      .map((u) => u.trim())
      .filter(Boolean);
    if (urls.length === 0) return;
    setGallery((prev) => [...new Set([...prev, ...urls])]);
    setNewPhotoUrls('');
  };

  const handleRemoveGalleryPhoto = (url) => {
    setGallery((prev) => prev.filter((item) => item !== url));
  };

  const handleFillPolicyTemplate = (field) => {
    if (field === 'chinhSachBaoHanh') {
      setFormData((prev) => ({
        ...prev,
        chinhSachBaoHanh:
          '• Bảo hành chính hãng 12–24 tháng theo tem serial nhà sản xuất.\n• Hỗ trợ 1 đổi 1 trong 7 ngày đầu nếu lỗi phần cứng do nhà sản xuất.\n• Có phiếu xuất kho và hóa đơn đối soát minh bạch kèm theo mỗi đơn.',
      }));
    } else if (field === 'chinhSachGiaoHang') {
      setFormData((prev) => ({
        ...prev,
        chinhSachGiaoHang:
          '• Đóng gói chống sốc 3 lớp, quay video kiểm tra trước khi bàn giao đơn vị vận chuyển.\n• Hỗ trợ giao nhanh GHTK / GHN / Viettel Post trên toàn quốc (24–72h).\n• Kiểm tra ngoại quan hộp trước khi ký nhận.',
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...formData,
        sucChuaToiDa: Number(formData.sucChuaToiDa) || 1000,
        hinhAnhCuaHang: JSON.stringify(gallery),
      };
      await marketplaceService.updateStoreProfile(storeId, payload);
      setAlertNotice('Đã cập nhật toàn bộ hồ sơ & bộ nhận diện gian hàng thành công!');
      setTimeout(() => setAlertNotice(''), 3500);
    } catch (err) {
      alert('Lỗi cập nhật: ' + (err.response?.data || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="seller-settings-page">
      {alertNotice && (
        <div className="seller-toast-alert">
          <FiCheckCircle size={18} /> {alertNotice}
        </div>
      )}

      {/* Header + Nút xem trang shop */}
      <div className="seller-page-header settings-top-header">
        <div>
          <h2>Hồ Sơ, Thương Hiệu & Chính Sách Gian Hàng</h2>
          <p>
            Quản lý toàn diện thông tin hiển thị công khai trên Sàn TMĐT: ảnh bìa, logo, album không gian shop, liên hệ & chính sách hậu mãi.
          </p>
        </div>

        <div className="settings-header-actions">
          {storeId && (
            <Link to={`/stores/${storeId}`} target="_blank" className="btn-view-public-shop">
              <FiExternalLink /> Xem Trang Shop Công Khai
            </Link>
          )}
          <button type="submit" form="shop-settings-form" className="btn-save-settings" disabled={loading}>
            <FiSave /> {loading ? 'Đang Lưu...' : 'Lưu Hồ Sơ'}
          </button>
        </div>
      </div>

      {/* Thống kê trực tiếp + Thông số định danh kho shop */}
      <div className="shop-overview-strip">
        <div className="shop-kpi-card">
          <span className="kpi-icon blue"><FiBox /></span>
          <div>
            <strong>{stats.publishedProducts} / {stats.totalProducts}</strong>
            <small>Sản phẩm Đang Mở Bán / Tổng Kho</small>
          </div>
        </div>
        <div className="shop-kpi-card">
          <span className="kpi-icon green"><FiPackage /></span>
          <div>
            <strong>{stats.totalOrders}</strong>
            <small>Tổng Đơn Hàng Gian Hàng</small>
          </div>
        </div>
        <div className="shop-kpi-card">
          <span className="kpi-icon amber"><FiTag /></span>
          <div>
            <strong>{stats.activeVouchers}</strong>
            <small>Voucher Riêng Đang Hoạt Động</small>
          </div>
        </div>
        <div className="shop-kpi-card">
          <span className="kpi-icon slate"><FiShoppingBag /></span>
          <div>
            <strong>{currentStore?.maKho || `STORE-${storeId}`}</strong>
            <small>ID #{storeId} • {currentStore?.trangThai || 'HOAT_DONG'}</small>
          </div>
        </div>
      </div>

      <form id="shop-settings-form" onSubmit={handleSubmit} className="settings-sections-stack">
        {/* Khối 1: Xem Trước Banner + Logo + Upload */}
        <section className="settings-card">
          <div className="section-heading">
            <h3><FiImage /> Bộ Nhận Diện Thương Hiệu & Ảnh Bìa Gian Hàng</h3>
            <p>Khách hàng nhìn thấy phần này ngay đầu trang Gian Hàng của bạn.</p>
          </div>

          <div
            className="shop-live-banner-preview"
            style={{
              backgroundImage: `linear-gradient(120deg, rgba(15,23,42,0.82), rgba(30,41,59,0.72)), url("${formData.anhBiaShop || DEFAULT_BANNER}")`,
            }}
          >
            <img
              src={formData.anhDaiDienShop || DEFAULT_AVATAR}
              alt="Logo Shop"
              className="preview-logo-img"
            />
            <div className="preview-banner-text">
              <div className="preview-badges">
                <span className="preview-badge-verified">✓ GIAN HÀNG CHÍNH HÃNG</span>
                <span className="preview-badge-code">{currentStore?.maKho || `STORE-${storeId}`}</span>
              </div>
              <h4>{formData.tenKho || 'Tên Gian Hàng Của Bạn'}</h4>
              <p>{formData.moTaGianHang || 'Giới thiệu ngắn gọn về sản phẩm & uy tín của gian hàng...'}</p>
              <div className="preview-meta-row">
                {formData.diaChi && <span><FiMapPin size={12} /> {formData.diaChi}</span>}
                {formData.soDienThoai && <span><FiPhone size={12} /> {formData.soDienThoai}</span>}
                {formData.gioMoCua && <span><FiClock size={12} /> {formData.gioMoCua}</span>}
              </div>
            </div>
          </div>

          <div className="form-grid-2 media-inputs-grid">
            <div className="form-group-seller">
              <div className="label-with-action">
                <label>Ảnh Đại Diện / Logo Shop</label>
                <label className="btn-upload-chip">
                  <FiUpload size={12} /> {uploadingMedia ? 'Đang xử lý...' : 'Tải ảnh từ máy'}
                  <input type="file" accept="image/*" onChange={(e) => handleSingleImageUpload('anhDaiDienShop', e)} />
                </label>
              </div>
              <input
                type="text"
                placeholder="Dán link ảnh logo hoặc tải file từ máy..."
                value={formData.anhDaiDienShop}
                onChange={(e) => setFormData({ ...formData, anhDaiDienShop: e.target.value })}
              />
            </div>

            <div className="form-group-seller">
              <div className="label-with-action">
                <label>Ảnh Bìa / Banner Trang Gian Hàng</label>
                <label className="btn-upload-chip">
                  <FiUpload size={12} /> {uploadingMedia ? 'Đang xử lý...' : 'Tải banner từ máy'}
                  <input type="file" accept="image/*" onChange={(e) => handleSingleImageUpload('anhBiaShop', e)} />
                </label>
              </div>
              <input
                type="text"
                placeholder="Dán link ảnh banner (tỷ lệ ngang) hoặc tải file từ máy..."
                value={formData.anhBiaShop}
                onChange={(e) => setFormData({ ...formData, anhBiaShop: e.target.value })}
              />
            </div>
          </div>
        </section>

        {/* Khối 2: Album Ảnh Không Gian Cửa Hàng / Kho Đóng Gói */}
        <section className="settings-card">
          <div className="section-heading">
            <h3><FiImage /> Album Hình Ảnh Cửa Hàng & Kho Đóng Gói ({gallery.length})</h3>
            <p>Thêm nhiều hình ảnh thực tế về showroom, quầy kỹ thuật hoặc quy trình đóng gói để tạo niềm tin cho người mua.</p>
          </div>

          <div className="store-album-toolbar">
            <label className="btn-upload-album">
              <FiUpload /> Chọn Nhiều Ảnh Từ Máy
              <input type="file" multiple accept="image/*" onChange={handleGalleryUpload} disabled={uploadingMedia} />
            </label>
            <div className="album-url-adder">
              <input
                type="text"
                placeholder="Hoặc dán URL hình ảnh không gian cửa hàng..."
                value={newPhotoUrls}
                onChange={(e) => setNewPhotoUrls(e.target.value)}
              />
              <button type="button" className="btn-add-album-url" onClick={handleAddGalleryUrls}>
                <FiPlus /> Thêm Ảnh
              </button>
            </div>
          </div>

          {gallery.length === 0 ? (
            <div className="album-empty-state">
              Chưa có hình ảnh bổ sung nào cho không gian cửa hàng.
            </div>
          ) : (
            <div className="store-album-grid">
              {gallery.map((photo, idx) => (
                <div key={`${idx}-${photo.slice(0, 28)}`} className="album-photo-card">
                  <img src={photo} alt={`Ảnh cửa hàng ${idx + 1}`} />
                  <button
                    type="button"
                    className="btn-del-album-photo"
                    title="Xóa ảnh này"
                    onClick={() => handleRemoveGalleryPhoto(photo)}
                  >
                    <FiTrash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Khối 3: Thông Tin Cơ Bản, Liên Hệ & Vận Hành */}
        <section className="settings-card">
          <div className="section-heading">
            <h3><FiShoppingBag /> Thông Tin Gian Hàng & Liên Hệ Khách Hàng</h3>
            <p>Hiển thị trên hồ sơ gian hàng công khai và hỗ trợ đối tác / khách hàng liên hệ nhanh.</p>
          </div>

          <div className="form-grid-2">
            <div className="form-group-seller">
              <label>Tên Gian Hàng Hiển Thị *</label>
              <input
                type="text"
                required
                value={formData.tenKho}
                onChange={(e) => setFormData({ ...formData, tenKho: e.target.value })}
              />
            </div>

            <div className="form-group-seller">
              <label><FiPhone size={13} /> Số Điện Thoại Hotline / Zalo</label>
              <input
                type="tel"
                placeholder="VD: 0901 234 567"
                value={formData.soDienThoai}
                onChange={(e) => setFormData({ ...formData, soDienThoai: e.target.value })}
              />
            </div>

            <div className="form-group-seller">
              <label><FiMail size={13} /> Email Chăm Sóc Khách Hàng</label>
              <input
                type="email"
                placeholder="cskh@ten-gian-hang.vn"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div className="form-group-seller">
              <label><FiClock size={13} /> Giờ Mở Cửa & Hỗ Trợ Tư Vấn</label>
              <input
                type="text"
                placeholder="VD: 08:00 - 21:30 (Thứ 2 - Chủ Nhật)"
                value={formData.gioMoCua}
                onChange={(e) => setFormData({ ...formData, gioMoCua: e.target.value })}
              />
            </div>

            <div className="form-group-seller">
              <label><FiMapPin size={13} /> Địa Chỉ Kho / Cửa Hàng *</label>
              <input
                type="text"
                required
                value={formData.diaChi}
                onChange={(e) => setFormData({ ...formData, diaChi: e.target.value })}
              />
            </div>

            <div className="form-group-seller">
              <label><FiGlobe size={13} /> Website / Fanpage / Zalo OA</label>
              <input
                type="text"
                placeholder="https://fb.com/yourshop hoặc zalo.me/..."
                value={formData.websiteHoacMangXaHoi}
                onChange={(e) => setFormData({ ...formData, websiteHoacMangXaHoi: e.target.value })}
              />
            </div>
          </div>

          <div className="form-grid-2" style={{ marginTop: 14 }}>
            <div className="form-group-seller">
              <label>Sức Chứa Tối Đa Kho Cửa Hàng (Sản Phẩm)</label>
              <input
                type="number"
                min="1"
                value={formData.sucChuaToiDa}
                onChange={(e) => setFormData({ ...formData, sucChuaToiDa: e.target.value })}
              />
            </div>
            <div className="form-group-seller">
              <label>Mã Kho & Trạng Thái Vận Hành</label>
              <input
                type="text"
                disabled
                value={`${currentStore?.maKho || `STORE-${storeId}`} • ${currentStore?.trangThai || 'HOAT_DONG'}`}
              />
            </div>
          </div>
        </section>

        {/* Khối 4: Giới Thiệu & Chính Sách Bán Hàng */}
        <section className="settings-card">
          <div className="section-heading">
            <h3><FiShield /> Giới Thiệu Shop & Chính Sách Hậu Mãi</h3>
            <p>Cung cấp cam kết rõ ràng giúp tăng độ tin cậy khi khách hàng xem trang Shop.</p>
          </div>

          <div className="form-group-seller">
            <label>Mô Tả & Giới Thiệu Chung Về Gian Hàng</label>
            <textarea
              rows="4"
              value={formData.moTaGianHang}
              onChange={(e) => setFormData({ ...formData, moTaGianHang: e.target.value })}
              placeholder="Giới thiệu chuyên môn, mặt hàng chủ lực, kinh nghiệm vận hành của shop..."
            />
          </div>

          <div className="form-grid-2">
            <div className="form-group-seller">
              <div className="label-with-action">
                <label><FiShield size={13} /> Chính Sách Bảo Hành & Đổi Trả</label>
                <button
                  type="button"
                  className="btn-template-fill"
                  onClick={() => handleFillPolicyTemplate('chinhSachBaoHanh')}
                >
                  Điền mẫu nhanh
                </button>
              </div>
              <textarea
                rows="4"
                value={formData.chinhSachBaoHanh}
                onChange={(e) => setFormData({ ...formData, chinhSachBaoHanh: e.target.value })}
                placeholder="Quy định thời hạn bảo hành, điều kiện 1 đổi 1..."
              />
            </div>

            <div className="form-group-seller">
              <div className="label-with-action">
                <label><FiTruck size={13} /> Chính Sách Giao Hàng & Đóng Gói</label>
                <button
                  type="button"
                  className="btn-template-fill"
                  onClick={() => handleFillPolicyTemplate('chinhSachGiaoHang')}
                >
                  Điền mẫu nhanh
                </button>
              </div>
              <textarea
                rows="4"
                value={formData.chinhSachGiaoHang}
                onChange={(e) => setFormData({ ...formData, chinhSachGiaoHang: e.target.value })}
                placeholder="Thời gian giao hàng, quy cách chống sốc, đối tác GHTK/GHN..."
              />
            </div>
          </div>

          <div className="form-actions-bar">
            <button type="submit" className="btn-save-settings" disabled={loading}>
              <FiSave /> {loading ? 'Đang Lưu Hồ Sơ...' : 'Lưu Tất Cả Thay Đổi'}
            </button>
          </div>
        </section>
      </form>
    </div>
  );
};

export default SellerShopSettings;
