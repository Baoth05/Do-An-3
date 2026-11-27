// src/pages/Seller/SellerProductEdit.jsx
import { useState, useEffect } from 'react';
import { Link, useNavigate, useOutletContext, useParams } from 'react-router-dom';
import { marketplaceService } from '../../services/marketplaceService';
import { readImageFilesAsDataUrls } from '../../utils/imageHelpers';
import {
  FiArrowLeft,
  FiArrowRight,
  FiCheckCircle,
  FiEye,
  FiEyeOff,
  FiExternalLink,
  FiImage,
  FiPlus,
  FiRotateCcw,
  FiSave,
  FiStar,
  FiTrash2,
  FiUpload,
} from 'react-icons/fi';
import './SellerProductEdit.css';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600';

const SellerProductEdit = () => {
  const { inventoryId } = useParams();
  const navigate = useNavigate();
  const { storeId } = useOutletContext();

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [alertNotice, setAlertNotice] = useState('');

  const [dangBan, setDangBan] = useState(true);
  const [giaBanHienTai, setGiaBanHienTai] = useState('');
  const [soLuongCanhBao, setSoLuongCanhBao] = useState(5);
  const [images, setImages] = useState([]);
  const [coverImage, setCoverImage] = useState('');
  const [newImageUrls, setNewImageUrls] = useState('');
  const [moTaSanPham, setMoTaSanPham] = useState('');
  const [thongSoKyThuat, setThongSoKyThuat] = useState('');
  const [uploadingImages, setUploadingImages] = useState(false);

  useEffect(() => {
    const loadProduct = async () => {
      setLoading(true);
      setErrorMsg('');
      try {
        let data = null;
        try {
          data = await marketplaceService.getSellerInventoryItem(inventoryId);
        } catch {
          if (storeId) {
            const list = await marketplaceService.getSellerInventory(storeId);
            data = list.find((entry) => String(entry.id) === String(inventoryId)) || null;
          }
        }
        if (!data) {
          setErrorMsg('Không tìm thấy sản phẩm trong kho của gian hàng.');
          return;
        }
        setItem(data);
        setDangBan(data.dangBan !== undefined ? Boolean(data.dangBan) : true);
        setGiaBanHienTai(data.giaBanHienTai ?? data.giaBan ?? '');
        setSoLuongCanhBao(data.soLuongToiThieu ?? 5);

        const gallery = Array.isArray(data.danhSachHinhAnh) && data.danhSachHinhAnh.length > 0
          ? [...new Set(data.danhSachHinhAnh.filter(Boolean))]
          : (data.hinhAnh ? [data.hinhAnh] : []);
        setImages(gallery);
        setCoverImage(data.hinhAnhRieng || gallery[0] || data.hinhAnh || '');
        setMoTaSanPham(data.moTaSanPham ?? data.moTa ?? '');
        setThongSoKyThuat(data.thongSoKyThuat ?? '');
      } catch (err) {
        setErrorMsg(err?.response?.data || err?.message || 'Lỗi tải thông tin sản phẩm');
      } finally {
        setLoading(false);
      }
    };
    loadProduct();
  }, [inventoryId, storeId]);

  const handleFileUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploadingImages(true);
    try {
      const encoded = await readImageFilesAsDataUrls(files);
      setImages((prev) => {
        const merged = [...new Set([...prev, ...encoded])];
        if (!coverImage && merged.length > 0) setCoverImage(merged[0]);
        return merged;
      });
    } catch (err) {
      alert(err.message);
    } finally {
      setUploadingImages(false);
      e.target.value = '';
    }
  };

  const handleAddImageUrls = () => {
    const candidates = newImageUrls
      .split(/\r?\n/)
      .map((u) => u.trim())
      .filter(Boolean);
    if (candidates.length === 0) return;
    setImages((prev) => {
      const merged = [...new Set([...prev, ...candidates])];
      if (!coverImage && merged.length > 0) setCoverImage(merged[0]);
      return merged;
    });
    setNewImageUrls('');
  };

  const handleSetCover = (url) => {
    setCoverImage(url);
    setImages((prev) => [url, ...prev.filter((u) => u !== url)]);
  };

  const handleMoveImage = (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= images.length) return;
    setImages((prev) => {
      const copy = [...prev];
      [copy[index], copy[target]] = [copy[target], copy[index]];
      return copy;
    });
  };

  const handleRemoveImage = (url) => {
    setImages((prev) => {
      const next = prev.filter((u) => u !== url);
      if (coverImage === url) {
        setCoverImage(next[0] || '');
      }
      return next;
    });
  };

  const handleResetMasterImage = () => {
    const master = item?.hinhAnhGoc ? [item.hinhAnhGoc] : [];
    setImages(master);
    setCoverImage(master[0] || '');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!item) return;
    const price = Number(giaBanHienTai);
    if (!Number.isFinite(price) || price <= 0) {
      alert('Giá bán lẻ phải lớn hơn 0!');
      return;
    }

    setSaving(true);
    try {
      const orderedImages = coverImage
        ? [coverImage, ...images.filter((img) => img !== coverImage)]
        : images;

      const updated = await marketplaceService.publishProductToMarketplace(item.id, {
        dangBan,
        giaBanHienTai: price,
        soLuongCanhBao: Number(soLuongCanhBao) || 0,
        hinhAnhRieng: orderedImages[0] || '',
        danhSachHinhAnh: orderedImages,
        moTaSanPham,
        thongSoKyThuat,
      });

      setItem(updated);
      setAlertNotice('Đã lưu thiết lập đăng bán & bộ sưu tập hình ảnh thành công!');
      setTimeout(() => setAlertNotice(''), 3500);
    } catch (err) {
      alert('Lỗi lưu thông tin: ' + (err?.message || 'Không rõ'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="seller-edit-loading">
        <div className="spinner"></div>
        <p>Đang tải chi tiết sản phẩm trong kho...</p>
      </div>
    );
  }

  if (errorMsg || !item) {
    return (
      <div className="seller-edit-error">
        <h3>Không thể mở trang chỉnh sửa</h3>
        <p>{errorMsg || 'Sản phẩm không tồn tại.'}</p>
        <button type="button" className="btn-back-products" onClick={() => navigate('/seller/products')}>
          <FiArrowLeft /> Quay lại Hàng Hóa & Đăng Bán
        </button>
      </div>
    );
  }

  const basePrice = Number(item.giaBan || 0);
  const currentPriceNum = Number(giaBanHienTai || 0);
  const diffPercent = basePrice > 0 && currentPriceNum > 0
    ? Math.round(((currentPriceNum - basePrice) / basePrice) * 100)
    : null;

  return (
    <div className="seller-product-edit-page">
      {alertNotice && (
        <div className="seller-toast-alert">
          <FiCheckCircle size={18} /> {alertNotice}
        </div>
      )}

      {/* Top Bar */}
      <div className="edit-page-topbar">
        <div className="topbar-left">
          <button type="button" className="btn-back-products" onClick={() => navigate('/seller/products')}>
            <FiArrowLeft /> Quay Lại Danh Sách
          </button>
          <div>
            <div className="edit-sku-row">
              <code>SKU: {item.sku}</code>
              <span className="cat-pill">{item.danhMuc || 'Thiết bị'}</span>
              {dangBan ? (
                <span className="status-pill-on"><FiEye /> Đang Mở Bán</span>
              ) : (
                <span className="status-pill-off"><FiEyeOff /> Tạm Ẩn Trong Kho</span>
              )}
            </div>
            <h2>{item.tenSanPham}</h2>
          </div>
        </div>

        <div className="topbar-right">
          {item.sanPhamId && dangBan && (
            <Link to={`/products/${item.sanPhamId}`} target="_blank" className="btn-preview-market">
              <FiExternalLink /> Xem Trên Sàn
            </Link>
          )}
          <button type="submit" form="seller-product-edit-form" className="btn-save-product-main" disabled={saving}>
            <FiSave /> {saving ? 'Đang Lưu...' : 'Lưu Thay Đổi'}
          </button>
        </div>
      </div>

      {/* Stock Overview Strip */}
      <div className="edit-stock-strip">
        <div className="strip-stat">
          <span>Tồn Thực Tế Trên Kệ</span>
          <strong>{item.soLuongThucTe ?? 0} {item.donViTinh || 'Cái'}</strong>
        </div>
        <div className="strip-stat">
          <span>Khả Dụng Bán Ngay</span>
          <strong>{item.soLuongKhaDung ?? 0} {item.donViTinh || 'Cái'}</strong>
        </div>
        <div className="strip-stat">
          <span>Đã Bán Thành Công</span>
          <strong>{item.soLuongDaBan ?? 0}</strong>
        </div>
        <div className="strip-stat">
          <span>Giá Tham Chiếu Kho Tổng</span>
          <strong>{basePrice > 0 ? `${basePrice.toLocaleString('vi-VN')} đ` : 'Chưa đặt'}</strong>
        </div>
      </div>

      <form id="seller-product-edit-form" onSubmit={handleSave} className="edit-layout-grid">
        {/* Cột Trái: Hình ảnh & Nội dung hiển thị */}
        <div className="edit-main-column">
          {/* Card 1: Thư viện Nhiều Hình Ảnh */}
          <section className="edit-card">
            <div className="edit-card-header">
              <div>
                <h3><FiImage /> Bộ Sưu Tập Hình Ảnh Sản Phẩm ({images.length})</h3>
                <p>Thêm nhiều góc chụp, ảnh mở hộp hoặc ảnh thực tế tại shop. Ảnh đầu tiên (hoặc ảnh được chọn làm bìa) sẽ hiển thị ngoài trang chủ.</p>
              </div>
              {item.hinhAnhGoc && (
                <button type="button" className="btn-reset-master" onClick={handleResetMasterImage}>
                  <FiRotateCcw size={14} /> Khôi phục ảnh gốc
                </button>
              )}
            </div>

            {/* Khu vực Preview Ảnh Bìa + Upload */}
            <div className="gallery-upload-row">
              <div className="primary-cover-preview">
                <img src={coverImage || images[0] || FALLBACK_IMAGE} alt={item.tenSanPham} />
                <span className="cover-caption">Ảnh đại diện chính</span>
              </div>

              <div className="upload-controls-box">
                <label className="upload-dropzone-btn">
                  <FiUpload size={20} />
                  <div>
                    <strong>{uploadingImages ? 'Đang xử lý ảnh...' : 'Tải Nhiều Ảnh Từ Máy Tính'}</strong>
                    <span>Chọn 1 hoặc nhiều ảnh (JPG, PNG, WEBP) — tự động tối ưu dung lượng</span>
                  </div>
                  <input type="file" multiple accept="image/*" onChange={handleFileUpload} disabled={uploadingImages} />
                </label>

                <div className="url-add-box">
                  <textarea
                    rows="2"
                    placeholder="Hoặc dán 1 hoặc nhiều link ảnh URL (mỗi dòng 1 link)..."
                    value={newImageUrls}
                    onChange={(e) => setNewImageUrls(e.target.value)}
                  />
                  <button type="button" className="btn-add-url" onClick={handleAddImageUrls}>
                    <FiPlus /> Thêm Link Ảnh
                  </button>
                </div>
              </div>
            </div>

            {/* Lưới Ảnh Đã Thêm */}
            {images.length === 0 ? (
              <div className="empty-gallery-hint">
                Chưa có ảnh nào. Hãy tải ảnh từ máy hoặc dán URL để khách hàng nhìn rõ sản phẩm hơn.
              </div>
            ) : (
              <div className="gallery-grid">
                {images.map((imgUrl, idx) => {
                  const isCover = (coverImage && coverImage === imgUrl) || (!coverImage && idx === 0);
                  return (
                    <div key={`${idx}-${imgUrl.slice(0, 32)}`} className={`gallery-tile ${isCover ? 'is-cover' : ''}`}>
                      <div className="tile-thumb">
                        <img src={imgUrl} alt={`Ảnh ${idx + 1}`} />
                        {isCover && <span className="tile-cover-badge"><FiStar size={11} /> Ảnh Bìa</span>}
                        <span className="tile-index-badge">#{idx + 1}</span>
                      </div>
                      <div className="tile-actions">
                        <button
                          type="button"
                          title="Di chuyển sang trái"
                          onClick={() => handleMoveImage(idx, -1)}
                          disabled={idx === 0}
                        >
                          <FiArrowLeft size={13} />
                        </button>
                        <button
                          type="button"
                          title="Di chuyển sang phải"
                          onClick={() => handleMoveImage(idx, 1)}
                          disabled={idx === images.length - 1}
                        >
                          <FiArrowRight size={13} />
                        </button>
                        {!isCover && (
                          <button
                            type="button"
                            className="btn-set-cover"
                            title="Đặt làm ảnh đại diện chính"
                            onClick={() => handleSetCover(imgUrl)}
                          >
                            <FiStar size={13} /> Bìa
                          </button>
                        )}
                        <button
                          type="button"
                          className="btn-remove-img"
                          title="Xóa ảnh này"
                          onClick={() => handleRemoveImage(imgUrl)}
                        >
                          <FiTrash2 size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Card 2: Mô tả & Thông số bổ sung của Shop */}
          <section className="edit-card">
            <div className="edit-card-header">
              <div>
                <h3>Nội Dung Giới Thiệu & Thông Số Của Shop</h3>
                <p>Tùy biến phần giới thiệu sản phẩm, quà tặng kèm hoặc cấu hình chi tiết để tăng tỷ lệ chốt đơn.</p>
              </div>
            </div>

            <div className="form-group-edit">
              <div className="label-row">
                <label>Mô Tả Sản Phẩm & Ưu Đãi Riêng Của Gian Hàng</label>
                {item.moTaGoc && moTaSanPham !== item.moTaGoc && (
                  <button type="button" className="btn-inline-link" onClick={() => setMoTaSanPham(item.moTaGoc)}>
                    Dùng lại mô tả gốc Kho Tổng
                  </button>
                )}
              </div>
              <textarea
                rows="5"
                value={moTaSanPham}
                onChange={(e) => setMoTaSanPham(e.target.value)}
                placeholder="Mô tả chi tiết tình trạng hàng, phụ kiện trong hộp, quà tặng kèm hoặc cam kết bảo hành riêng của shop..."
              />
            </div>

            <div className="form-group-edit">
              <label>Thông Số Kỹ Thuật / Điểm Nổi Bật (mỗi dòng 1 mục: Tên: Giá trị)</label>
              <textarea
                rows="5"
                value={thongSoKyThuat}
                onChange={(e) => setThongSoKyThuat(e.target.value)}
                placeholder={'Ví dụ:\nCPU: Intel Core 5 205H\nRAM: 16GB DDR5\nSSD: 512GB NVMe\nBảo hành: 24 tháng chính hãng tại shop'}
              />
            </div>
          </section>
        </div>

        {/* Cột Phải: Trạng thái mở bán, Giá & Cảnh báo tồn kho */}
        <aside className="edit-side-column">
          <section className="edit-card sticky-side-card">
            <h3>Thiết Lập Kinh Doanh</h3>

            <div className="form-group-edit">
              <label>Trạng Thái Mở Bán Trên Sàn TMĐT</label>
              <div className="publish-radio-stack">
                <label className={`radio-choice-card ${dangBan ? 'active' : ''}`}>
                  <input type="radio" name="dangBan" checked={dangBan === true} onChange={() => setDangBan(true)} />
                  <div>
                    <strong>Đang Mở Bán Công Khai</strong>
                    <span>Hiển thị trên trang chủ Sàn & trang Gian hàng</span>
                  </div>
                </label>
                <label className={`radio-choice-card ${!dangBan ? 'active' : ''}`}>
                  <input type="radio" name="dangBan" checked={dangBan === false} onChange={() => setDangBan(false)} />
                  <div>
                    <strong>Tạm Ẩn / Giữ Trong Kho</strong>
                    <span>Khách hàng trên sàn sẽ không tìm thấy sản phẩm này</span>
                  </div>
                </label>
              </div>
            </div>

            <div className="form-group-edit">
              <label>Giá Bán Lẻ Trên Sàn (VNĐ) *</label>
              <input
                type="number"
                min="1000"
                step="1000"
                required
                value={giaBanHienTai}
                onChange={(e) => setGiaBanHienTai(e.target.value)}
              />
              <div className="price-helper-line">
                <span>Hiển thị: <strong>{currentPriceNum > 0 ? `${currentPriceNum.toLocaleString('vi-VN')} đ` : '—'}</strong></span>
                {diffPercent !== null && (
                  <span className={`diff-tag ${diffPercent < 0 ? 'down' : diffPercent > 0 ? 'up' : ''}`}>
                    {diffPercent === 0 ? 'Bằng giá gốc' : `${diffPercent > 0 ? '+' : ''}${diffPercent}% so với giá gốc`}
                  </span>
                )}
              </div>
            </div>

            <div className="form-group-edit">
              <label>Ngưỡng Cảnh Báo Tồn Kho Thấp</label>
              <input
                type="number"
                min="0"
                value={soLuongCanhBao}
                onChange={(e) => setSoLuongCanhBao(e.target.value)}
              />
              <small className="field-hint">Hệ thống đánh dấu cảnh báo đỏ khi tồn kho chạm ngưỡng này.</small>
            </div>

            <div className="side-submit-actions">
              <button type="submit" className="btn-save-product-full" disabled={saving}>
                <FiSave /> {saving ? 'Đang Lưu Thay Đổi...' : 'Lưu Tất Cả Thiết Lập'}
              </button>
              <button type="button" className="btn-cancel-edit" onClick={() => navigate('/seller/products')}>
                Hủy & Quay Lại
              </button>
            </div>
          </section>
        </aside>
      </form>
    </div>
  );
};

export default SellerProductEdit;
