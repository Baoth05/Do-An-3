// src/pages/Seller/SellerContractDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useOutletContext, Link } from 'react-router-dom';
import { marketplaceService } from '../../services/marketplaceService';
import { 
  FiArrowLeft, FiCheck, FiCheckCircle, FiClock, FiFileText, FiShield, 
  FiTruck, FiPackage, FiDownload, FiCheckSquare, FiAlertCircle, FiLock, FiSend, FiUser
} from 'react-icons/fi';
import './SellerContractDetail.css';

const STEPS = [
  { key: 'CHO_ADMIN_DUYET', title: '1. Gửi yêu cầu', desc: 'Shop lập yêu cầu' },
  { key: 'CHO_SHOP_KY', title: '2. Admin duyệt V1', desc: 'Thẩm định định mức' },
  { key: 'DA_KY_CHO_DUYET_KHO', title: '3. Shop ký số', desc: 'Xác thực chữ ký điện tử' },
  { key: 'CHUYEN_QUA_KHO', title: '4. Chuyển Kho Tổng', desc: 'Chờ Thủ kho duyệt lệnh' },
  { key: 'THU_KHO_DA_DUYET', title: '5. Thủ kho duyệt', desc: 'Chờ NV lên đơn xuất kho' },
  { key: 'DANG_GIAO_HANG', title: '6. Xuất kho vận chuyển', desc: 'Phiếu xuất kho tổng' },
  { key: 'HOAN_THANH', title: '7. Nhập kho hoàn tất', desc: 'Ghi thẻ kho shop' },
];

const getStepIndex = (status) => {
  switch (status) {
    case 'CHO_ADMIN_DUYET': return 1;
    case 'CHO_SHOP_KY': return 2;
    case 'DA_KY_CHO_DUYET_KHO': return 3;
    case 'CHUYEN_QUA_KHO':
    case 'DA_DUYET_CHO_XUAT_KHO': return 4;
    case 'THU_KHO_DA_DUYET': return 5;
    case 'DANG_GIAO_HANG': return 6;
    case 'HOAN_THANH': return 7;
    case 'TU_CHOI': return -1;
    default: return 1;
  }
};

