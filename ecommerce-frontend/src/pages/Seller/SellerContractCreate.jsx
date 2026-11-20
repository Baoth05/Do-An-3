// src/pages/Seller/SellerContractCreate.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useOutletContext, Link } from 'react-router-dom';
import { marketplaceService } from '../../services/marketplaceService';
import { 
  FiArrowLeft, FiPackage, FiShoppingBag, FiCheck, FiSend, 
  FiAlertCircle, FiSearch, FiTruck, FiShield, FiFileText, FiPlus, FiMinus, FiTrash2
} from 'react-icons/fi';
import './SellerContractCreate.css';

const SellerContractCreate = () => {
  const { storeId, currentStore, currentSeller } = useOutletContext();
  const navigate = useNavigate();

  const [step, setStep] = useState(1); // 1: Chọn sản phẩm, 2: Xem xét điều khoản & Gửi yêu cầu
  const [centralWarehouse, setCentralWarehouse] = useState(null);
  const [masterProducts, setMasterProducts] = useState([]);
  const [loadingWarehouse, setLoadingWarehouse] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Bộ lọc
  const [productSearch, setProductSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Danh sách hàng được chọn: { [sanPhamId]: quantity }
  const [selectedItems, setSelectedItems] = useState({});

  // 1. Tải thông tin Kho Tổng Trung Tâm
  useEffect(() => {
    const initData = async () => {
      setLoadingWarehouse(true);
      try {
        const wh = await marketplaceService.getSingleCentralWarehouse();
        setCentralWarehouse(wh);
        const whId = wh?.id || 1;
        await loadWarehouseInventory(whId);
      } catch (err) {
        console.warn('Lỗi nạp kho tổng:', err);
        await loadWarehouseInventory(1);
      } finally {
        setLoadingWarehouse(false);
      }
    };

    initData();
  }, []);

  // 2. Tải danh sách sản phẩm thực tế trong Kho Tổng
  const loadWarehouseInventory = async (whId) => {
    setLoadingProducts(true);
    try {
      const inventoryList = await marketplaceService.getWarehouseInventory(whId);
      const mapped = (inventoryList || []).map((p) => {
        const qty = p.soLuongKhaDung !== undefined 
          ? p.soLuongKhaDung 
          : (p.soLuongTonKho !== undefined ? p.soLuongTonKho : (p.soLuongThucTe || 0));
        return {
          id: p.sanPhamId || p.id,
          sanPhamId: p.sanPhamId || p.id,
          sku: p.sku || `SP00${p.sanPhamId || p.id}`,
          tenHangHoa: p.tenSanPham || p.tenHangHoa || 'Sản phẩm kho tổng',
          donViTinh: p.donViTinh || 'Cái',
          giaBan: p.giaBan || p.giaBanHienTai || 0,
          giaNhap: p.giaNhap || (p.giaBan ? Math.round(p.giaBan * 0.9) : 0),
          soLuongTonKho: qty,
          danhMuc: p.danhMuc || 'Thiết bị công nghệ',
          hinhAnh: p.hinhAnh || '',
        };
      });
      setMasterProducts(mapped);
    } catch (err) {
      console.error('Lỗi tải sản phẩm trong kho:', err);
      setMasterProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  };

  // Danh sách danh mục duy nhất
  const categories = useMemo(() => {
    const set = new Set();
    masterProducts.forEach((p) => {
      if (p.danhMuc) set.add(p.danhMuc);
    });
    return ['ALL', ...Array.from(set)];
  }, [masterProducts]);

  // Lọc sản phẩm
  const filteredProducts = useMemo(() => {
    return masterProducts.filter((p) => {
      const matchSearch = !productSearch.trim() || 
        (p.tenHangHoa || '').toLowerCase().includes(productSearch.toLowerCase().trim()) ||
        (p.sku || '').toLowerCase().includes(productSearch.toLowerCase().trim());
      const matchCategory = categoryFilter === 'ALL' || p.danhMuc === categoryFilter;
      return matchSearch && matchCategory;
    });
  }, [masterProducts, productSearch, categoryFilter]);

  // Thay đổi số lượng nhập
  const handleQtyChange = (prodId, val, maxStock) => {
    const num = parseInt(val, 10);
    if (isNaN(num) || num <= 0) {
      const next = { ...selectedItems };
      delete next[prodId];
      setSelectedItems(next);
    } else {
      const bounded = Math.min(num, maxStock > 0 ? maxStock : num);
      setSelectedItems((prev) => ({
        ...prev,
        [prodId]: bounded,
      }));
    }
  };

  const handleQuickAdd = (prodId, currentQty, maxStock, delta) => {
    const current = currentQty || 0;
    const nextVal = current + delta;
    handleQtyChange(prodId, nextVal, maxStock);
  };

  // Danh sách các mặt hàng đã chọn
  const selectedItemsList = useMemo(() => {
    return Object.keys(selectedItems).map((id) => {
      const prod = masterProducts.find((p) => Number(p.id) === Number(id));
      const qty = selectedItems[id];
      const wholesalePrice = prod?.giaNhap || (prod?.giaBan ? Math.round(prod.giaBan * 0.9) : 1000000);
      return {
        sanPhamId: Number(id),
        sku: prod?.sku || `SP00${id}`,
        tenHangHoa: prod?.tenHangHoa || 'Sản phẩm',
        donViTinh: prod?.donViTinh || 'Cái',
        soLuong: qty,
        donGiaSi: wholesalePrice,
        thanhTien: wholesalePrice * qty,
        hinhAnh: prod?.hinhAnh || '',
        danhMuc: prod?.danhMuc || '',
        maxStock: prod?.soLuongTonKho || 0,
      };
    });
  }, [selectedItems, masterProducts]);

  const totalQuantity = selectedItemsList.reduce((sum, item) => sum + item.soLuong, 0);
  const totalAmount = selectedItemsList.reduce((sum, item) => sum + item.thanhTien, 0);

  // Gửi yêu cầu hợp đồng nhập hàng
  const handleSubmitContract = async () => {
    if (selectedItemsList.length === 0) {
      setErrorMessage('Vui lòng chọn ít nhất 1 mặt hàng để gửi yêu cầu nhập!');
      return;
    }

    if (!storeId) {
      setErrorMessage('Không xác định được gian hàng của bạn. Vui lòng thử lại!');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const payload = {
        storeId: Number(storeId),
        khoTongId: centralWarehouse?.id || null,
        nguoiYeuCau: currentSeller?.hoTen || currentSeller?.taiKhoan || 'Chủ Gian Hàng',
        chucVuYeuCau: 'Chủ Cửa Hàng / Đại Diện Gian Hàng',
        danhSachHang: selectedItemsList.map((i) => ({
          sanPhamId: i.sanPhamId,
          soLuong: i.soLuong,
        })),
      };

      const res = await marketplaceService.createSupplyContractRequest(payload);
      const code = res?.maHopDong || 'HĐ Mới';

      navigate('/seller/contracts', {
        state: {
          justCreated: true,
          message: `🎉 Đã tạo thành công yêu cầu hợp đồng nhập hàng ${code}! Yêu cầu đang được gửi tới Admin thẩm định duyệt vòng 1.`
        }
      });
    } catch (err) {
      console.error('Lỗi gửi yêu cầu hợp đồng:', err);
      setErrorMessage(err.message || 'Lỗi gửi yêu cầu hợp đồng đến hệ thống!');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="contract-create-page">
      {/* Top Header & Navigation */}
      <div className="create-page-header">
        <Link to="/seller/contracts" className="btn-back-link">
          <FiArrowLeft size={18} /> Danh sách hợp đồng
        </Link>
        <div className="header-titles">
          <h1>Lập Yêu Cầu Hợp Đồng Nhập Hàng</h1>
          <p>Nhập hàng từ Kho Tổng Trung Tâm (Bên A) về Kho Gian Hàng Độc Lập (Bên B)</p>
        </div>
      </div>

      {/* Stepper Chỉ báo tiến trình */}
      <div className="stepper-container">
        <div className={`step-item ${step === 1 ? 'active' : 'completed'}`} onClick={() => setStep(1)}>
          <div className="step-circle">{step > 1 ? <FiCheck size={16} /> : '1'}</div>
          <div className="step-text">
            <strong>Bước 1: Chọn Hàng Hóa</strong>
            <small>Chọn danh sách sản phẩm & số lượng</small>
          </div>
        </div>
        <div className="step-line"></div>
        <div className={`step-item ${step === 2 ? 'active' : ''}`} onClick={() => selectedItemsList.length > 0 && setStep(2)}>
          <div className="step-circle">2</div>
          <div className="step-text">
            <strong>Bước 2: Xem Xét Hợp Đồng</strong>
            <small>Kiểm tra điều khoản & Xác nhận gửi</small>
          </div>
        </div>
      </div>

      {/* Thông báo lỗi nếu có */}
      {errorMessage && (
        <div className="contract-create-alert error">
          <FiAlertCircle size={18} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* BƯỚC 1: CHỌN SẢN PHẨM TỪ KHO TỔNG */}
      {step === 1 && (
        <div className="create-step-layout">
          {/* Cột Trái: Danh mục sản phẩm Kho Tổng */}
          <div className="products-selection-panel">
            {/* Filter Bar */}
            <div className="panel-filter-bar">
              <div className="search-box">
                <FiSearch className="search-icon" size={17} />
                <input
                  type="text"
                  placeholder="Tìm theo tên sản phẩm, mã SKU..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                />
              </div>
              <div className="category-tabs">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    className={`cat-pill ${categoryFilter === cat ? 'active' : ''}`}
                    onClick={() => setCategoryFilter(cat)}
                  >
                    {cat === 'ALL' ? 'Tất cả danh mục' : cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Warehouse source badge */}
            <div className="source-warehouse-banner">
              <FiTruck size={18} color="#2563eb" />
              <div>
                <strong>Nguồn cung ứng:</strong> {centralWarehouse?.tenKho || 'Kho Tổng Trung Tâm (KHO_TONG)'} • 
                <span className="address-text"> {centralWarehouse?.diaChi || 'Cần Thơ'}</span>
              </div>
            </div>

            {/* Products Table/Grid */}
            {loadingProducts ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Đang tải danh sách hàng hóa khả dụng trong Kho Tổng...</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="empty-products-state">
                <FiPackage size={42} color="#94a3b8" />
                <h4>Không tìm thấy sản phẩm phù hợp</h4>
                <p>Vui lòng thử tìm kiếm với từ khóa khác hoặc liên hệ Kho Tổng để nhập thêm hàng.</p>
              </div>
            ) : (
              <div className="products-table-wrap">
                <table className="products-table">
                  <thead>
                    <tr>
                      <th>Sản phẩm</th>
                      <th>Danh mục</th>
                      <th>Đơn giá sỉ (B2B)</th>
                      <th>Khả dụng Kho Tổng</th>
                      <th style={{ width: '180px', textAlign: 'center' }}>Số lượng yêu cầu</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((p) => {
                      const qty = selectedItems[p.id] || 0;
                      const isOutOfStock = p.soLuongTonKho <= 0;

                      return (
                        <tr key={p.id} className={qty > 0 ? 'selected-row' : ''}>
                          <td>
                            <div className="product-info-cell">
                              <div className="prod-thumbnail">
                                {p.hinhAnh ? (
                                  <img src={p.hinhAnh} alt={p.tenHangHoa} />
                                ) : (
                                  <FiPackage size={20} color="#94a3b8" />
                                )}
                              </div>
                              <div>
                                <strong className="prod-name">{p.tenHangHoa}</strong>
                                <span className="prod-sku">SKU: {p.sku} • {p.donViTinh}</span>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className="category-pill">{p.danhMuc}</span>
                          </td>
                          <td>
                            <strong className="wholesale-price">
                              {(p.giaNhap || Math.round(p.giaBan * 0.9)).toLocaleString('vi-VN')} đ
                            </strong>
                            {p.giaBan > 0 && (
                              <small className="retail-ref">
                                Giá bán lẻ: {p.giaBan.toLocaleString('vi-VN')} đ
                              </small>
                            )}
                          </td>
                          <td>
                            <span className={`stock-badge ${isOutOfStock ? 'empty' : 'available'}`}>
                              {isOutOfStock ? 'Hết hàng' : `Còn ${p.soLuongTonKho} ${p.donViTinh}`}
                            </span>
                          </td>
                          <td>
                            <div className="quantity-controller">
                              <button
                                type="button"
                                className="qty-btn"
                                onClick={() => handleQuickAdd(p.id, qty, p.soLuongTonKho, -1)}
                                disabled={qty <= 0}
                              >
                                <FiMinus size={14} />
                              </button>
                              <input
                                type="number"
                                min="0"
                                max={p.soLuongTonKho}
                                value={qty || ''}
                                placeholder="0"
                                onChange={(e) => handleQtyChange(p.id, e.target.value, p.soLuongTonKho)}
                                disabled={isOutOfStock}
                              />
                              <button
                                type="button"
                                className="qty-btn"
                                onClick={() => handleQuickAdd(p.id, qty, p.soLuongTonKho, 1)}
                                disabled={isOutOfStock || qty >= p.soLuongTonKho}
                              >
                                <FiPlus size={14} />
                              </button>
                              {p.soLuongTonKho > 0 && (
                                <button
                                  type="button"
                                  className="max-btn"
                                  title="Chọn tối đa tồn kho"
                                  onClick={() => handleQtyChange(p.id, p.soLuongTonKho, p.soLuongTonKho)}
                                >
                                  Tối đa
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Cột Phải: Bảng tóm tắt đơn yêu cầu nhập hàng (Sticky) */}
          <div className="order-summary-panel">
            <div className="summary-card">
              <div className="summary-card-header">
                <h3>
                  <FiShoppingBag size={18} color="#2563eb" /> Giỏ Hàng Yêu Cầu
                </h3>
                <span className="items-count-pill">{selectedItemsList.length} mặt hàng</span>
              </div>

              {/* Thông tin 2 bên đối tác */}
              <div className="parties-summary-box">
                <div className="party-row">
                  <span className="party-label">Bên Cung Ứng (A):</span>
                  <strong>{centralWarehouse?.tenKho || 'Kho Tổng Trung Tâm'}</strong>
                </div>
                <div className="party-row">
                  <span className="party-label">Bên Tiếp Nhận (B):</span>
                  <strong>{currentStore?.tenKho || 'Gian hàng của bạn'} (#{storeId})</strong>
                </div>
              </div>

              {/* Danh sách các mặt hàng đã chọn */}
              <div className="selected-items-scroll">
                {selectedItemsList.length === 0 ? (
                  <div className="no-items-selected">
                    <FiPackage size={32} color="#cbd5e1" />
                    <p>Chưa có sản phẩm nào được chọn. Nhập số lượng ở cột bên trái để thêm vào danh sách.</p>
                  </div>
                ) : (
                  selectedItemsList.map((item) => (
                    <div key={item.sanPhamId} className="summary-item-row">
                      <div className="summary-item-details">
                        <div className="summary-item-title">{item.tenHangHoa}</div>
                        <div className="summary-item-sub">
                          {item.soLuong} {item.donViTinh} × {item.donGiaSi.toLocaleString('vi-VN')} đ
                        </div>
                      </div>
                      <div className="summary-item-right">
                        <strong>{item.thanhTien.toLocaleString('vi-VN')} đ</strong>
                        <button
                          type="button"
                          className="remove-item-btn"
                          onClick={() => handleQtyChange(item.sanPhamId, 0, item.maxStock)}
                          title="Xóa mặt hàng này"
                        >
                          <FiTrash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Tổng kết tiền */}
              <div className="summary-totals-box">
                <div className="total-row">
                  <span>Tổng số lượng sản phẩm:</span>
                  <strong>{totalQuantity} kiện / cái</strong>
                </div>
                <div className="total-row highlight">
                  <span>Tổng giá trị hợp đồng sỉ:</span>
                  <strong className="grand-total">{totalAmount.toLocaleString('vi-VN')} đ</strong>
                </div>
              </div>

              {/* Action Button */}
              <button
                type="button"
                className="btn-continue-step"
                disabled={selectedItemsList.length === 0}
                onClick={() => setStep(2)}
              >
                Tiếp Tục: Xem Hợp Đồng & Gửi Yêu Cầu <FiSend size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BƯỚC 2: XEM TRƯỚC VĂN BẢN HỢP ĐỒNG & XÁC NHẬN GỬI */}
      {step === 2 && (
        <div className="contract-preview-step">
          {/* Legal Document Card */}
          <div className="legal-contract-document">
            {/* Quốc hiệu & Tiêu ngữ */}
            <div className="doc-national-header">
              <h4>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</h4>
              <p>Độc lập - Tự do - Hạnh phúc</p>
              <div className="doc-divider"></div>
            </div>

            {/* Tên Hợp Đồng */}
            <div className="doc-title-block">
              <h2>HỢP ĐỒNG CUNG ỨNG NỘI BỘ & ĐIỀU CHUYỂN HÀNG HÓA</h2>
              <span className="doc-sub">
                (Phân hệ B2B: Kho Tổng Trung Tâm CTUT WMS ➔ Gian Hàng Sàn TMĐT)
              </span>
              <div className="doc-meta-badge">
                Mã dự kiến: HDCU-{new Date().getFullYear()}/{currentStore?.maKho || 'STORE'}-AUTO
              </div>
            </div>

            {/* Thông tin Bên A và Bên B */}
            <div className="doc-parties-grid">
              <div className="doc-party-card">
                <div className="party-badge">BÊN A (BÊN CUNG ỨNG - KHO TỔNG)</div>
                <table className="party-table">
                  <tbody>
                    <tr>
                      <td>Đơn vị cung ứng:</td>
                      <td><strong>{centralWarehouse?.tenKho || 'Kho Tổng Trung Tâm CTUT Gear'}</strong></td>
                    </tr>
                    <tr>
                      <td>Mã kho nguồn:</td>
                      <td><code>{centralWarehouse?.maKho || 'KHO_TONG'}</code></td>
                    </tr>
                    <tr>
                      <td>Địa chỉ kho:</td>
                      <td>{centralWarehouse?.diaChi || '256 Nguyễn Văn Cừ, An Hòa, Cần Thơ'}</td>
                    </tr>
                    <tr>
                      <td>Hotline hỗ trợ:</td>
                      <td>{centralWarehouse?.soDienThoai || '1900 6868'}</td>
                    </tr>
                    <tr>
                      <td>Đại diện ký kết:</td>
                      <td>Ban Quản Trị Hệ Thống & Thủ Kho Tổng</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="doc-party-card">
                <div className="party-badge b">BÊN B (BÊN MUA HÀNG - GIAN HÀNG)</div>
                <table className="party-table">
                  <tbody>
                    <tr>
                      <td>Gian hàng nhận hàng:</td>
                      <td><strong>{currentStore?.tenKho || 'Gian hàng của bạn'}</strong></td>
                    </tr>
                    <tr>
                      <td>Mã kho gian hàng:</td>
                      <td><code>{currentStore?.maKho || `STORE-${storeId}`}</code></td>
                    </tr>
                    <tr>
                      <td>Địa chỉ cửa hàng:</td>
                      <td>{currentStore?.diaChi || currentSeller?.diaChi || 'Việt Nam'}</td>
                    </tr>
                    <tr>
                      <td>Người đại diện pháp luật:</td>
                      <td><strong>{currentSeller?.hoTen || currentSeller?.taiKhoan || 'Chủ Gian Hàng'}</strong></td>
                    </tr>
                    <tr>
                      <td>Số điện thoại liên hệ:</td>
                      <td>{currentSeller?.soDienThoai || currentStore?.soDienThoai || 'Chưa cập nhật'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bảng chi tiết mặt hàng */}
            <div className="doc-table-section">
              <h4>ĐIỀU 1: DANH MỤC HÀNG HÓA & ĐƠN GIÁ CUNG ỨNG NỘI BỘ</h4>
              <table className="doc-items-table">
                <thead>
                  <tr>
                    <th>STT</th>
                    <th>Mã SKU</th>
                    <th>Tên Hàng Hóa / Thiết Bị</th>
                    <th>ĐVT</th>
                    <th style={{ textAlign: 'center' }}>Số Lượng</th>
                    <th style={{ textAlign: 'right' }}>Đơn Giá Sỉ (VNĐ)</th>
                    <th style={{ textAlign: 'right' }}>Thành Tiền (VNĐ)</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedItemsList.map((item, idx) => (
                    <tr key={item.sanPhamId}>
                      <td style={{ textAlign: 'center' }}>{idx + 1}</td>
                      <td><code>{item.sku}</code></td>
                      <td><strong>{item.tenHangHoa}</strong></td>
                      <td>{item.donViTinh}</td>
                      <td style={{ textAlign: 'center' }}><strong>{item.soLuong}</strong></td>
                      <td style={{ textAlign: 'right' }}>{item.donGiaSi.toLocaleString('vi-VN')} đ</td>
                      <td style={{ textAlign: 'right' }}><strong>{item.thanhTien.toLocaleString('vi-VN')} đ</strong></td>
                    </tr>
                  ))}
                  <tr className="doc-total-row">
                    <td colSpan="4" style={{ textAlign: 'right' }}><strong>TỔNG CỘNG:</strong></td>
                    <td style={{ textAlign: 'center' }}><strong>{totalQuantity}</strong></td>
                    <td colSpan="2" style={{ textAlign: 'right', color: '#dc2626', fontSize: '16px' }}>
                      <strong>{totalAmount.toLocaleString('vi-VN')} VNĐ</strong>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Điều khoản */}
            <div className="doc-terms-section">
              <h4>ĐIỀU 2: PHƯƠNG THỨC XỬ LÝ & BẢO ĐẢM</h4>
              <ol>
                <li><strong>Quy trình phê duyệt:</strong> Sau khi gửi yêu cầu, Ban Quản Trị Hệ Thống (Admin) sẽ tiến hành thẩm định tồn kho và phê duyệt Vòng 1. Sau đó, Chủ Cửa Hàng tiến hành Ký số điện tử bằng mã xác thực.</li>
                <li><strong>Điều chuyển kho:</strong> Khi hoàn tất thủ tục ký số và duyệt chuyển kho, Kho Tổng sẽ xuất phiếu điều chuyển, trừ tồn kho trung tâm và giao hàng đến điểm kho của Shop.</li>
                <li><strong>Ghi nhận thẻ kho:</strong> Sau khi Shop bấm xác nhận nhận đủ hàng, hệ thống sẽ tự động cập nhật số lượng tồn khả dụng vào kho của Shop và ghi lịch sử thẻ kho minh bạch.</li>
              </ol>
            </div>

            {/* Chữ ký dự kiến */}
            <div className="doc-signature-preview-grid">
              <div className="sig-preview-col">
                <strong>ĐẠI DIỆN BÊN A</strong>
                <small>Ban Quản Trị Hệ Thống</small>
                <div className="sig-box-placeholder pending">
                  <FiShield size={24} color="#94a3b8" />
                  <span>Sẽ ký duyệt sau khi tiếp nhận</span>
                </div>
              </div>
              <div className="sig-preview-col">
                <strong>ĐẠI DIỆN BÊN B</strong>
                <small>{currentSeller?.hoTen || currentSeller?.taiKhoan || 'Chủ Cửa Hàng'}</small>
                <div className="sig-box-placeholder pending">
                  <FiFileText size={24} color="#2563eb" />
                  <span>Sẽ ký số điện tử tại Bước 3</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Action Control Bar */}
          <div className="doc-actions-bottom-bar">
            <button
              type="button"
              className="btn-back-step"
              onClick={() => setStep(1)}
              disabled={isSubmitting}
            >
              <FiArrowLeft size={16} /> Quay Lại Chỉnh Sửa Sản Phẩm
            </button>

            <button
              type="button"
              className="btn-submit-contract"
              onClick={handleSubmitContract}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="btn-spinner"></div> Đang gửi yêu cầu...
                </>
              ) : (
                <>
                  <FiSend size={16} /> Xác Nhận Gửi Yêu Cầu Hợp Đồng Đến Admin
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerContractCreate;
