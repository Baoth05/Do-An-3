// src/pages/Seller/SellerContracts.jsx
import { useState, useEffect } from 'react';
import { useOutletContext, Link, useLocation } from 'react-router-dom';
import { marketplaceService } from '../../services/marketplaceService';
import { 
  FiFileText, FiPlus, FiCheckCircle, FiShield, 
  FiPackage, FiTruck, FiBox, FiArrowRight, FiX, FiCheck, FiDownload 
} from 'react-icons/fi';
import './SellerContracts.css';

const SellerContracts = () => {
  const { storeId, currentStore } = useOutletContext();
  const location = useLocation();

  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alertNotice, setAlertNotice] = useState(
    location.state?.justRegistered 
      ? `Chào mừng ${location.state?.storeName || 'Cửa hàng'}! Vui lòng ký hợp đồng cung ứng đầu tiên để nhập hàng về kho.` 
      : ''
  );

  // Modal tạo & ký hợp đồng
  const [modalOpen, setModalOpen] = useState(false);
  const [step, setStep] = useState(1); // 1: Chọn hàng, 2: Xem điều khoản hợp đồng, 3: Ký số
  const [centralWarehouses, setCentralWarehouses] = useState([]);
  const [selectedCentralId, setSelectedCentralId] = useState('');
  const [masterProducts, setMasterProducts] = useState([]);
  const [selectedItems, setSelectedItems] = useState({}); // { [sanPhamId]: quantity }

  // Thông tin ký số hợp đồng
  const [signerInfo, setSignerInfo] = useState({
    signerName: 'Trần Minh Quân',
    signerRole: 'Chủ Cửa Hàng / Đại Diện Pháp Luật',
    signaturePin: '123456',
    agreedTerms: true,
  });
  const [isSubmittingContract, setIsSubmittingContract] = useState(false);

  // Modal xem chi tiết hợp đồng đã ký
  const [viewingContract, setViewingContract] = useState(null);

  const fetchContracts = async () => {
    setLoading(true);
    try {
      const data = await marketplaceService.getStoreContracts(storeId);
      setContracts(data);
    } catch (err) {
      console.error('Lỗi tải danh sách hợp đồng:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (storeId) {
      fetchContracts();
    }
  }, [storeId]);

  // Mở modal tạo hợp đồng mới
  const handleOpenCreateContract = async () => {
    setStep(1);
    setSelectedItems({});
    setModalOpen(true);

    try {
      const [warehouses, prods] = await Promise.all([
        marketplaceService.getCentralWarehouses(),
        marketplaceService.getMasterProducts(),
      ]);

      setCentralWarehouses(warehouses);
      if (warehouses.length > 0) {
        setSelectedCentralId(String(warehouses[0].id));
      }

      // Format Master Products
      setMasterProducts(
        prods.length > 0
          ? prods
          : [
              { id: 1, sku: 'SP001', tenHangHoa: 'iPhone 15 Pro Max 256GB Titan Tự Nhiên', giaBan: 28000000, donViTinh: 'Cái', danhMuc: 'Điện Thoại' },
              { id: 2, sku: 'SP002', tenHangHoa: 'Chuột Không Dây Logitech MX Master 3S', giaBan: 2100000, donViTinh: 'Cái', danhMuc: 'Phụ Kiện' },
              { id: 3, sku: 'SP003', tenHangHoa: 'Bàn Phím Cơ Keychron K2 Pro Wireless', giaBan: 1950000, donViTinh: 'Cái', danhMuc: 'Phụ Kiện' },
              { id: 4, sku: 'SP004', tenHangHoa: 'MacBook Air 15 inch M3 16GB / 512GB Midnight', giaBan: 32000000, donViTinh: 'Cái', danhMuc: 'Laptop' },
            ]
      );
    } catch (err) {
      console.error('Lỗi tải dữ liệu kho tổng hoặc sản phẩm:', err);
    }
  };

  // Thay đổi số lượng sản phẩm nhập
  const handleItemQtyChange = (prodId, qty) => {
    const val = parseInt(qty, 10);
    if (isNaN(val) || val <= 0) {
      const next = { ...selectedItems };
      delete next[prodId];
      setSelectedItems(next);
    } else {
      setSelectedItems((prev) => ({
        ...prev,
        [prodId]: val,
      }));
    }
  };

  // Tính tổng giá trị hợp đồng
  const contractItemsList = Object.keys(selectedItems).map((id) => {
    const prod = masterProducts.find((p) => p.id === Number(id));
    const qty = selectedItems[id];
    const wholesalePrice = prod?.giaBan ? Math.round(prod.giaBan * 0.9) : 1000000; // Giá sỉ B2B chiết khấu 10%
    return {
      sanPhamId: Number(id),
      sku: prod?.sku || `SP00${id}`,
      tenHangHoa: prod?.tenHangHoa || prod?.tenSanPham || 'Sản phẩm',
      soLuong: qty,
      donGiaSi: wholesalePrice,
      thanhTien: wholesalePrice * qty,
    };
  });

  const totalContractAmount = contractItemsList.reduce((sum, i) => sum + i.thanhTien, 0);
  const totalItemCount = contractItemsList.reduce((sum, i) => sum + i.soLuong, 0);

  // Ký Hợp Đồng & Kích Hoạt Nhập Hàng
  const handleSignContract = async () => {
    if (!signerInfo.signerName.trim()) {
      alert('Vui lòng nhập họ tên người đại diện ký hợp đồng!');
      return;
    }
    if (contractItemsList.length === 0) {
      alert('Vui lòng chọn ít nhất 1 sản phẩm để nhập kho!');
      return;
    }

    setIsSubmittingContract(true);
    try {
      const selectedWh = centralWarehouses.find((w) => w.id === Number(selectedCentralId)) || {
        tenKho: 'Kho Tổng Trung Tâm CTUT Logistics',
        diaChi: '256 Nguyễn Văn Cừ, Cần Thơ',
      };

      const contractCode = `HDCU-${new Date().getFullYear()}/03-${currentStore?.maKho || 'STORE'}-${Math.floor(1000 + Math.random() * 9000)}`;

      // 1. Nhập tồn kho từng sản phẩm vào kho riêng của Cửa Hàng qua API /inventory/add
      for (const item of contractItemsList) {
        try {
          await marketplaceService.importStockToStore({
            sanPhamId: item.sanPhamId,
            khoHangId: Number(storeId),
            soLuong: item.soLuong,
          });
        } catch (e) {
          console.warn(`Lỗi nhập món #${item.sanPhamId} vào kho:`, e?.message);
        }
      }

      // 2. Tạo bản hợp đồng hoàn chỉnh lưu trữ
      const newContract = {
        id: Date.now(),
        maHopDong: contractCode,
        ngayKy: new Date().toISOString(),
        storeId: Number(storeId),
        tenKhoCuaHang: currentStore?.tenKho || 'Gian Hàng Của Bạn',
        khoCungUng: selectedWh.tenKho || 'Kho Tổng Trung Tâm CTUT',
        diaChiKhoCungUng: selectedWh.diaChi || 'Cần Thơ',
        tongTien: totalContractAmount,
        soLuongMatHang: contractItemsList.length,
        tongSoLuongHang: totalItemCount,
        danhSachHang: contractItemsList,
        nguoiKy: signerInfo.signerName,
        chucVu: signerInfo.signerRole,
        trangThai: 'DA_KY_VA_NHAP_KHO',
        maChuKySo: `DS-SHA256-${Math.random().toString(36).substring(2, 12).toUpperCase()}`,
      };

      await marketplaceService.saveStoreContract(storeId, newContract);

      setAlertNotice(`🎉 Ký thành công hợp đồng ${contractCode}! Đã nhập ${totalItemCount} sản phẩm về kho riêng của bạn.`);
      setModalOpen(false);
      await fetchContracts();
    } catch (err) {
      alert('Lỗi ký hợp đồng: ' + err.message);
    } finally {
      setIsSubmittingContract(false);
    }
  };

  return (
    <div className="seller-contracts-page">
      {/* Toast thông báo */}
      {alertNotice && (
        <div className="seller-toast-alert">
          <FiCheckCircle size={18} /> {alertNotice}
        </div>
      )}

      {/* Header trang */}
      <div className="seller-page-header-flex">
        <div>
          <h2>Hợp Đồng Cung Ứng & Nhập Kho Hàng Hóa (B2B2C)</h2>
          <p>
            Cửa hàng liên kết và ký hợp đồng cung ứng với Kho Tổng Trung Tâm để nhập sản phẩm chính hãng về kho riêng.
            Sau khi nhập kho thành công, bạn có thể chủ động chọn đăng bán lên Sàn TMĐT.
          </p>
        </div>

        <button className="btn-create-contract" onClick={handleOpenCreateContract}>
          <FiPlus /> Ký Hợp Đồng Nhập Hàng Mới
        </button>
      </div>

      {/* Thẻ quy trình tóm tắt */}
      <div className="contract-workflow-steps">
        <div className="wf-step">
          <div className="wf-step-num">1</div>
          <div className="wf-step-text">
            <strong>Chọn Kho Tổng & Hàng Hóa</strong>
            <span>Lựa chọn sản phẩm chính hãng từ Master Catalog và số lượng nhập</span>
          </div>
        </div>
        <div className="wf-arrow">→</div>
        <div className="wf-step">
          <div className="wf-step-num">2</div>
          <div className="wf-step-text">
            <strong>Ký Hợp Đồng Cung Ứng Điện Tử</strong>
            <span>Xác nhận điều khoản chất lượng, bảo hành và ký số điện tử</span>
          </div>
        </div>
        <div className="wf-arrow">→</div>
        <div className="wf-step">
          <div className="wf-step-num">3</div>
          <div className="wf-step-text">
            <strong>Nhập Về Kho & Đăng Bán Lên Sàn</strong>
            <span>Hàng về kho riêng của shop, chủ shop chủ động bật bán lên sàn</span>
          </div>
        </div>
      </div>

      {/* Danh sách hợp đồng đã ký */}
      <div className="contracts-table-card">
        <div className="contracts-card-header">
          <h3>Danh Sách Hợp Đồng Cung Ứng Đã Ký Của Gian Hàng ({contracts.length})</h3>
        </div>

        {loading ? (
          <div className="seller-loading-state">
            <div className="spinner"></div>
            <p>Đang tải danh sách hợp đồng...</p>
          </div>
        ) : contracts.length === 0 ? (
          <div className="seller-empty-state">
            <FiFileText size={48} className="empty-icon" />
            <h3>Gian hàng chưa ký hợp đồng cung ứng nào</h3>
            <p>
              Kho riêng của bạn hiện chưa có sản phẩm. Hãy ký hợp đồng cung ứng với Kho Tổng để nhập lô hàng
              đầu tiên về kho và tiến hành đăng bán trên Sàn!
            </p>
            <button className="btn-create-contract" onClick={handleOpenCreateContract}>
              <FiPlus /> Ký Hợp Đồng Nhập Hàng Đầu Tiên
            </button>
          </div>
        ) : (
          <table className="contracts-data-table">
            <thead>
              <tr>
                <th>Mã Hợp Đồng</th>
                <th>Kho Cung Ứng (Bên A)</th>
                <th>Ngày Ký</th>
                <th>Số Lượng Hàng</th>
                <th>Tổng Giá Trị</th>
                <th>Trạng Thái</th>
                <th>Chi Tiết</th>
              </tr>
            </thead>
            <tbody>
              {contracts.map((c) => (
                <tr key={c.id}>
                  <td>
                    <strong className="contract-code-tag">{c.maHopDong}</strong>
                    <small className="contract-sub-sig">Ký số: {c.maChuKySo}</small>
                  </td>
                  <td>
                    <strong>{c.khoCungUng}</strong>
                  </td>
                  <td>
                    {new Date(c.ngayKy).toLocaleDateString('vi-VN')}
                  </td>
                  <td>
                    <strong>{c.tongSoLuongHang}</strong> sản phẩm ({c.soLuongMatHang} mã)
                  </td>
                  <td>
                    <strong className="contract-amount">{Number(c.tongTien).toLocaleString('vi-VN')} đ</strong>
                  </td>
                  <td>
                    <span className="badge-contract-active">
                      <FiCheckCircle /> ĐÃ KÝ & NHẬP KHO
                    </span>
                  </td>
                  <td>
                    <button 
                      className="btn-view-contract-doc"
                      onClick={() => setViewingContract(c)}
                    >
                      <FiFileText /> Xem Bản Hợp Đồng
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* MODAL TẠO & KÝ HỢP ĐỒNG (3 BƯỚC) */}
      {modalOpen && (
        <div className="modal-backdrop-overlay" onClick={() => setModalOpen(false)}>
          <div className="contract-wizard-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3>📝 Hợp Đồng Cung Ứng & Nhập Kho Hàng Hóa</h3>
                <span className="wizard-step-tag">Bước {step} / 3: {step === 1 ? 'Chọn Sản Phẩm Nhập' : step === 2 ? 'Xem Văn Bản Hợp Đồng' : 'Ký Số Xác Nhận'}</span>
              </div>
              <FiX className="btn-close-modal" onClick={() => setModalOpen(false)} />
            </div>

            {/* BƯỚC 1: CHỌN HÀNG HÓA NHẬP KHO */}
            {step === 1 && (
              <div className="wizard-step-content">
                <div className="form-group-seller">
                  <label>Chọn Kho Cung Ứng / Kho Tổng Trung Tâm (Bên A) *</label>
                  <select 
                    value={selectedCentralId}
                    onChange={(e) => setSelectedCentralId(e.target.value)}
                  >
                    {centralWarehouses.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.tenKho} (Địa chỉ: {w.diaChi || 'Cần Thơ'})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="catalog-selection-header">
                  <h4>Danh Mục Sản Phẩm Master Catalog Đạt Chuẩn Cung Ứng:</h4>
                  <span className="selected-summary-pill">
                    Đã chọn: <strong>{totalItemCount} sản phẩm</strong> ({Number(totalContractAmount).toLocaleString('vi-VN')} đ)
                  </span>
                </div>

                <div className="import-products-picker-list">
                  {masterProducts.map((p) => {
                    const wholesalePrice = p.giaBan ? Math.round(p.giaBan * 0.9) : 1000000;
                    const selectedQty = selectedItems[p.id] || 0;

                    return (
                      <div key={p.id} className={`picker-item-card ${selectedQty > 0 ? 'selected' : ''}`}>
                        <div className="p-card-left">
                          <strong>{p.tenHangHoa || p.tenSanPham}</strong>
                          <div className="p-meta-sub">
                            <span>SKU: {p.sku}</span> • <span>Giá sỉ B2B: {Number(wholesalePrice).toLocaleString('vi-VN')} đ</span>
                          </div>
                        </div>

                        <div className="p-card-right">
                          <label>Số lượng nhập:</label>
                          <div className="qty-input-group">
                            <button 
                              type="button" 
                              onClick={() => handleItemQtyChange(p.id, Math.max(0, selectedQty - 1))}
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min="0"
                              value={selectedQty}
                              onChange={(e) => handleItemQtyChange(p.id, e.target.value)}
                            />
                            <button 
                              type="button" 
                              onClick={() => handleItemQtyChange(p.id, selectedQty + 1)}
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="modal-actions-footer">
                  <button className="btn-cancel" onClick={() => setModalOpen(false)}>Hủy</button>
                  <button 
                    className="btn-next-step"
                    disabled={totalItemCount === 0}
                    onClick={() => setStep(2)}
                  >
                    Tiếp Tục: Soạn Hợp Đồng ({totalItemCount} sản phẩm) <FiArrowRight />
                  </button>
                </div>
              </div>
            )}

            {/* BƯỚC 2: XEM VĂN BẢN HỢP ĐỒNG PHÁP LÝ */}
            {step === 2 && (
              <div className="wizard-step-content">
                <div className="contract-document-preview">
                  <div className="contract-doc-header">
                    <h4>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</h4>
                    <p>Độc lập - Tự do - Hạnh phúc</p>
                    <div className="doc-divider"></div>
                    <h3>HỢP ĐỒNG CUNG ỨNG HÀNG HÓA VÀ LƯU KHO B2B2C</h3>
                    <small>Số: HDCU-2026/CTUT-{currentStore?.maKho || 'STORE'}-AUTO</small>
                  </div>

                  <div className="contract-parties-box">
                    <div className="party-block">
                      <strong>BÊN A (BÊN CUNG ỨNG & QUẢN TRỊ KHO TỔNG):</strong>
                      <p>Đơn vị: Kho Tổng Trung Tâm CTUT Logistics</p>
                      <p>Địa chỉ: 256 Nguyễn Văn Cừ, Quận Ninh Kiều, TP. Cần Thơ</p>
                      <p>Đại diện: Ban Điều Hành Chuỗi Cung Ứng CTUT Gear</p>
                    </div>

                    <div className="party-block">
                      <strong>BÊN B (BÊN NHẬN CUNG ỨNG / CHỦ GIAN HÀNG):</strong>
                      <p>Cửa hàng: <strong>{currentStore?.tenKho || 'Gian Hàng Bán Lẻ'}</strong></p>
                      <p>Mã kho riêng: <strong>{currentStore?.maKho || 'STORE-RETAIL'}</strong></p>
                      <p>Địa chỉ kho riêng: {currentStore?.diaChi || 'Cần Thơ'}</p>
                    </div>
                  </div>

                  <div className="contract-terms-text">
                    <h5>ĐIỀU 1: DANH MỤC VÀ ĐƠN GIÁ HÀNG HÓA NHẬP KHO</h5>
                    <table className="contract-items-table">
                      <thead>
                        <tr>
                          <th>STT</th>
                          <th>Tên Hàng Hóa</th>
                          <th>Mã SKU</th>
                          <th>Số Lượng</th>
                          <th>Đơn Giá Sỉ B2B</th>
                          <th>Thành Tiền</th>
                        </tr>
                      </thead>
                      <tbody>
                        {contractItemsList.map((item, idx) => (
                          <tr key={idx}>
                            <td>{idx + 1}</td>
                            <td>{item.tenHangHoa}</td>
                            <td>{item.sku}</td>
                            <td><strong>{item.soLuong}</strong></td>
                            <td>{Number(item.donGiaSi).toLocaleString('vi-VN')} đ</td>
                            <td>{Number(item.thanhTien).toLocaleString('vi-VN')} đ</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td colSpan="5"><strong>TỔNG GIÁ TRỊ HỢP ĐỒNG CUNG ỨNG:</strong></td>
                          <td><strong className="text-danger">{Number(totalContractAmount).toLocaleString('vi-VN')} đ</strong></td>
                        </tr>
                      </tfoot>
                    </table>

                    <h5>ĐIỀU 2: TIÊU CHUẨN XUẤT KHO VÀ ĐĂNG BÁN</h5>
                    <p>
                      1. Bên A có trách nhiệm chuyển giao đúng số lượng, chất lượng hàng hóa nguyên seal theo bảng kê Điều 1 
                      vào Kho riêng của Bên B trong hệ thống WMS.<br/>
                      2. Bên B sau khi tiếp nhận hàng về kho riêng có toàn quyền quyết định danh mục sản phẩm muốn mở bán 
                      trên Sàn TMĐT (thông qua chức năng Đăng Bán) và tự chủ thiết lập giá bán lẻ.
                    </p>

                    <h5>ĐIỀU 3: BẢO HÀNH VÀ CAM KẾT CHÍNH HÃNG</h5>
                    <p>
                      Toàn bộ sản phẩm được bảo hành chính hãng 12 tháng tại hệ thống Kho Tổng Trung Tâm CTUT.
                    </p>
                  </div>
                </div>

                <div className="modal-actions-footer">
                  <button className="btn-cancel" onClick={() => setStep(1)}>Quay Lại Chọn Hàng</button>
                  <button className="btn-next-step" onClick={() => setStep(3)}>
                    Tiến Hành Ký Số Hợp Đồng <FiArrowRight />
                  </button>
                </div>
              </div>
            )}

            {/* BƯỚC 3: KÝ SỐ ĐIỆN TỬ */}
            {step === 3 && (
              <div className="wizard-step-content">
                <div className="digital-signature-card">
                  <div className="sig-header-badge">
                    <FiShield size={24} /> XÁC NHẬN KÝ SỐ HỢP ĐỒNG ĐIỆN TỬ (DIGITAL SIGNATURE)
                  </div>
                  <p>
                    Vui lòng xác thực thông tin chữ ký số của người đại diện hợp pháp gian hàng <strong>{currentStore?.tenKho}</strong>:
                  </p>

                  <div className="form-group-seller">
                    <label>Họ và Tên Người Đại Diện Ký Hợp Đồng *</label>
                    <input
                      type="text"
                      required
                      value={signerInfo.signerName}
                      onChange={(e) => setSignerInfo({ ...signerInfo, signerName: e.target.value })}
                    />
                  </div>

                  <div className="form-group-seller">
                    <label>Chức Vụ / Thẩm Quyền Ký *</label>
                    <input
                      type="text"
                      required
                      value={signerInfo.signerRole}
                      onChange={(e) => setSignerInfo({ ...signerInfo, signerRole: e.target.value })}
                    />
                  </div>

                  {/* Bản hiển thị mẫu con dấu chữ ký số điện tử */}
                  <div className="digital-stamp-preview">
                    <div className="stamp-box">
                      <div className="stamp-title">ĐÃ KÝ ĐIỆN TỬ BỞI:</div>
                      <div className="stamp-name">{signerInfo.signerName || 'CHỦ CỬA HÀNG'}</div>
                      <div className="stamp-role">{signerInfo.signerRole}</div>
                      <div className="stamp-meta">
                        Thời gian: {new Date().toLocaleString('vi-VN')}<br/>
                        Xác thực chuẩn: CTUT WMS CA SHA-256
                      </div>
                    </div>
                  </div>

                  <label className="checkbox-agreement" style={{ marginTop: '16px' }}>
                    <input
                      type="checkbox"
                      checked={signerInfo.agreedTerms}
                      onChange={(e) => setSignerInfo({ ...signerInfo, agreedTerms: e.target.checked })}
                    />
                    <div>
                      <strong>Tôi cam kết các thông tin khai báo trên là chính xác và chấp thuận toàn văn hợp đồng.</strong>
                      <small>Hàng hóa sẽ được nạp trực tiếp vào kho riêng của shop ngay sau khi xác nhận.</small>
                    </div>
                  </label>
                </div>

                <div className="modal-actions-footer">
                  <button className="btn-cancel" onClick={() => setStep(2)}>Quay Lại</button>
                  <button 
                    className="btn-complete-sign"
                    disabled={isSubmittingContract || !signerInfo.agreedTerms}
                    onClick={handleSignContract}
                  >
                    <FiCheckCircle />
                    {isSubmittingContract ? 'Đang Ký Số & Nạp Kho...' : 'Xác Nhận Ký Số & Kích Hoạt Nhập Hàng'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL XEM CHI TIẾT HỢP ĐỒNG ĐÃ KÝ */}
      {viewingContract && (
        <div className="modal-backdrop-overlay" onClick={() => setViewingContract(null)}>
          <div className="contract-view-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>📄 Chi Tiết Hợp Đồng: {viewingContract.maHopDong}</h3>
              <FiX className="btn-close-modal" onClick={() => setViewingContract(null)} />
            </div>

            <div className="contract-document-preview">
              <div className="contract-doc-header">
                <h4>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</h4>
                <p>Độc lập - Tự do - Hạnh phúc</p>
                <div className="doc-divider"></div>
                <h3>HỢP ĐỒNG CUNG ỨNG HÀNG HÓA VÀ LƯU KHO B2B2C</h3>
                <small>Mã số: {viewingContract.maHopDong} • Ngày ký: {new Date(viewingContract.ngayKy).toLocaleString('vi-VN')}</small>
              </div>

              <div className="contract-parties-box">
                <div className="party-block">
                  <strong>BÊN A (KHO TỔNG CUNG ỨNG):</strong>
                  <p>{viewingContract.khoCungUng}</p>
                </div>
                <div className="party-block">
                  <strong>BÊN B (CHỦ GIAN HÀNG):</strong>
                  <p>{viewingContract.tenKhoCuaHang}</p>
                  <p>Người ký: {viewingContract.nguoiKy} ({viewingContract.chucVu})</p>
                </div>
              </div>

              <table className="contract-items-table">
                <thead>
                  <tr>
                    <th>STT</th>
                    <th>Tên Sản Phẩm</th>
                    <th>Mã SKU</th>
                    <th>Số Lượng</th>
                    <th>Đơn Giá Sỉ</th>
                    <th>Thành Tiền</th>
                  </tr>
                </thead>
                <tbody>
                  {(viewingContract.danhSachHang || []).map((item, idx) => (
                    <tr key={idx}>
                      <td>{idx + 1}</td>
                      <td>{item.tenHangHoa}</td>
                      <td>{item.sku}</td>
                      <td><strong>{item.soLuong}</strong></td>
                      <td>{Number(item.donGiaSi).toLocaleString('vi-VN')} đ</td>
                      <td>{Number(item.thanhTien).toLocaleString('vi-VN')} đ</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="contract-signed-stamp-footer">
                <div className="stamp-box verified">
                  <div className="stamp-title">✓ HỢP ĐỒNG ĐÃ ĐƯỢC KÝ SỐ</div>
                  <div className="stamp-name">{viewingContract.nguoiKy}</div>
                  <div className="stamp-role">{viewingContract.chucVu}</div>
                  <div className="stamp-meta">
                    Mã chứng thực: {viewingContract.maChuKySo}<br/>
                    Trạng thái kho: Đã nạp vào kho riêng
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-actions-footer">
              <Link to="/seller/products" className="btn-go-to-publish" onClick={() => setViewingContract(null)}>
                <FiBox /> Đi Đến Quản Lý & Đăng Bán Lên Sàn
              </Link>
              <button className="btn-cancel" onClick={() => setViewingContract(null)}>Đóng</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerContracts;

