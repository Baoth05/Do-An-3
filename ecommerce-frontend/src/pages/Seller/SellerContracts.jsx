// src/pages/Seller/SellerContracts.jsx
import { useState, useEffect, useMemo } from 'react';
import { useOutletContext, Link, useLocation } from 'react-router-dom';
import { marketplaceService } from '../../services/marketplaceService';
import { 
  FiFileText, FiPlus, FiCheckCircle, FiShield, 
  FiPackage, FiTruck, FiBox, FiArrowRight, FiX, FiCheck, FiDownload,
  FiClock, FiSend, FiAlertCircle, FiCheckSquare, FiAlertTriangle
} from 'react-icons/fi';
import './SellerContracts.css';

const SellerContracts = () => {
  const { storeId, currentStore, currentSeller } = useOutletContext();
  const location = useLocation();

  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alertNotice, setAlertNotice] = useState(
    location.state?.justRegistered 
      ? `Chào mừng ${location.state?.storeName || 'Cửa hàng'}! Vui lòng gửi yêu cầu cung ứng đầu tiên để nhập hàng về kho.` 
      : ''
  );

  // Chế độ mô phỏng quyền (Dành cho Admin duyệt và Thủ kho lên đơn)
  const [simulatedRole, setSimulatedRole] = useState(() => {
    return currentSeller?.vaiTro === 'ADMIN' ? 'ADMIN' : 'SHOP';
  });

  // Modal tạo yêu cầu hợp đồng mới (2 bước: 1. Chọn hàng trong kho thật từ DB, 2. Xem văn bản & Gửi yêu cầu)
  const [modalOpen, setModalOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [centralWarehouse, setCentralWarehouse] = useState(null); // Kho Tổng duy nhất trong CSDL
  const [loadingWarehouse, setLoadingWarehouse] = useState(false);
  const [masterProducts, setMasterProducts] = useState([]);
  const [productSearch, setProductSearch] = useState('');
  const [selectedItems, setSelectedItems] = useState({}); // { [sanPhamId]: quantity }
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Modal Ký số điện tử dành cho hợp đồng ở trạng thái CHO_SHOP_KY
  const [signingContract, setSigningContract] = useState(null);
  const [signerInfo, setSignerInfo] = useState({
    signerName: currentSeller?.hoTen || currentSeller?.taiKhoan || '',
    signerRole: 'Chủ Cửa Hàng / Đại Diện Pháp Luật',
    signaturePin: '123456',
    agreedTerms: true,
  });
  const [isSubmittingSign, setIsSubmittingSign] = useState(false);

  // Modal xem chi tiết hợp đồng
  const [viewingContract, setViewingContract] = useState(null);

  // Modal từ chối
  const [rejectingContract, setRejectingContract] = useState(null);
  const [rejectReason, setRejectReason] = useState('Kho tổng tạm thời hết hàng hoặc vượt hạn mức cung ứng.');

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
    const handleUpdate = () => {
      fetchContracts();
    };
    window.addEventListener('supply-contracts-updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('supply-contracts-updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [storeId]);

  // Nạp thông tin Kho Tổng Duy Nhất từ CSDL
  const fetchSingleCentralWarehouse = async () => {
    setLoadingWarehouse(true);
    try {
      const wh = await marketplaceService.getSingleCentralWarehouse();
      setCentralWarehouse(wh);
      const targetId = wh?.id || 1;
      await loadWarehouseInventory(targetId);
    } catch (e) {
      console.warn('Lỗi nạp kho tổng từ CSDL:', e);
      await loadWarehouseInventory(1);
    } finally {
      setLoadingWarehouse(false);
    }
  };

  useEffect(() => {
    fetchSingleCentralWarehouse();
  }, []);

  useEffect(() => {
    if (currentSeller && (!signerInfo.signerName || signerInfo.signerName === 'Trần Minh Quân')) {
      setSignerInfo((prev) => ({
        ...prev,
        signerName: currentSeller.hoTen || currentSeller.taiKhoan || '',
      }));
    }
  }, [currentSeller]);

  // Tải danh sách sản phẩm THẬT trong kho tổng từ CSDL (Không dùng dữ liệu giả)
  const loadWarehouseInventory = async (whId) => {
    setLoadingProducts(true);
    try {
      const inventoryList = await marketplaceService.getWarehouseInventory(whId);
      const realProds = (inventoryList || []).map((p) => {
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
          danhMuc: p.danhMuc || '',
          hinhAnh: p.hinhAnh || '',
        };
      });
      setMasterProducts(realProds);
    } catch (err) {
      console.error('Lỗi tải sản phẩm trong kho từ CSDL:', err);
      setMasterProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  };

  // Mở modal tạo yêu cầu hợp đồng mới
  const handleOpenCreateContract = async () => {
    setStep(1);
    setSelectedItems({});
    setProductSearch('');
    setModalOpen(true);
    await fetchSingleCentralWarehouse();
  };

  // Khi đổi kho cung ứng
  const handleCentralWarehouseChange = async (newWhId) => {
    const idStr = String(newWhId);
    setSelectedCentralId(idStr);
    setSelectedItems({});
    await loadWarehouseInventory(idStr);
  };

  // Thay đổi số lượng sản phẩm nhập (Giới hạn theo tồn kho thực tế của kho)
  const handleItemQtyChange = (prodId, qty, maxStock) => {
    const val = parseInt(qty, 10);
    if (isNaN(val) || val <= 0) {
      const next = { ...selectedItems };
      delete next[prodId];
      setSelectedItems(next);
    } else {
      const boundedVal = Math.min(val, maxStock > 0 ? maxStock : val);
      setSelectedItems((prev) => ({
        ...prev,
        [prodId]: boundedVal,
      }));
    }
  };

  // Tính tổng giá trị hợp đồng
  const contractItemsList = Object.keys(selectedItems).map((id) => {
    const prod = masterProducts.find((p) => Number(p.id) === Number(id) || Number(p.sanPhamId) === Number(id));
    const qty = selectedItems[id];
    const wholesalePrice = prod?.giaNhap || (prod?.giaBan ? Math.round(prod.giaBan * 0.9) : 1000000); // Giá sỉ B2B chiết khấu 10%
    return {
      sanPhamId: Number(id),
      sku: prod?.sku || `SP00${id}`,
      tenHangHoa: prod?.tenHangHoa || prod?.tenSanPham || 'Sản phẩm',
      donViTinh: prod?.donViTinh || 'Cái',
      soLuong: qty,
      donGiaSi: wholesalePrice,
      thanhTien: wholesalePrice * qty,
      hinhAnh: prod?.hinhAnh || '',
      danhMuc: prod?.danhMuc || 'Thiết bị công nghệ',
    };
  });

  const totalContractAmount = contractItemsList.reduce((sum, i) => sum + i.thanhTien, 0);
  const totalItemCount = contractItemsList.reduce((sum, i) => sum + i.soLuong, 0);

  // Bộ lọc tìm kiếm sản phẩm trong kho tổng
  const filteredMasterProducts = useMemo(() => {
    return masterProducts.filter((p) => {
      if (!productSearch.trim()) return true;
      const q = productSearch.toLowerCase().trim();
      return (p.tenHangHoa || '').toLowerCase().includes(q) ||
             (p.sku || '').toLowerCase().includes(q) ||
             (p.danhMuc || '').toLowerCase().includes(q);
    });
  }, [masterProducts, productSearch]);

  // BƯỚC 1 CỦA SHOP: Gửi Yêu Cầu Hợp Đồng Nhập Hàng Đến Admin (Chờ duyệt vòng 1)
  const handleSubmitContractRequest = async () => {
    if (contractItemsList.length === 0) {
      alert('Vui lòng chọn ít nhất 1 sản phẩm có trong kho để yêu cầu nhập hàng!');
      return;
    }

    try {
      const contractCode = `HDCU-${new Date().getFullYear()}/${currentStore?.maKho || 'STORE'}-${Math.floor(1000 + Math.random() * 9000)}`;

      const newContract = {
        id: Date.now(),
        maHopDong: contractCode,
        ngayTao: new Date().toISOString(),
        storeId: Number(storeId),
        tenKhoCuaHang: currentStore?.tenKho || 'Gian Hàng Của Bạn',
        maKhoCuaHang: currentStore?.maKho || 'STORE',
        khoTongId: centralWarehouse?.id || 1,
        khoCungUng: centralWarehouse?.tenKho || 'Kho Tổng Trung Tâm (Bên A)',
        diaChiKhoCungUng: centralWarehouse?.diaChi || '256 Nguyễn Văn Cừ, Cần Thơ',
        soDienThoaiKhoCungUng: centralWarehouse?.soDienThoai || '1900 6868',
        tongTien: totalContractAmount,
        soLuongMatHang: contractItemsList.length,
        tongSoLuongHang: totalItemCount,
        danhSachHang: contractItemsList,
        nguoiYeuCau: currentSeller?.hoTen || currentSeller?.taiKhoan || 'Chủ Shop',
        chucVuYeuCau: 'Chủ Cửa Hàng / Đại Diện Gian Hàng',
      };

      await marketplaceService.createSupplyContractRequest(newContract);

      setAlertNotice(`🎉 Đã gửi yêu cầu hợp đồng ${contractCode} đến Admin! Chờ Admin duyệt yêu cầu trước khi ký.`);
      setModalOpen(false);
      await fetchContracts();
    } catch (err) {
      alert('Lỗi gửi yêu cầu hợp đồng: ' + err.message);
    }
  };

  // BƯỚC 2: Admin Duyệt Yêu Cầu Cung Ứng (Vòng 1) -> Cho phép Shop ký số
  const handleAdminApproveRound1 = async (contractId, code) => {
    try {
      await marketplaceService.adminApproveContractRequest(contractId, {
        name: currentSeller?.hoTen || 'Quản Trị Viên (Admin)',
        note: 'Đã thẩm định yêu cầu, phê duyệt cho phép chủ cửa hàng tiến hành ký số hợp đồng.',
      });
      setAlertNotice(`✅ [Admin] Đã duyệt yêu cầu hợp đồng ${code}! Hợp đồng chuyển sang trạng thái chờ Shop ký số.`);
      await fetchContracts();
    } catch (e) {
      alert('Lỗi duyệt: ' + e.message);
    }
  };

  // BƯỚC 3 CỦA SHOP: Ký Số Điện Tử Hợp Đồng
  const handleOpenSigningModal = (contract) => {
    setSigningContract(contract);
    setSignerInfo({
      signerName: currentSeller?.hoTen || currentSeller?.taiKhoan || '',
      signerRole: 'Chủ Cửa Hàng / Đại Diện Pháp Luật',
      signaturePin: '123456',
      agreedTerms: true,
    });
  };

  const handleExecuteSignContract = async () => {
    if (!signerInfo.signerName.trim()) {
      alert('Vui lòng nhập họ tên người đại diện ký hợp đồng!');
      return;
    }
    if (!signerInfo.agreedTerms) {
      alert('Vui lòng chấp thuận các điều khoản hợp đồng!');
      return;
    }

    setIsSubmittingSign(true);
    try {
      await marketplaceService.shopSignContract(signingContract.id, signerInfo);
      setAlertNotice(`🎉 Ký số thành công hợp đồng ${signingContract.maHopDong}! Hợp đồng đang chờ Admin duyệt chuyển kho.`);
      setSigningContract(null);
      await fetchContracts();
    } catch (e) {
      alert('Lỗi ký số: ' + e.message);
    } finally {
      setIsSubmittingSign(false);
    }
  };

  // BƯỚC 4: Admin Duyệt Lần 2 -> Chuyển Qua Kho Tổng Lên Đơn
  const handleAdminApproveRound2 = async (contractId, code) => {
    try {
      await marketplaceService.adminApproveAndTransferToWarehouse(contractId, {
        name: currentSeller?.hoTen || 'Quản Trị Viên (Admin)',
        note: 'Hợp đồng đã có chữ ký số hợp lệ của chủ shop. Phê duyệt chuyển lệnh xuất kho sang Kho Tổng.',
      });
      setAlertNotice(`🏢 [Admin] Đã duyệt hợp đồng ${code} và chuyển lệnh sang Kho Tổng lên đơn.`);
      await fetchContracts();
    } catch (e) {
      alert('Lỗi duyệt chuyển kho: ' + e.message);
    }
  };

  // BƯỚC 5: Kho Tổng Lên Đơn Xuất Kho & Bàn Giao Vận Chuyển
  const handleWarehouseDispatchOrder = async (contractId, code) => {
    try {
      await marketplaceService.warehouseDispatchContractOrder(contractId, {
        name: 'Thủ Kho Trưởng Kho Tổng CTUT',
        shippingProvider: 'CTUT Express Logistics',
      });
      setAlertNotice(`📦 [Kho Tổng] Đã lên đơn xuất kho cho hợp đồng ${code}! Hàng đang được vận chuyển sang kho shop.`);
      await fetchContracts();
    } catch (e) {
      alert('Lỗi lên đơn xuất kho: ' + e.message);
    }
  };

  // BƯỚC 6 CỦA SHOP: Xác Nhận Đã Nhận Hàng & Nhập Kho Riêng
  const handleCompleteDelivery = async (contractId, code) => {
    if (!window.confirm(`Xác nhận hàng của hợp đồng [${code}] đã giao tới kho riêng của bạn và hoàn tất nhập kho?`)) {
      return;
    }
    try {
      await marketplaceService.completeContractDelivery(contractId);
      setAlertNotice(`🎉 Nhận hàng thành công! Hàng hóa của hợp đồng ${code} đã chính thức được nạp vào kho riêng.`);
      await fetchContracts();
    } catch (e) {
      alert('Lỗi nhận hàng: ' + e.message);
    }
  };

  // Từ chối hợp đồng
  const handleRejectContract = async () => {
    if (!rejectingContract) return;
    try {
      await marketplaceService.rejectSupplyContract(rejectingContract.id, rejectReason, {
        name: currentSeller?.hoTen || 'Quản Trị Viên',
      });
      setAlertNotice(`❌ Đã từ chối hợp đồng ${rejectingContract.maHopDong}.`);
      setRejectingContract(null);
      await fetchContracts();
    } catch (e) {
      alert('Lỗi từ chối: ' + e.message);
    }
  };

  // Helper hiển thị Huy hiệu trạng thái 5 bước
  const renderStatusBadge = (status) => {
    switch (status) {
      case 'CHO_ADMIN_DUYET':
        return <span className="badge-status-pending-admin"><FiClock /> 1. Chờ Admin Duyệt Yêu Cầu</span>;
      case 'CHO_SHOP_KY':
        return <span className="badge-status-pending-sign"><FiSend /> 2. Chờ Shop Ký Số</span>;
      case 'DA_KY_CHO_DUYET_KHO':
        return <span className="badge-status-pending-warehouse"><FiShield /> 3. Đã Ký - Chờ Duyệt Chuyển Kho</span>;
      case 'CHUYEN_QUA_KHO':
        return <span className="badge-status-warehouse-transfer"><FiBox /> 4. Đã Chuyển Kho - Chờ Lên Đơn</span>;
      case 'DANG_GIAO_HANG':
        return <span className="badge-status-shipping"><FiTruck /> 5. Đang Vận Chuyển Sang Shop</span>;
      case 'HOAN_THANH':
        return <span className="badge-status-completed"><FiCheckCircle /> Hoàn Thành & Đã Nhập Kho</span>;
      case 'TU_CHOI':
        return <span className="badge-status-rejected"><FiX /> Yêu Cầu Bị Từ Chối</span>;
      default:
        return <span className="badge-contract-active"><FiCheckCircle /> Đã Duyệt</span>;
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

      {/* Thanh Demo Chuyển Quyền: Chủ Shop / Admin Duyệt / Kho Tổng Lên Đơn */}
      <div className="contract-quick-role-bar">
        <div className="role-bar-title">
          <span className="pill-tag">QUY TRÌNH 5 BƯỚC</span>
          <span>Mô Phỏng Phân Quyền Thao Tác:</span>
        </div>
        <div className="role-bar-actions">
          <button
            type="button"
            className={`role-toggle-btn ${simulatedRole === 'SHOP' ? 'active' : ''}`}
            onClick={() => setSimulatedRole('SHOP')}
          >
            🏪 Vai Trò: Chủ Shop
          </button>
          <button
            type="button"
            className={`role-toggle-btn ${simulatedRole === 'ADMIN' ? 'active' : ''}`}
            onClick={() => setSimulatedRole('ADMIN')}
          >
            👑 Vai Trò: Admin Duyệt (Vòng 1 & 2)
          </button>
          <button
            type="button"
            className={`role-toggle-btn ${simulatedRole === 'WAREHOUSE' ? 'active' : ''}`}
            onClick={() => setSimulatedRole('WAREHOUSE')}
          >
            🏢 Vai Trò: Thủ Kho Lên Đơn
          </button>
        </div>
      </div>

      {/* Header trang */}
      <div className="seller-page-header-flex">
        <div>
          <h2>Hợp Đồng Cung Ứng & Nhập Hàng Chuỗi Cung Ứng B2B2C</h2>
          <p>
            Chủ cửa hàng gửi yêu cầu nhập sản phẩm <strong>thực tế có sẵn trong Kho Tổng</strong>. Yêu cầu được 
            <strong> Admin duyệt vòng 1</strong> mới được ký số, sau đó <strong>Admin duyệt vòng 2</strong> để chuyển lệnh 
            sang <strong>Kho Tổng lên đơn xuất kho</strong> và giao tới kho riêng của shop.
          </p>
        </div>

        <button className="btn-create-contract" onClick={handleOpenCreateContract}>
          <FiPlus /> Gửi Yêu Cầu Cung Ứng Mới
        </button>
      </div>

      {/* Thẻ 5 bước quy trình chuẩn hóa */}
      <div className="contract-workflow-steps">
        <div className="wf-step">
          <div className="wf-step-num">1</div>
          <div className="wf-step-text">
            <strong>Gửi Yêu Cầu</strong>
            <span>Chọn hàng thật trong kho tổng</span>
          </div>
        </div>
        <div className="wf-arrow">→</div>
        <div className="wf-step">
          <div className="wf-step-num">2</div>
          <div className="wf-step-text">
            <strong>Admin Duyệt Yêu Cầu</strong>
            <span>Xem xét định mức & mở quyền ký</span>
          </div>
        </div>
        <div className="wf-arrow">→</div>
        <div className="wf-step">
          <div className="wf-step-num">3</div>
          <div className="wf-step-text">
            <strong>Shop Ký Số</strong>
            <span>Ký hợp đồng điện tử với mã PIN</span>
          </div>
        </div>
        <div className="wf-arrow">→</div>
        <div className="wf-step">
          <div className="wf-step-num">4</div>
          <div className="wf-step-text">
            <strong>Admin Duyệt Lần 2</strong>
            <span>Chuyển lệnh sang Kho Tổng</span>
          </div>
        </div>
        <div className="wf-arrow">→</div>
        <div className="wf-step">
          <div className="wf-step-num">5</div>
          <div className="wf-step-text">
            <strong>Kho Lên Đơn & Giao</strong>
            <span>Tạo phiếu xuất và nạp vào shop</span>
          </div>
        </div>
      </div>

      {/* Danh sách hợp đồng */}
      <div className="contracts-table-card">
        <div className="contracts-card-header">
          <h3>Danh Sách Hợp Đồng Cung Ứng Của Gian Hàng ({contracts.length})</h3>
        </div>

        {loading ? (
          <div className="seller-loading-state">
            <div className="spinner"></div>
            <p>Đang tải danh sách hợp đồng...</p>
          </div>
        ) : contracts.length === 0 ? (
          <div className="seller-empty-state">
            <FiFileText size={48} className="empty-icon" />
            <h3>Gian hàng chưa có hợp đồng cung ứng nào</h3>
            <p>
              Kho riêng của bạn hiện chưa có sản phẩm. Hãy gửi yêu cầu cung ứng từ Kho Tổng để nhập lô hàng
              đầu tiên và tiến hành đăng bán trên Sàn!
            </p>
            <button className="btn-create-contract" onClick={handleOpenCreateContract}>
              <FiPlus /> Gửi Yêu Cầu Nhập Hàng Đầu Tiên
            </button>
          </div>
        ) : (
          <table className="contracts-data-table">
            <thead>
              <tr>
                <th>Mã Hợp Đồng</th>
                <th>Kho Cung Ứng (Bên A)</th>
                <th>Số Lượng Hàng</th>
                <th>Tổng Giá Trị</th>
                <th>Trạng Thái Quy Trình</th>
                <th>Hành Động Nghiệp Vụ</th>
                <th>Chi Tiết</th>
              </tr>
            </thead>
            <tbody>
              {contracts.map((c) => (
                <tr key={c.id}>
                  <td>
                    <strong className="contract-code-tag">{c.maHopDong}</strong>
                    <small className="contract-sub-sig">
                      Tạo lúc: {new Date(c.ngayTao || c.ngayKy).toLocaleDateString('vi-VN')}
                    </small>
                  </td>
                  <td>
                    <strong>{c.khoCungUng}</strong>
                  </td>
                  <td>
                    <strong>{c.tongSoLuongHang}</strong> sản phẩm ({c.soLuongMatHang} mã)
                  </td>
                  <td>
                    <strong className="contract-amount">{Number(c.tongTien).toLocaleString('vi-VN')} đ</strong>
                  </td>
                  <td>
                    {renderStatusBadge(c.trangThai)}
                    {c.thongTinXuatKho?.maPhieuXuat && (
                      <small style={{ display: 'block', color: '#0284c7', marginTop: '4px', fontSize: '11px' }}>
                        📦 Phiếu xuất: {c.thongTinXuatKho.maPhieuXuat}
                      </small>
                    )}
                    {c.lyDoTuChoi && (
                      <small style={{ display: 'block', color: '#dc2626', marginTop: '2px', fontSize: '11px' }}>
                        Lý do: {c.lyDoTuChoi}
                      </small>
                    )}
                  </td>
                  <td>
                    <div className="contract-actions-cell">
                      {/* BƯỚC 2: Admin Duyệt Vòng 1 */}
                      {c.trangThai === 'CHO_ADMIN_DUYET' && (
                        <>
                          {(simulatedRole === 'ADMIN' || currentSeller?.vaiTro === 'ADMIN') ? (
                            <>
                              <button
                                type="button"
                                className="btn-contract-action-success"
                                onClick={() => handleAdminApproveRound1(c.id, c.maHopDong)}
                              >
                                <FiCheck /> Duyệt Yêu Cầu (Vòng 1)
                              </button>
                              <button
                                type="button"
                                className="btn-contract-action-reject"
                                onClick={() => setRejectingContract(c)}
                              >
                                <FiX /> Từ Chối
                              </button>
                            </>
                          ) : (
                            <span style={{ fontSize: '12px', color: '#b45309' }}>
                              ⏳ Đang chờ Admin duyệt yêu cầu
                            </span>
                          )}
                        </>
                      )}

                      {/* BƯỚC 3: Shop Ký Số */}
                      {c.trangThai === 'CHO_SHOP_KY' && (
                        <button
                          type="button"
                          className="btn-contract-action-primary"
                          onClick={() => handleOpenSigningModal(c)}
                        >
                          <FiShield /> Ký Số Hợp Đồng Này
                        </button>
                      )}

                      {/* BƯỚC 4: Admin Duyệt Vòng 2 */}
                      {c.trangThai === 'DA_KY_CHO_DUYET_KHO' && (
                        <>
                          {(simulatedRole === 'ADMIN' || currentSeller?.vaiTro === 'ADMIN') ? (
                            <>
                              <button
                                type="button"
                                className="btn-contract-action-primary"
                                onClick={() => handleAdminApproveRound2(c.id, c.maHopDong)}
                              >
                                <FiBox /> Duyệt & Chuyển Sang Kho Tổng
                              </button>
                              <button
                                type="button"
                                className="btn-contract-action-reject"
                                onClick={() => setRejectingContract(c)}
                              >
                                <FiX /> Từ Chối
                              </button>
                            </>
                          ) : (
                            <span style={{ fontSize: '12px', color: '#6d28d9' }}>
                              📜 Đã ký số - Chờ Admin chuyển kho
                            </span>
                          )}
                        </>
                      )}

                      {/* BƯỚC 5: Kho Tổng Lên Đơn */}
                      {c.trangThai === 'CHUYEN_QUA_KHO' && (
                        <>
                          {(simulatedRole === 'WAREHOUSE' || simulatedRole === 'ADMIN' || currentSeller?.vaiTro === 'ADMIN') ? (
                            <button
                              type="button"
                              className="btn-contract-action-amber"
                              onClick={() => handleWarehouseDispatchOrder(c.id, c.maHopDong)}
                            >
                              <FiTruck /> Lên Đơn Xuất Kho & Giao Hàng
                            </button>
                          ) : (
                            <span style={{ fontSize: '12px', color: '#4338ca' }}>
                              🏢 Kho tổng đang chuẩn bị soạn hàng
                            </span>
                          )}
                        </>
                      )}

                      {/* BƯỚC 6: Nhận Hàng & Nhập Kho */}
                      {c.trangThai === 'DANG_GIAO_HANG' && (
                        <button
                          type="button"
                          className="btn-contract-action-success"
                          onClick={() => handleCompleteDelivery(c.id, c.maHopDong)}
                        >
                          <FiPackage /> Xác Nhận Đã Nhận & Nhập Kho
                        </button>
                      )}

                      {c.trangThai === 'HOAN_THANH' && (
                        <span style={{ fontSize: '12px', color: '#059669', fontWeight: '700' }}>
                          ✓ Hàng đã có trong kho shop
                        </span>
                      )}

                      {c.trangThai === 'TU_CHOI' && (
                        <span style={{ fontSize: '12px', color: '#dc2626' }}>
                          Đã hủy yêu cầu
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <button 
                      className="btn-view-contract-doc"
                      onClick={() => setViewingContract(c)}
                    >
                      <FiFileText /> Xem Hợp Đồng
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* MODAL BƯỚC 1: TẠO VÀ GỬI YÊU CẦU CUNG ỨNG (CHỌN HÀNG THẬT TRONG KHO TỔNG) */}
      {modalOpen && (
        <div className="modal-backdrop-overlay" onClick={() => setModalOpen(false)}>
          <div className="contract-wizard-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3>📝 Gửi Yêu Cầu Hợp Đồng Cung Ứng & Nhập Kho</h3>
                <span className="wizard-step-tag">
                  Bước {step} / 2: {step === 1 ? 'Chọn Sản Phẩm Thực Tế Có Sẵn Trong Kho' : 'Xem Văn Bản & Gửi Yêu Cầu Đến Admin'}
                </span>
              </div>
              <FiX className="btn-close-modal" onClick={() => setModalOpen(false)} />
            </div>

            {/* BƯỚC 1: CHỌN SẢN PHẨM THẬT TRONG KHO TỔNG TỪ CSDL */}
            {step === 1 && (
              <div className="wizard-step-content">
                <div className="form-group-seller">
                  <label style={{ fontWeight: '600', marginBottom: '8px', display: 'block' }}>
                    Kho Cung Ứng / Kho Tổng Trung Tâm (Bên A):
                  </label>
                  {loadingWarehouse ? (
                    <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px', color: '#64748b', fontSize: '13px' }}>
                      <div className="spinner" style={{ display: 'inline-block', width: '14px', height: '14px', marginRight: '8px', verticalAlign: 'middle' }}></div>
                      Đang lấy thông tin Kho Tổng từ CSDL...
                    </div>
                  ) : centralWarehouse ? (
                    <div style={{ padding: '12px 16px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <strong style={{ fontSize: '15px', color: '#166534' }}>
                          🏢 {centralWarehouse.tenKho || 'Kho Tổng Trung Tâm'}
                        </strong>
                        <span style={{ fontSize: '11px', background: '#dcfce7', color: '#15803d', padding: '2px 8px', borderRadius: '12px', fontWeight: '600' }}>
                          Kho Tổng Duy Nhất Hệ Thống (Bên A)
                        </span>
                      </div>
                      <div style={{ fontSize: '12.5px', color: '#374151' }}>
                        <span>Mã kho: <strong>{centralWarehouse.maKho || 'KHO-TONG'}</strong></span> • 
                        <span> Địa chỉ: <strong>{centralWarehouse.diaChi || 'Cần Thơ'}</strong></span>
                        {centralWarehouse.soDienThoai && <span> • Hotline: <strong>{centralWarehouse.soDienThoai}</strong></span>}
                      </div>
                    </div>
                  ) : (
                    <div style={{ padding: '12px 16px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', color: '#1e40af', fontSize: '13px' }}>
                      🏢 <strong>Kho Tổng Trung Tâm (Bên A)</strong>
                      <span style={{ display: 'block', fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                        * Đang kết nối với Kho Tổng duy nhất trong CSDL
                      </span>
                    </div>
                  )}
                </div>

                <div className="catalog-selection-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, flexWrap: 'wrap' }}>
                    <h4>Sản Phẩm Trong Kho Tổng CSDL ({filteredMasterProducts.length}):</h4>
                    <input 
                      type="text" 
                      placeholder="🔍 Lọc theo tên sản phẩm, mã SKU..." 
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      style={{ padding: '6px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', width: '260px' }}
                    />
                  </div>
                  <span className="selected-summary-pill">
                    Đã chọn: <strong>{totalItemCount} sản phẩm</strong> ({Number(totalContractAmount).toLocaleString('vi-VN')} đ)
                  </span>
                </div>

                {loadingProducts ? (
                  <div style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>
                    <div className="spinner" style={{ margin: '0 auto 10px auto' }}></div>
                    Đang nạp tồn kho thực tế từ CSDL...
                  </div>
                ) : filteredMasterProducts.length === 0 ? (
                  <div style={{ padding: '30px', textAlign: 'center', background: '#fffbeb', borderRadius: '8px', color: '#b45309', border: '1px solid #fef3c7' }}>
                    <FiAlertTriangle size={32} style={{ marginBottom: '8px' }} />
                    <p style={{ margin: 0, fontWeight: '700' }}>Kho tổng trong CSDL hiện chưa có sản phẩm sẵn có để cung ứng.</p>
                    <small>Vui lòng tiến hành nhập hàng vào Kho Tổng trên phân hệ WMS trước khi tạo hợp đồng.</small>
                  </div>
                ) : (
                  <div className="import-products-picker-list">
                    {filteredMasterProducts.map((p) => {
                      const wholesalePrice = p.giaNhap || (p.giaBan ? Math.round(p.giaBan * 0.9) : 0);
                      const selectedQty = selectedItems[p.id] || 0;
                      const isOutOfStock = p.soLuongTonKho <= 0;

                      return (
                        <div key={p.id} className={`picker-item-card ${selectedQty > 0 ? 'selected' : ''}`}>
                          <div className="p-card-left" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            {p.hinhAnh ? (
                              <img 
                                src={p.hinhAnh} 
                                alt={p.tenHangHoa} 
                                style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #e2e8f0', flexShrink: 0 }} 
                              />
                            ) : (
                              <div style={{ width: '48px', height: '48px', background: '#f1f5f9', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <FiBox size={20} color="#64748b" />
                              </div>
                            )}
                            <div>
                              <strong style={{ fontSize: '14px', display: 'block' }}>{p.tenHangHoa}</strong>
                              <div className="p-meta-sub">
                                <span>Mã SKU: <strong>{p.sku}</strong></span>
                                {p.danhMuc && <span> • Danh mục: <em>{p.danhMuc}</em></span>}
                                {wholesalePrice > 0 && (
                                  <span> • Giá sỉ B2B: <strong>{Number(wholesalePrice).toLocaleString('vi-VN')} đ</strong></span>
                                )}
                                {isOutOfStock ? (
                                  <span className="stock-out-tag">⚠️ Hết hàng trong kho tổng</span>
                                ) : (
                                  <span className="stock-available-tag">✓ Có sẵn trong kho: {p.soLuongTonKho} {p.donViTinh}</span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="p-card-right">
                            <label>Số lượng nhập:</label>
                            <div className="qty-input-group">
                              <button 
                                type="button" 
                                disabled={isOutOfStock || selectedQty <= 0}
                                onClick={() => handleItemQtyChange(p.id, Math.max(0, selectedQty - 1), p.soLuongTonKho)}
                              >
                                -
                              </button>
                              <input
                                type="number"
                                min="0"
                                max={p.soLuongTonKho}
                                disabled={isOutOfStock}
                                value={selectedQty}
                                onChange={(e) => handleItemQtyChange(p.id, e.target.value, p.soLuongTonKho)}
                              />
                              <button 
                                type="button" 
                                disabled={isOutOfStock || selectedQty >= p.soLuongTonKho}
                                onClick={() => handleItemQtyChange(p.id, selectedQty + 1, p.soLuongTonKho)}
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="modal-actions-footer">
                  <button className="btn-cancel" onClick={() => setModalOpen(false)}>Hủy</button>
                  <button 
                    className="btn-next-step"
                    disabled={totalItemCount === 0}
                    onClick={() => setStep(2)}
                  >
                    Tiếp Tục: Soạn Yêu Cầu Hợp Đồng ({totalItemCount} sản phẩm) <FiArrowRight />
                  </button>
                </div>
              </div>
            )}

            {/* BƯỚC 2: XEM VĂN BẢN HỢP ĐỒNG & GỬI YÊU CẦU ĐẾN ADMIN */}
            {step === 2 && (
              <div className="wizard-step-content">
                <div className="contract-document-preview">
                  <div className="contract-doc-header">
                    <h4>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</h4>
                    <p>Độc lập - Tự do - Hạnh phúc</p>
                    <div className="doc-divider"></div>
                    <h3>YÊU CẦU KÝ HỢP ĐỒNG CUNG ỨNG HÀNG HÓA B2B2C</h3>
                    <small>Dự thảo hợp đồng nhập hàng từ Kho Tổng vào Kho Cửa Hàng</small>
                  </div>

                  <div className="contract-parties-box">
                    <div className="party-block">
                      <strong>BÊN CUNG ỨNG (KHO TỔNG - BÊN A):</strong>
                      <p>{centralWarehouse?.tenKho || 'Kho Tổng Trung Tâm'}</p>
                      <p>Địa chỉ: {centralWarehouse?.diaChi || 'Cần Thơ'}</p>
                      {centralWarehouse?.soDienThoai && <p>Hotline: {centralWarehouse.soDienThoai}</p>}
                    </div>

                    <div className="party-block">
                      <strong>BÊN NHẬN HÀNG (CHỦ GIAN HÀNG - BÊN B):</strong>
                      <p>Cửa hàng: <strong>{currentStore?.tenKho || 'Gian Hàng Bán Lẻ'}</strong></p>
                      <p>Mã kho riêng: <strong>{currentStore?.maKho || 'STORE-RETAIL'}</strong></p>
                      <p>Người yêu cầu: {currentSeller?.hoTen || currentSeller?.taiKhoan}</p>
                    </div>
                  </div>

                  <div className="contract-terms-text">
                    <h5>ĐIỀU 1: DANH MỤC SẢN PHẨM YÊU CẦU NHẬP TỪ KHO TỔNG</h5>
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
                            <td><strong>{item.soLuong}</strong> {item.donViTinh}</td>
                            <td>{Number(item.donGiaSi).toLocaleString('vi-VN')} đ</td>
                            <td>{Number(item.thanhTien).toLocaleString('vi-VN')} đ</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td colSpan="5"><strong>TỔNG GIÁ TRỊ YÊU CẦU CUNG ỨNG:</strong></td>
                          <td><strong className="text-danger">{Number(totalContractAmount).toLocaleString('vi-VN')} đ</strong></td>
                        </tr>
                      </tfoot>
                    </table>

                    <div style={{ background: '#f8fafc', padding: '12px', borderLeft: '4px solid #2563eb', fontSize: '13px', margin: '14px 0' }}>
                      <strong>📌 Quy định luồng phê duyệt & ký kết hợp đồng:</strong>
                      <ol style={{ margin: '6px 0 0 18px', padding: 0 }}>
                        <li>Yêu cầu này sẽ được gửi đến <strong>Trang Quản Trị (Admin)</strong> để thẩm định hạn mức.</li>
                        <li>Sau khi <strong>Admin phê duyệt yêu cầu (Vòng 1)</strong>, chủ shop mới tiến hành <strong>Ký số điện tử</strong>.</li>
                        <li>Hợp đồng đã ký sẽ được <strong>Admin duyệt chuyển kho (Vòng 2)</strong> để chuyển sang <strong>Kho Tổng lên đơn</strong> và giao hàng.</li>
                      </ol>
                    </div>
                  </div>
                </div>

                <div className="modal-actions-footer">
                  <button className="btn-cancel" onClick={() => setStep(1)}>Quay Lại Chọn Hàng</button>
                  <button className="btn-next-step" onClick={handleSubmitContractRequest}>
                    <FiSend /> Gửi Yêu Cầu Đến Admin Để Phê Duyệt
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL KÝ SỐ ĐIỆN TỬ (CHỈ MỞ KHI ADMIN ĐÃ DUYỆT YÊU CẦU) */}
      {signingContract && (
        <div className="modal-backdrop-overlay" onClick={() => setSigningContract(null)}>
          <div className="contract-wizard-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>✍️ Ký Số Điện Tử Hợp Đồng Cung Ứng: {signingContract.maHopDong}</h3>
              <FiX className="btn-close-modal" onClick={() => setSigningContract(null)} />
            </div>

            <div className="wizard-step-content">
              <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', color: '#065f46', fontSize: '13px' }}>
                <FiCheckCircle style={{ marginRight: '6px' }} />
                <strong>Yêu cầu hợp đồng đã được Admin phê duyệt (Vòng 1)!</strong> Vui lòng ký số điện tử để xác nhận cam kết hợp đồng.
              </div>

              <div className="digital-signature-card">
                <div className="sig-header-badge">
                  <FiShield size={22} /> XÁC NHẬN CHỮ KÝ SỐ ĐIỆN TỬ (DIGITAL SIGNATURE)
                </div>

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

                <div className="form-group-seller">
                  <label>Mã PIN Chứng Thư Số Xác Thực *</label>
                  <input
                    type="password"
                    required
                    value={signerInfo.signaturePin}
                    onChange={(e) => setSignerInfo({ ...signerInfo, signaturePin: e.target.value })}
                  />
                  <small style={{ color: '#64748b' }}>Mã PIN xác thực chuẩn demo: 123456</small>
                </div>

                {/* Mẫu con dấu chữ ký số điện tử */}
                <div className="digital-stamp-preview">
                  <div className="stamp-box">
                    <div className="stamp-title">ĐÃ KÝ ĐIỆN TỬ BỞI:</div>
                    <div className="stamp-name">{signerInfo.signerName || 'CHỦ CỬA HÀNG'}</div>
                    <div className="stamp-role">{signerInfo.signerRole}</div>
                    <div className="stamp-meta">
                      Thời gian ký: {new Date().toLocaleString('vi-VN')}<br/>
                      Thuật toán: CTUT CA RSA-SHA256
                    </div>
                  </div>
                </div>

                <label className="checkbox-agreement" style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                  <input
                    type="checkbox"
                    checked={signerInfo.agreedTerms}
                    onChange={(e) => setSignerInfo({ ...signerInfo, agreedTerms: e.target.checked })}
                  />
                  <div>
                    <strong>Tôi xác nhận nội dung hợp đồng và đồng ý ký số điện tử.</strong>
                    <small style={{ display: 'block', color: '#64748b' }}>
                      Sau khi ký, hợp đồng sẽ được gửi sang Admin duyệt lần 2 để chuyển lệnh xuất kho sang Kho Tổng.
                    </small>
                  </div>
                </label>
              </div>

              <div className="modal-actions-footer">
                <button className="btn-cancel" onClick={() => setSigningContract(null)}>Đóng</button>
                <button 
                  className="btn-complete-sign"
                  disabled={isSubmittingSign || !signerInfo.agreedTerms}
                  onClick={handleExecuteSignContract}
                >
                  <FiCheckCircle />
                  {isSubmittingSign ? 'Đang Xác Thực Chữ Ký...' : 'Xác Nhận Ký Số Hợp Đồng'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL TỪ CHỐI HỢP ĐỒNG */}
      {rejectingContract && (
        <div className="modal-backdrop-overlay" onClick={() => setRejectingContract(null)}>
          <div className="contract-view-modal" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>❌ Từ Chối Yêu Cầu Hợp Đồng</h3>
              <FiX className="btn-close-modal" onClick={() => setRejectingContract(null)} />
            </div>
            <div style={{ padding: '16px 0' }}>
              <p>Bạn đang từ chối hợp đồng <strong>{rejectingContract.maHopDong}</strong> của shop <strong>{rejectingContract.tenKhoCuaHang}</strong>.</p>
              <div className="form-group-seller">
                <label>Lý do từ chối *</label>
                <textarea
                  rows="3"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
              </div>
            </div>
            <div className="modal-actions-footer">
              <button className="btn-cancel" onClick={() => setRejectingContract(null)}>Hủy</button>
              <button 
                type="button" 
                style={{ background: '#dc2626', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}
                onClick={handleRejectContract}
              >
                Xác Nhận Từ Chối
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL XEM CHI TIẾT HỢP ĐỒNG */}
      {viewingContract && (
        <div className="modal-backdrop-overlay" onClick={() => setViewingContract(null)}>
          <div className="contract-view-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>📄 Văn Bản Hợp Đồng: {viewingContract.maHopDong}</h3>
              <FiX className="btn-close-modal" onClick={() => setViewingContract(null)} />
            </div>

            <div className="contract-document-preview">
              <div className="contract-doc-header">
                <h4>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</h4>
                <p>Độc lập - Tự do - Hạnh phúc</p>
                <div className="doc-divider"></div>
                <h3>HỢP ĐỒNG CUNG ỨNG HÀNG HÓA VÀ LƯU KHO B2B2C</h3>
                <small>Mã số: {viewingContract.maHopDong} • Khởi tạo: {new Date(viewingContract.ngayTao || viewingContract.ngayKy).toLocaleString('vi-VN')}</small>
              </div>

              <div className="contract-parties-box">
                <div className="party-block">
                  <strong>BÊN A (KHO TỔNG CUNG ỨNG):</strong>
                  <p>{viewingContract.khoCungUng}</p>
                </div>
                <div className="party-block">
                  <strong>BÊN B (CHỦ GIAN HÀNG):</strong>
                  <p>{viewingContract.tenKhoCuaHang}</p>
                  <p>Người đại diện: {viewingContract.chuKyShop?.nguoiKy || viewingContract.nguoiYeuCau || 'Chủ Shop'}</p>
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
                      <td><strong>{item.soLuong}</strong> {item.donViTinh || 'Cái'}</td>
                      <td>{Number(item.donGiaSi).toLocaleString('vi-VN')} đ</td>
                      <td>{Number(item.thanhTien).toLocaleString('vi-VN')} đ</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Lịch sử nhật ký phê duyệt & Ký số */}
              <div style={{ marginTop: '20px', padding: '16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px' }}>
                <strong style={{ display: 'block', marginBottom: '8px', color: '#1e293b' }}>
                  📋 Nhật ký quy trình xử lý hợp đồng:
                </strong>
                <ul style={{ margin: 0, paddingLeft: '18px', color: '#475569', lineHeight: '1.8' }}>
                  <li>
                    <strong>Vòng 1 (Admin duyệt yêu cầu):</strong> {viewingContract.adminDuyetVong1?.daDuyet ? `✓ Đã duyệt bởi ${viewingContract.adminDuyetVong1.nguoiDuyet} lúc ${new Date(viewingContract.adminDuyetVong1.ngayDuyet).toLocaleString('vi-VN')}` : '⏳ Chưa duyệt'}
                  </li>
                  <li>
                    <strong>Ký số điện tử (Shop):</strong> {viewingContract.chuKyShop?.daKy ? `✓ Đã ký bởi ${viewingContract.chuKyShop.nguoiKy} (${viewingContract.chuKyShop.maChuKySo}) lúc ${new Date(viewingContract.chuKyShop.ngayKy).toLocaleString('vi-VN')}` : '⏳ Chưa ký'}
                  </li>
                  <li>
                    <strong>Vòng 2 (Admin duyệt chuyển kho):</strong> {viewingContract.adminDuyetVong2?.daDuyet ? `✓ Đã duyệt bởi ${viewingContract.adminDuyetVong2.nguoiDuyet} lúc ${new Date(viewingContract.adminDuyetVong2.ngayDuyet).toLocaleString('vi-VN')}` : '⏳ Chưa duyệt'}
                  </li>
                  <li>
                    <strong>Kho Tổng lên đơn xuất kho:</strong> {viewingContract.thongTinXuatKho?.daLenDon ? `✓ Phiếu xuất [${viewingContract.thongTinXuatKho.maPhieuXuat}] tạo bởi ${viewingContract.thongTinXuatKho.nguoiXuat} lúc ${new Date(viewingContract.thongTinXuatKho.ngayXuat).toLocaleString('vi-VN')}` : '⏳ Chưa lên đơn'}
                  </li>
                </ul>
              </div>

              {viewingContract.chuKyShop?.daKy && (
                <div className="contract-signed-stamp-footer">
                  <div className="stamp-box verified">
                    <div className="stamp-title">✓ HỢP ĐỒNG ĐÃ ĐƯỢC KÝ SỐ HỢP PHÁP</div>
                    <div className="stamp-name">{viewingContract.chuKyShop.nguoiKy}</div>
                    <div className="stamp-role">{viewingContract.chuKyShop.chucVu}</div>
                    <div className="stamp-meta">
                      Mã chứng thực: {viewingContract.chuKyShop.maChuKySo}<br/>
                      Thời gian ký: {new Date(viewingContract.chuKyShop.ngayKy).toLocaleString('vi-VN')}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="modal-actions-footer">
              {viewingContract.trangThai === 'HOAN_THANH' && (
                <Link to="/seller/products" className="btn-go-to-publish" onClick={() => setViewingContract(null)}>
                  <FiBox /> Đi Đến Quản Lý & Đăng Bán Lên Sàn
                </Link>
              )}
              <button className="btn-cancel" onClick={() => setViewingContract(null)}>Đóng</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerContracts;