const SellerContractDetail = () => {
  const { contractId } = useParams();
  const { currentSeller, storeId } = useOutletContext();
  const navigate = useNavigate();

  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [alertNotice, setAlertNotice] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Form ký số điện tử
  const [signerInfo, setSignerInfo] = useState({
    signerName: currentSeller?.hoTen || currentSeller?.taiKhoan || '',
    signerRole: 'Chủ Cửa Hàng / Đại Diện Pháp Luật',
    signaturePin: '123456',
    agreedTerms: true,
  });

  const fetchContractDetail = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const res = await marketplaceService.getSupplyContractById(contractId);
      setContract(res);
      if (currentSeller && (!signerInfo.signerName || signerInfo.signerName === '')) {
        setSignerInfo((prev) => ({
          ...prev,
          signerName: currentSeller.hoTen || currentSeller.taiKhoan || '',
        }));
      }
    } catch (err) {
      console.error('Lỗi nạp chi tiết hợp đồng:', err);
      setErrorMessage(err.message || 'Không thể tải thông tin hợp đồng!');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (contractId) {
      fetchContractDetail();
    }
  }, [contractId]);

  // Hành động 1: Ký số điện tử (Dành cho Shop)
  const handleExecuteSign = async () => {
    if (!signerInfo.signerName.trim()) {
      alert('Vui lòng nhập họ tên người ký hợp đồng!');
      return;
    }
    if (!signerInfo.agreedTerms) {
      alert('Vui lòng chấp thuận các điều khoản hợp đồng!');
      return;
    }

    setActionLoading(true);
    setAlertNotice('');
    try {
      await marketplaceService.shopSignContract(contract.id, signerInfo);
      setAlertNotice('🎉 Ký số điện tử thành công! Hợp đồng đã chuyển sang trạng thái chờ Admin duyệt lệnh chuyển kho.');
      await fetchContractDetail();
    } catch (err) {
      alert('Lỗi ký số: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Hành động 2: Xác nhận nhận hàng vào kho (Dành cho Shop)
  const handleConfirmDelivery = async () => {
    if (!window.confirm('Xác nhận bạn đã nhận đủ số lượng hàng hóa và muốn nhập tồn kho vào gian hàng?')) {
      return;
    }

    setActionLoading(true);
    setAlertNotice('');
    try {
      await marketplaceService.completeContractDelivery(contract.id);
      setAlertNotice('🎉 Đã hoàn tất nhập hàng vào kho! Số lượng tồn kho và thẻ kho của gian hàng đã được cập nhật.');
      await fetchContractDetail();
    } catch (err) {
      alert('Lỗi xác nhận nhận hàng: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Các hành động mô phỏng quản trị (Admin / Kho tổng)
  const handleAdminApproveRound1 = async () => {
    setActionLoading(true);
    try {
      await marketplaceService.adminApproveContractRequest(contract.id, {
        name: currentSeller?.hoTen || 'Admin',
        note: 'Đã thẩm định hạn mức, đồng ý cho shop ký số.',
      });
      setAlertNotice('✅ [Admin] Đã phê duyệt yêu cầu Vòng 1 thành công!');
      await fetchContractDetail();
    } catch (err) {
      alert('Lỗi duyệt: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAdminApproveRound2 = async () => {
    setActionLoading(true);
    try {
      await marketplaceService.adminApproveAndTransferToWarehouse(contract.id, {
        name: currentSeller?.hoTen || 'Admin',
        note: 'Đã xác thực chữ ký số, phê duyệt chuyển kho.',
      });
      setAlertNotice('✅ [Admin] Đã duyệt chuyển lệnh xuất kho sang Kho Tổng!');
      await fetchContractDetail();
    } catch (err) {
      alert('Lỗi duyệt: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleWarehouseManagerApprove = async () => {
    setActionLoading(true);
    try {
      await marketplaceService.warehouseManagerApproveContract(contract.id, {
        note: 'Thủ kho đã đối chiếu và duyệt lệnh xuất kho chuyển cho nhân viên lên đơn.',
      });
      setAlertNotice('🏢 [Thủ Kho] Đã duyệt lệnh xuất kho! Chuyển nhân viên kho tiến hành lên đơn.');
      await fetchContractDetail();
    } catch (err) {
      alert('Lỗi phê duyệt thủ kho: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleWarehouseDispatch = async () => {
    setActionLoading(true);
    try {
      await marketplaceService.warehouseDispatchContractOrder(contract.id, {
        shippingProvider: 'Đội Vận Chuyển Nội Bộ CTUT Logistics',
      });
      setAlertNotice('🚚 [Nhân Viên Kho] Đã lên đơn & xuất kho thành công, hàng đang trên đường giao tới Cửa Hàng!');
      await fetchContractDetail();
    } catch (err) {
      alert('Lỗi xuất kho: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="contract-detail-loading">
        <div className="spinner"></div>
        <p>Đang tải chi tiết hợp đồng cung ứng...</p>
      </div>
    );
  }

  if (errorMessage || !contract) {
    return (
      <div className="contract-detail-error">
        <FiAlertCircle size={40} color="#dc2626" />
        <h3>Không thể tải thông tin hợp đồng</h3>
        <p>{errorMessage || 'Hợp đồng không tồn tại hoặc bạn không có quyền xem.'}</p>
        <Link to="/seller/contracts" className="btn-back-link">
          <FiArrowLeft /> Quay lại danh sách hợp đồng
        </Link>
      </div>
    );
  }

  const currentStepIdx = getStepIndex(contract.trangThai);
  const isRejected = contract.trangThai === 'TU_CHOI';
  const isAdmin = currentSeller?.vaiTro?.toUpperCase() === 'ADMIN' || 
                  currentSeller?.role?.toUpperCase() === 'ADMIN' ||
                  (Array.isArray(currentSeller?.roles) && currentSeller.roles.some(r => String(r).toUpperCase().includes('ADMIN')));

  return (
    <div className="contract-detail-page">
      {/* Top Bar Navigation */}
      <div className="detail-top-bar">
        <Link to="/seller/contracts" className="btn-back-link">
          <FiArrowLeft size={16} /> Danh sách hợp đồng
        </Link>
        <div className="contract-top-meta">
          <span className="contract-id-pill">ID: #{contract.id}</span>
          <span className="contract-created-time">
            Ngày lập: {new Date(contract.ngayTao).toLocaleDateString('vi-VN')}
          </span>
        </div>
      </div>

      {/* Main Header Card */}
      <div className="contract-main-header-card">
        <div className="header-left-col">
          <div className="contract-badge-code">
            <FiFileText size={20} color="#2563eb" />
            <h2>{contract.maHopDong}</h2>
          </div>
          <p className="contract-desc">
            Hợp đồng cung ứng điều chuyển hàng hóa: <strong>{contract.khoCungUng || 'Kho Tổng Trung Tâm'}</strong> ➔ <strong>{contract.tenKhoCuaHang || 'Gian hàng'}</strong>
          </p>
        </div>

        <div className="header-right-col">
          <div className="total-value-box">
            <span className="label">Tổng giá trị hợp đồng:</span>
            <strong className="amount">{(contract.tongTien || 0).toLocaleString('vi-VN')} đ</strong>
            <small>{contract.tongSoLuongHang || 0} sản phẩm • {contract.soLuongMatHang || 0} mặt hàng</small>
          </div>
        </div>
      </div>

      {/* Thông báo thao tác */}
      {alertNotice && (
        <div className="contract-detail-alert success">
          <FiCheckCircle size={18} />
          <span>{alertNotice}</span>
        </div>
      )}

      {/* 6-STEP PROCESS STEPPER (Quy trình nhập hàng rõ ràng) */}
      <div className="contract-stepper-card">
        <div className="stepper-title-row">
          <h3>Tiến Độ Quy Trình Cung Ứng Nội Bộ (6 Bước Chuẩn Hóa)</h3>
          <span className={`status-pill status-${contract.trangThai?.toLowerCase()}`}>
            Trạng thái hiện tại: <strong>{contract.trangThai}</strong>
          </span>
        </div>

        <div className="six-steps-bar">
          {STEPS.map((s, idx) => {
            const stepNum = idx + 1;
            const isCompleted = !isRejected && currentStepIdx > stepNum;
            const isCurrent = !isRejected && currentStepIdx === stepNum;

            return (
              <div key={s.key} className={`step-node ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}`}>
                <div className="node-marker">
                  {isCompleted ? <FiCheck size={16} /> : stepNum}
                </div>
                <div className="node-info">
                  <div className="node-title">{s.title}</div>
                  <div className="node-desc">{s.desc}</div>
                </div>
              </div>
            );
          })}
        </div>

        {isRejected && (
          <div className="rejected-banner">
            <FiAlertCircle size={18} color="#dc2626" />
            <div>
              <strong>Hợp đồng đã bị từ chối:</strong> {contract.lyDoTuChoi || 'Không đáp ứng điều kiện cung ứng'}
            </div>
          </div>
        )}
      </div>

      {/* KHU VỰC THAO TÁC THEO BƯỚC HIỆN TẠI */}
      {/* 0. Bước Chờ Duyệt Vòng 1 (CHO_ADMIN_DUYET) */}
      {contract.trangThai === 'CHO_ADMIN_DUYET' && (
        <div className="action-step-card pending-admin-action-card">
          <div className="action-card-header">
            <div className="badge-pending-step">
              <FiClock size={22} color="#d97706" />
              <h3>BƯỚC 2: HỢP ĐỒNG ĐANG CHỜ ADMIN THẨM ĐỊNH VÒNG 1</h3>
            </div>
            <span className="pending-req-pill">Chờ Admin duyệt định mức</span>
          </div>
          <div className="pending-body-grid">
            <p>
              Yêu cầu cung ứng hàng hóa đã được gửi lên hệ thống trung tâm. Ban Quản Trị Hệ Thống (Admin) đang tiến hành thẩm định định mức tồn kho và năng lực cung ứng của Kho Tổng.
            </p>
            <p className="pending-next-hint">
              👉 <strong>Sau khi Admin duyệt:</strong> Hợp đồng sẽ chuyển sang trạng thái <code>CHO_SHOP_KY</code>. Khung <strong>Ký Số Điện Tử B2B (Mã PIN)</strong> sẽ tự động hiển thị tại trang này để bạn hoàn tất chữ ký điện tử.
            </p>
          </div>
        </div>
      )}

      {/* 1. Bước Ký Số Điện Tử (CHO_SHOP_KY) */}
      {contract.trangThai === 'CHO_SHOP_KY' && (
        <div className="action-step-card signing-action-card">
          <div className="action-card-header">
            <div className="badge-signing-step">
              <FiShield size={20} color="#2563eb" />
              <h3>BƯỚC 3: KÝ SỐ ĐIỆN TỬ HỢP ĐỒNG (DÀNH CHO CHỦ SHOP)</h3>
            </div>
            <span className="signing-req-pill">Admin đã duyệt V1 • Yêu cầu ký xác thực</span>
          </div>

          <div className="signing-body-grid">
            <div className="signing-instruction">
              <p>
                Admin đã thẩm định danh mục hàng hóa và phê duyệt yêu cầu cung ứng.
                Vui lòng kiểm tra thông tin pháp lý bên dưới và thực hiện <strong>Ký số điện tử bằng mã PIN</strong> để gửi lệnh đến Kho Tổng.
              </p>
              <div className="cert-feature-list">
                <div><FiCheckCircle size={15} color="#10b981" /> Chữ ký số mã hóa bảo mật chuẩn SHA-256</div>
                <div><FiCheckCircle size={15} color="#10b981" /> Lưu vết nhật ký điện tử có giá trị pháp lý nội bộ</div>
                <div><FiCheckCircle size={15} color="#10b981" /> Tự động khởi tạo lệnh điều chuyển kho ngay sau khi duyệt</div>
              </div>
            </div>

            <div className="signing-form-col">
              <div className="form-group-item">
                <label>Người Đại Diện Ký Kết <span className="req">*</span></label>
                <div className="input-with-icon">
                  <FiUser size={16} />
                  <input
                    type="text"
                    value={signerInfo.signerName}
                    onChange={(e) => setSignerInfo({ ...signerInfo, signerName: e.target.value })}
                    placeholder="Nhập họ và tên chủ cửa hàng..."
                  />
                </div>
              </div>

              <div className="form-group-item">
                <label>Chức Vụ</label>
                <input
                  type="text"
                  value={signerInfo.signerRole}
                  onChange={(e) => setSignerInfo({ ...signerInfo, signerRole: e.target.value })}
                />
              </div>

              <div className="form-group-item">
                <label>Mã PIN Xác Thực Điện Tử <span className="req">*</span></label>
                <div className="input-with-icon">
                  <FiLock size={16} />
                  <input
                    type="password"
                    maxLength={6}
                    value={signerInfo.signaturePin}
                    onChange={(e) => setSignerInfo({ ...signerInfo, signaturePin: e.target.value })}
                    placeholder="123456"
                  />
                </div>
                <small className="pin-hint">Mã PIN mặc định: 123456</small>
              </div>

              <label className="checkbox-terms">
                <input
                  type="checkbox"
                  checked={signerInfo.agreedTerms}
                  onChange={(e) => setSignerInfo({ ...signerInfo, agreedTerms: e.target.checked })}
                />
                <span>Tôi cam kết các thông tin và đồng ý nhập toàn bộ số hàng trên theo đơn giá sỉ quy định.</span>
              </label>

              <button
                type="button"
                className="btn-execute-sign"
                disabled={actionLoading || !signerInfo.agreedTerms}
                onClick={handleExecuteSign}
              >
                {actionLoading ? 'Đang mã hóa chữ ký...' : 'Xác Nhận Ký Số Điện Tử Hợp Đồng'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Bước Xác Nhận Nhận Hàng (DANG_GIAO_HANG) */}
      {contract.trangThai === 'DANG_GIAO_HANG' && (
        <div className="action-step-card delivery-action-card">
          <div className="action-card-header">
            <div className="badge-delivery-step">
              <FiTruck size={22} color="#059669" />
              <h3>BƯỚC 6: XÁC NHẬN NHẬP HÀNG VÀO KHO (DÀNH CHO CHỦ SHOP)</h3>
            </div>
            <span className="delivery-status-pill">Hàng đang vận chuyển đến shop</span>
          </div>

          <div className="delivery-confirm-box">
            <p>
              Kho Tổng đã xuất kho và giao cho đối tác vận chuyển nội bộ.
              Khi nhận được kiện hàng và kiểm đếm đủ số lượng, vui lòng bấm nút bên dưới để 
              <strong> hoàn tất quy trình và cộng số lượng vào tồn kho gian hàng</strong>.
            </p>
            <button
              type="button"
              className="btn-confirm-delivery"
              disabled={actionLoading}
              onClick={handleConfirmDelivery}
            >
              <FiCheckCircle size={18} />
              {actionLoading ? 'Đang cập nhật tồn kho...' : 'Xác Nhận Đã Nhận Đủ Hàng & Nhập Kho'}
            </button>
          </div>
        </div>
      )}

      {/* 3. BẢNG ĐIỀU PHỐI QUY TRÌNH HỢP ĐỒNG (ADMIN & DEMO SIMULATION) */}
      <div className="admin-simulation-control-card">
        <div className="sim-header">
          <FiShield size={16} color="#d97706" />
          <strong>BẢNG ĐIỀU PHỐI TIẾN ĐỘ HỢP ĐỒNG (ADMIN & THỦ KHO SIMULATION)</strong>
          <span className="sim-badge">Hỗ trợ thử nghiệm & Demo Đồ Án</span>
        </div>
        <div className="sim-buttons">
          {contract.trangThai === 'CHO_ADMIN_DUYET' && (
            <button type="button" className="btn-sim approve" onClick={handleAdminApproveRound1} disabled={actionLoading}>
              👑 [Admin] Duyệt Vòng 1 (Thẩm Định & Mở Ký Số)
            </button>
          )}
          {contract.trangThai === 'DA_KY_CHO_DUYET_KHO' && (
            <button type="button" className="btn-sim transfer" onClick={handleAdminApproveRound2} disabled={actionLoading}>
              👑 [Admin] Duyệt Vòng 2 & Lệnh Chuyển Kho Tổng
            </button>
          )}
          {(contract.trangThai === 'CHUYEN_QUA_KHO' || contract.trangThai === 'DA_DUYET_CHO_XUAT_KHO') && (
            <button type="button" className="btn-sim approve" onClick={handleWarehouseManagerApprove} disabled={actionLoading}>
              🏢 [Thủ Kho] Phê Duyệt Lệnh Xuất (Chuyển xuống cho Nhân viên lên đơn)
            </button>
          )}
          {contract.trangThai === 'THU_KHO_DA_DUYET' && (
            <button type="button" className="btn-sim dispatch" onClick={handleWarehouseDispatch} disabled={actionLoading}>
              📦 [Nhân Viên Kho] Lên Đơn & Xuất Kho Bàn Giao Vận Chuyển
            </button>
          )}
          {contract.trangThai === 'CHO_SHOP_KY' && (
            <span className="sim-hint">👉 Hợp đồng đã duyệt V1, vui lòng nhập mã PIN và ký số ở khung Bước 3 bên trên!</span>
          )}
          {contract.trangThai === 'DANG_GIAO_HANG' && (
            <span className="sim-hint">🚚 Kho Tổng đã xuất hàng, vui lòng bấm nút xác nhận ở khung Bước 7 bên trên khi nhận đủ hàng!</span>
          )}
          {contract.trangThai === 'HOAN_THANH' && (
            <span className="sim-hint success">🎉 Toàn bộ quy trình 7 bước đã hoàn tất thành công! Tồn kho và thẻ kho gian hàng đã được ghi nhận.</span>
          )}
        </div>
      </div>

      {/* CHI TIẾT CÁC BÊN THAM GIA */}
      <div className="contract-parties-layout">
        <div className="party-detail-card">
          <div className="party-header-title a">BÊN A (BÊN CUNG ỨNG - KHO TỔNG)</div>
          <div className="party-field">
            <span className="f-label">Tên kho cung ứng:</span>
            <strong>{contract.khoCungUng || 'Kho Tổng Trung Tâm'}</strong>
          </div>
          <div className="party-field">
            <span className="f-label">Mã kho:</span>
            <code>{contract.khoTongId ? `KHO-${contract.khoTongId}` : 'KHO_TONG'}</code>
          </div>
          <div className="party-field">
            <span className="f-label">Địa chỉ kho:</span>
            <span>{contract.diaChiKhoCungUng || '256 Nguyễn Văn Cừ, Cần Thơ'}</span>
          </div>
          <div className="party-field">
            <span className="f-label">Đường dây nóng:</span>
            <span>{contract.soDienThoaiKhoCungUng || '1900 6868'}</span>
          </div>
        </div>

        <div className="party-detail-card">
          <div className="party-header-title b">BÊN B (BÊN MUA HÀNG - GIAN HÀNG)</div>
          <div className="party-field">
            <span className="f-label">Tên gian hàng:</span>
            <strong>{contract.tenKhoCuaHang || 'Gian hàng'}</strong>
          </div>
          <div className="party-field">
            <span className="f-label">Mã kho gian hàng:</span>
            <code>{contract.maKhoCuaHang || `STORE-${contract.storeId}`}</code>
          </div>
          <div className="party-field">
            <span className="f-label">Người đại diện:</span>
            <strong>{contract.nguoiYeuCau || 'Chủ Shop'}</strong>
          </div>
          <div className="party-field">
            <span className="f-label">Chức vụ:</span>
            <span>{contract.chucVuYeuCau || 'Chủ Cửa Hàng'}</span>
          </div>
        </div>
      </div>

      {/* DANH MỤC HÀNG HÓA KÝ KẾT */}
      <div className="contract-items-section-card">
        <div className="items-section-header">
          <h3>
            <FiPackage size={18} color="#2563eb" /> Danh Mục Mặt Hàng Ký Kết Nhập Kho
          </h3>
          <span className="items-count-badge">{(contract.danhSachHang || []).length} mặt hàng</span>
        </div>

        <div className="table-responsive">
          <table className="contract-items-table">
            <thead>
              <tr>
                <th style={{ width: '60px', textAlign: 'center' }}>STT</th>
                <th>Sản phẩm</th>
                <th>Mã SKU</th>
                <th>ĐVT</th>
                <th style={{ textAlign: 'center' }}>Số lượng nhập</th>
                <th style={{ textAlign: 'right' }}>Đơn giá sỉ B2B</th>
                <th style={{ textAlign: 'right' }}>Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              {(contract.danhSachHang || []).map((item, idx) => (
                <tr key={item.sanPhamId || idx}>
                  <td style={{ textAlign: 'center' }}>{idx + 1}</td>
                  <td>
                    <div className="item-prod-cell">
                      {item.hinhAnh && <img src={item.hinhAnh} alt={item.tenHangHoa} className="item-thumb" />}
                      <div>
                        <strong>{item.tenHangHoa}</strong>
                        {item.danhMuc && <small className="item-cat">{item.danhMuc}</small>}
                      </div>
                    </div>
                  </td>
                  <td><code>{item.sku}</code></td>
                  <td>{item.donViTinh || 'Cái'}</td>
                  <td style={{ textAlign: 'center' }}>
                    <span className="qty-tag">{item.soLuong}</span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {(item.donGiaSi || 0).toLocaleString('vi-VN')} đ
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <strong>{(item.thanhTien || 0).toLocaleString('vi-VN')} đ</strong>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan="4" style={{ textAlign: 'right' }}><strong>TỔNG CỘNG:</strong></td>
                <td style={{ textAlign: 'center' }}>
                  <strong>{contract.tongSoLuongHang || 0}</strong>
                </td>
                <td colSpan="2" style={{ textAlign: 'right', color: '#dc2626', fontSize: '16px' }}>
                  <strong>{(contract.tongTien || 0).toLocaleString('vi-VN')} VNĐ</strong>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* THÔNG TIN CHỮ KÝ SỐ VÀ NHẬT KÝ DUYỆT */}
      <div className="signatures-and-history-grid">
        {/* Chữ ký số điện tử của Shop */}
        <div className="sig-info-card">
          <div className="sig-card-header">
            <FiShield size={18} color="#2563eb" />
            <h4>Chữ Ký Số Điện Tử (Bên B)</h4>
          </div>

          {contract.chuKyShop?.daKy ? (
            <div className="sig-signed-box">
              <div className="sig-status-pill success">
                <FiCheckCircle size={14} /> ĐÃ KÝ SỐ ĐIỆN TỬ HỢP LỆ
              </div>
              <div className="sig-field-row">
                <span>Mã băm chữ ký (Hash):</span>
                <code>{contract.chuKyShop.maChuKySo}</code>
              </div>
              <div className="sig-field-row">
                <span>Người ký:</span>
                <strong>{contract.chuKyShop.nguoiKy}</strong> ({contract.chuKyShop.chucVu})
              </div>
              <div className="sig-field-row">
                <span>Thời gian ký:</span>
                <span>{new Date(contract.chuKyShop.ngayKy).toLocaleString('vi-VN')}</span>
              </div>
            </div>
          ) : (
            <div className="sig-unsigned-box">
              <FiClock size={24} color="#94a3b8" />
              <p>Chưa ký số điện tử. Chờ Admin duyệt vòng 1 để thực hiện ký.</p>
            </div>
          )}
        </div>

        {/* Lịch sử phê duyệt Admin & Kho */}
        <div className="sig-info-card">
          <div className="sig-card-header">
            <FiCheckSquare size={18} color="#10b981" />
            <h4>Nhật Ký Phê Duyệt Hệ Thống</h4>
          </div>

          <div className="approval-log-list">
            <div className={`log-item ${contract.adminDuyetVong1?.daDuyet ? 'done' : ''}`}>
              <div className="log-marker"></div>
              <div className="log-content">
                <strong>Duyệt Vòng 1 (Thẩm định định mức):</strong>
                {contract.adminDuyetVong1?.daDuyet ? (
                  <span>
                    Bởi {contract.adminDuyetVong1.nguoiDuyet} lúc {new Date(contract.adminDuyetVong1.ngayDuyet).toLocaleString('vi-VN')}
                    {contract.adminDuyetVong1.ghiChu && <em className="note-text"> ({contract.adminDuyetVong1.ghiChu})</em>}
                  </span>
                ) : (
                  <span className="pending-text">Chờ thẩm định...</span>
                )}
              </div>
            </div>

            <div className={`log-item ${contract.adminDuyetVong2?.daDuyet ? 'done' : ''}`}>
              <div className="log-marker"></div>
              <div className="log-content">
                <strong>Duyệt Vòng 2 (Admin duyệt chuyển lệnh kho):</strong>
                {contract.adminDuyetVong2?.daDuyet ? (
                  <span>
                    Bởi {contract.adminDuyetVong2.nguoiDuyet} lúc {new Date(contract.adminDuyetVong2.ngayDuyet).toLocaleString('vi-VN')}
                  </span>
                ) : (
                  <span className="pending-text">Chờ duyệt sau khi ký...</span>
                )}
              </div>
            </div>

            <div className={`log-item ${contract.thuKhoDuyet?.daDuyet ? 'done' : ''}`}>
              <div className="log-marker"></div>
              <div className="log-content">
                <strong>Thủ Kho Duyệt Xuất Kho (Chuyển nhân viên):</strong>
                {contract.thuKhoDuyet?.daDuyet ? (
                  <span>
                    Phê duyệt bởi {contract.thuKhoDuyet.nguoiDuyet} lúc {new Date(contract.thuKhoDuyet.ngayDuyet).toLocaleString('vi-VN')}
                    {contract.thuKhoDuyet.ghiChu && <em className="note-text"> ({contract.thuKhoDuyet.ghiChu})</em>}
                  </span>
                ) : (
                  <span className="pending-text">Chờ thủ kho phê duyệt...</span>
                )}
              </div>
            </div>

            <div className={`log-item ${contract.thongTinXuatKho?.daLenDon ? 'done' : ''}`}>
              <div className="log-marker"></div>
              <div className="log-content">
                <strong>Nhân Viên Lên Đơn & Xuất Kho:</strong>
                {contract.thongTinXuatKho?.daLenDon ? (
                  <span>
                    Phiếu #{contract.thongTinXuatKho.maPhieuXuat} bởi {contract.thongTinXuatKho.nguoiXuat} • ĐVVC: {contract.thongTinXuatKho.donViVanChuyen || 'Nội bộ'}
                  </span>
                ) : (
                  <span className="pending-text">Chưa xuất kho...</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerContractDetail;
