// src/pages/SupplyContractManagement.jsx
import React, { useState, useEffect } from 'react';
import { 
  FiFileText, FiCheckCircle, FiClock, FiShield, 
  FiTruck, FiBox, FiX, FiCheck, FiSearch, FiRefreshCw, FiAlertTriangle 
} from 'react-icons/fi';
import api from '../services/api';
import './SupplyContractManagement.css';

const SupplyContractManagement = () => {
  const [contracts, setContracts] = useState([]);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [alertNotice, setAlertNotice] = useState('');

  // Modal xem chi tiết
  const [viewingContract, setViewingContract] = useState(null);

  // Modal từ chối
  const [rejectModalContract, setRejectModalContract] = useState(null);
  const [rejectReason, setRejectReason] = useState('Kho tổng tạm thời hết hàng hoặc vượt hạn mức cung ứng.');

  // Hợp đồng cung ứng được lưu trên backend (wms-core-service: /supply-contracts)
  const readError = (err, fallback) => {
    const data = err?.response?.data;
    if (typeof data === 'string' && data) return data;
    return data?.message || err?.message || fallback;
  };

  const fetchContracts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/supply-contracts');
      setContracts(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.warn('Lỗi tải hợp đồng:', e);
      setAlertNotice('⚠️ ' + readError(e, 'Không tải được danh sách hợp đồng!'));
      setContracts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContracts();
  }, []);

  // Gọi API thao tác rồi tải lại danh sách
  const runAction = async (request, successMessage) => {
    try {
      await request();
      setAlertNotice(successMessage);
      await fetchContracts();
    } catch (e) {
      alert('Thao tác thất bại: ' + readError(e, 'Lỗi không xác định'));
    }
  };

  // 1. Duyệt Vòng 1: Admin Duyệt Yêu Cầu Cung Ứng -> Cho phép Shop Ký Số
  const handleApproveRound1 = (c) => runAction(
    () => api.put(`/supply-contracts/${c.id}/approve-request`, {
      note: 'Admin đã thẩm định yêu cầu nhập hàng. Cho phép chủ cửa hàng tiến hành ký số hợp đồng.',
    }),
    `✅ Đã duyệt yêu cầu hợp đồng ${c.maHopDong}! Hợp đồng chuyển sang chờ Shop ký số.`
  );

  // 2. Duyệt Vòng 2: Admin Duyệt Chuyển Kho -> Chuyển Sang Kho Tổng Lên Đơn
  const handleApproveRound2 = (c) => runAction(
    () => api.put(`/supply-contracts/${c.id}/approve-transfer`, {
      note: 'Hợp đồng đã có chữ ký số điện tử của shop. Lệnh xuất kho đã chuyển sang Kho Tổng.',
    }),
    `🏢 Đã duyệt hợp đồng ${c.maHopDong} và chuyển lệnh xuất sang Kho Tổng!`
  );

  // 3. Thủ kho duyệt lệnh xuất kho chuyển xuống cho nhân viên lên đơn
  const handleWarehouseManagerApprove = (c) => runAction(
    () => api.put(`/supply-contracts/${c.id}/warehouse-approve`, {
      note: 'Thủ kho đã duyệt đối chiếu tồn kho, chuyển giao cho nhân viên kho lên đơn xuất kho.',
    }),
    `🏢 Thủ kho đã duyệt lệnh xuất cho hợp đồng ${c.maHopDong}! Chuyển nhân viên lên đơn.`
  );

  // 4. Nhân viên kho lên đơn và xuất kho (backend trừ tồn Kho Tổng, lập phiếu xuất, ghi thẻ kho)
  const handleDispatchOrder = (c) => runAction(
    () => api.put(`/supply-contracts/${c.id}/dispatch`, { shippingProvider: 'CTUT Express Logistics' }),
    `📦 Đã lên đơn & xuất kho cho hợp đồng ${c.maHopDong}! Hàng đang vận chuyển sang shop.`
  );

  // 4. Từ chối yêu cầu
  const handleRejectConfirm = async () => {
    if (!rejectModalContract) return;
    const target = rejectModalContract;
    await runAction(
      () => api.put(`/supply-contracts/${target.id}/reject`, { reason: rejectReason }),
      `❌ Đã từ chối hợp đồng ${target.maHopDong}.`
    );
    setRejectModalContract(null);
  };

  // Lọc hợp đồng theo tab và tìm kiếm
  const filteredContracts = contracts.filter((c) => {
    const matchStatus = filterStatus === 'ALL' || c.trangThai === filterStatus;
    const searchLower = searchTerm.toLowerCase();
    const matchSearch = 
      (c.maHopDong || '').toLowerCase().includes(searchLower) ||
      (c.tenKhoCuaHang || '').toLowerCase().includes(searchLower) ||
      (c.khoCungUng || '').toLowerCase().includes(searchLower);
    return matchStatus && matchSearch;
  });

  // Thống kê số lượng
  const countPendingRound1 = contracts.filter((c) => c.trangThai === 'CHO_ADMIN_DUYET').length;
  const countPendingSign = contracts.filter((c) => c.trangThai === 'CHO_SHOP_KY').length;
  const countPendingRound2 = contracts.filter((c) => c.trangThai === 'DA_KY_CHO_DUYET_KHO').length;
  const countWarehouse = contracts.filter((c) => c.trangThai === 'CHUYEN_QUA_KHO' || c.trangThai === 'DANG_GIAO_HANG').length;
  const countCompleted = contracts.filter((c) => c.trangThai === 'HOAN_THANH').length;

  const renderStatusBadge = (status) => {
    switch (status) {
      case 'CHO_ADMIN_DUYET':
        return <span className="admin-contract-badge pending-round1"><FiClock /> 1. Chờ Admin Duyệt Yêu Cầu</span>;
      case 'CHO_SHOP_KY':
        return <span className="admin-contract-badge pending-sign"><FiShield /> 2. Chờ Shop Ký Số</span>;
      case 'DA_KY_CHO_DUYET_KHO':
        return <span className="admin-contract-badge pending-round2"><FiCheckCircle /> 3. Đã Ký - Chờ Duyệt Chuyển Kho</span>;
      case 'CHUYEN_QUA_KHO':
        return <span className="admin-contract-badge warehouse"><FiBox /> 4. Đã Chuyển Kho - Chờ Thủ Kho Duyệt</span>;
      case 'THU_KHO_DA_DUYET':
        return <span className="admin-contract-badge warehouse" style={{ background: '#ecfdf5', color: '#059669', borderColor: '#a7f3d0' }}><FiCheckCircle /> 5. Thủ Kho Đã Duyệt • Chờ Lên Đơn</span>;
      case 'DANG_GIAO_HANG':
        return <span className="admin-contract-badge shipping"><FiTruck /> 6. Đang Giao Sang Shop</span>;
      case 'HOAN_THANH':
        return <span className="admin-contract-badge completed"><FiCheck /> 7. Hoàn Thành & Đã Nhập Kho</span>;
      case 'TU_CHOI':
        return <span className="admin-contract-badge rejected"><FiX /> Bị Từ Chối</span>;
      default:
        return <span className="admin-contract-badge">{status}</span>;
    }
  };

  return (
    <div className="supply-contract-admin-page">
      {/* Header */}
      <div className="page-header-flex">
        <div className="title-group">
          <h1>
            Phê Duyệt Hợp Đồng Cung Ứng & Lệnh Xuất Kho (B2B2C)
            <span className="tag-badge-project">QUY TRÌNH 5 BƯỚC</span>
          </h1>
          <p className="subtitle">
            Quản lý và phê duyệt yêu cầu nhập hàng từ các cửa hàng thành viên: Duyệt yêu cầu (Vòng 1) → Shop ký số → Duyệt chuyển kho (Vòng 2) → Kho tổng lên đơn xuất kho.
          </p>
        </div>
      </div>

      {alertNotice && (
        <div className="admin-alert-banner">
          <FiCheckCircle size={18} /> {alertNotice}
        </div>
      )}

      {/* Thẻ Thống Kê */}
      <div className="admin-stats-grid">
        <div className="stat-card">
          <div className="stat-icon-wrap blue">
            <FiFileText size={22} />
          </div>
          <div>
            <div className="stat-val">{contracts.length}</div>
            <div className="stat-lbl">Tổng Hợp Đồng</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrap amber">
            <FiClock size={22} />
          </div>
          <div>
            <div className="stat-val">{countPendingRound1}</div>
            <div className="stat-lbl">Chờ Duyệt Yêu Cầu (Vòng 1)</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrap purple">
            <FiShield size={22} />
          </div>
          <div>
            <div className="stat-val">{countPendingRound2}</div>
            <div className="stat-lbl">Đã Ký - Chờ Chuyển Kho (Vòng 2)</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrap teal">
            <FiTruck size={22} />
          </div>
          <div>
            <div className="stat-val">{countWarehouse}</div>
            <div className="stat-lbl">Kho Đang Xử Lý / Giao</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrap green">
            <FiCheckCircle size={22} />
          </div>
          <div>
            <div className="stat-val">{countCompleted}</div>
            <div className="stat-lbl">Đã Nhập Kho Thành Công</div>
          </div>
        </div>
      </div>

      {/* Bộ Lọc & Tìm Kiếm */}
      <div className="admin-filter-bar">
        <div className="filter-tabs">
          <button 
            type="button" 
            className={`f-tab ${filterStatus === 'ALL' ? 'active' : ''}`}
            onClick={() => setFilterStatus('ALL')}
          >
            Tất Cả ({contracts.length})
          </button>
          <button 
            type="button" 
            className={`f-tab ${filterStatus === 'CHO_ADMIN_DUYET' ? 'active' : ''}`}
            onClick={() => setFilterStatus('CHO_ADMIN_DUYET')}
          >
            Chờ Duyệt Yêu Cầu ({countPendingRound1})
          </button>
          <button 
            type="button" 
            className={`f-tab ${filterStatus === 'CHO_SHOP_KY' ? 'active' : ''}`}
            onClick={() => setFilterStatus('CHO_SHOP_KY')}
          >
            Chờ Shop Ký ({countPendingSign})
          </button>
          <button 
            type="button" 
            className={`f-tab ${filterStatus === 'DA_KY_CHO_DUYET_KHO' ? 'active' : ''}`}
            onClick={() => setFilterStatus('DA_KY_CHO_DUYET_KHO')}
          >
            Chờ Chuyển Kho ({countPendingRound2})
          </button>
          <button 
            type="button" 
            className={`f-tab ${filterStatus === 'HOAN_THANH' ? 'active' : ''}`}
            onClick={() => setFilterStatus('HOAN_THANH')}
          >
            Đã Hoàn Thành ({countCompleted})
          </button>
        </div>

        <div className="search-input-wrap">
          <FiSearch className="s-icon" />
          <input
            type="text"
            placeholder="Tìm theo mã HĐ, tên cửa hàng, kho..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Bảng Dữ Liệu Hợp Đồng */}
      <div className="admin-table-container">
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <FiRefreshCw className="spinner" size={24} />
            <p style={{ marginTop: '8px', color: '#64748b' }}>Đang tải hợp đồng...</p>
          </div>
        ) : filteredContracts.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
            <FiFileText size={40} style={{ opacity: 0.4, marginBottom: '8px' }} />
            <p>Không tìm thấy hợp đồng nào phù hợp.</p>
          </div>
        ) : (
          <table className="admin-contracts-table">
            <thead>
              <tr>
                <th>Mã Hợp Đồng</th>
                <th>Gian Hàng Nhận (Bên B)</th>
                <th>Kho Cung Ứng (Bên A)</th>
                <th>SL Hàng</th>
                <th>Tổng Tiền</th>
                <th>Trạng Thái</th>
                <th>Hành Động Của Admin</th>
                <th>Xem</th>
              </tr>
            </thead>
            <tbody>
              {filteredContracts.map((c) => (
                <tr key={c.id}>
                  <td>
                    <strong className="code-text">{c.maHopDong}</strong>
                    <small className="date-sub">
                      {new Date(c.ngayTao || c.ngayKy).toLocaleDateString('vi-VN')}
                    </small>
                  </td>
                  <td>
                    <strong>{c.tenKhoCuaHang}</strong>
                    <small style={{ display: 'block', color: '#64748b' }}>Mã: {c.maKhoCuaHang}</small>
                  </td>
                  <td>
                    <strong>{c.khoCungUng}</strong>
                  </td>
                  <td>
                    <strong>{c.tongSoLuongHang}</strong> cái
                  </td>
                  <td>
                    <strong className="amount-text">{Number(c.tongTien).toLocaleString('vi-VN')} đ</strong>
                  </td>
                  <td>
                    {renderStatusBadge(c.trangThai)}
                    {c.thongTinXuatKho?.maPhieuXuat && (
                      <small style={{ display: 'block', color: '#0284c7', marginTop: '2px', fontSize: '11px' }}>
                        Phiếu: {c.thongTinXuatKho.maPhieuXuat}
                      </small>
                    )}
                  </td>
                  <td>
                    <div className="actions-cell">
                      {/* Vòng 1: Duyệt yêu cầu */}
                      {c.trangThai === 'CHO_ADMIN_DUYET' && (
                        <>
                          <button
                            type="button"
                            className="btn-admin-action approve"
                            onClick={() => handleApproveRound1(c)}
                          >
                            <FiCheck /> Duyệt Yêu Cầu (Vòng 1)
                          </button>
                          <button
                            type="button"
                            className="btn-admin-action reject"
                            onClick={() => setRejectModalContract(c)}
                          >
                            <FiX /> Từ Chối
                          </button>
                        </>
                      )}

                      {/* Vòng 2: Duyệt chuyển kho */}
                      {c.trangThai === 'DA_KY_CHO_DUYET_KHO' && (
                        <>
                          <button
                            type="button"
                            className="btn-admin-action transfer"
                            onClick={() => handleApproveRound2(c)}
                          >
                            <FiBox /> Duyệt & Chuyển Sang Kho Tổng (Vòng 2)
                          </button>
                          <button
                            type="button"
                            className="btn-admin-action reject"
                            onClick={() => setRejectModalContract(c)}
                          >
                            <FiX /> Từ Chối
                          </button>
                        </>
                      )}

                      {/* Thủ kho duyệt */}
                      {c.trangThai === 'CHUYEN_QUA_KHO' && (
                        <button
                          type="button"
                          className="btn-admin-action approve"
                          onClick={() => handleWarehouseManagerApprove(c)}
                        >
                          <FiCheckCircle /> Thủ Kho Duyệt Lệnh Xuất
                        </button>
                      )}

                      {/* Nhân viên lên đơn & xuất kho */}
                      {c.trangThai === 'THU_KHO_DA_DUYET' && (
                        <button
                          type="button"
                          className="btn-admin-action dispatch"
                          onClick={() => handleDispatchOrder(c)}
                        >
                          <FiTruck /> NV Lên Đơn & Xuất Kho
                        </button>
                      )}

                      {c.trangThai === 'CHO_SHOP_KY' && (
                        <span style={{ fontSize: '12px', color: '#1d4ed8' }}>
                          ✍️ Đang chờ chủ shop ký số
                        </span>
                      )}

                      {c.trangThai === 'DANG_GIAO_HANG' && (
                        <span style={{ fontSize: '12px', color: '#c2410c' }}>
                          🚚 Kho đang giao hàng sang shop
                        </span>
                      )}

                      {c.trangThai === 'HOAN_THANH' && (
                        <span style={{ fontSize: '12px', color: '#059669', fontWeight: '700' }}>
                          ✓ Đã hoàn tất nhập kho
                        </span>
                      )}

                      {c.trangThai === 'TU_CHOI' && (
                        <span style={{ fontSize: '12px', color: '#dc2626' }}>
                          Đã từ chối: {c.lyDoTuChoi}
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn-view-doc"
                      onClick={() => setViewingContract(c)}
                    >
                      <FiFileText />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal Xem Hợp Đồng Chi Tiết */}
      {viewingContract && (
        <div className="admin-modal-backdrop" onClick={() => setViewingContract(null)}>
          <div className="admin-contract-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-top">
              <h3>📄 Chi Tiết Hợp Đồng: {viewingContract.maHopDong}</h3>
              <FiX className="close-icon" onClick={() => setViewingContract(null)} />
            </div>

            <div className="modal-body-scroll">
              <div className="doc-paper">
                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                  <h4 style={{ margin: 0 }}>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</h4>
                  <p style={{ margin: '4px 0', fontSize: '13px', fontWeight: 'bold' }}>Độc lập - Tự do - Hạnh phúc</p>
                  <div style={{ width: '100px', height: '1px', background: '#000', margin: '6px auto' }}></div>
                  <h3 style={{ color: '#1e3a8a', marginTop: '10px' }}>HỢP ĐỒNG CUNG ỨNG HÀNG HÓA VÀ LƯU KHO B2B2C</h3>
                  <small>Mã số: {viewingContract.maHopDong}</small>
                </div>

                <div className="parties-row">
                  <div className="party-box">
                    <strong>BÊN A (KHO TỔNG CUNG ỨNG):</strong>
                    <p>{viewingContract.khoCungUng}</p>
                    <p>Địa chỉ: {viewingContract.diaChiKhoCungUng || 'Cần Thơ'}</p>
                  </div>
                  <div className="party-box">
                    <strong>BÊN B (CHỦ GIAN HÀNG):</strong>
                    <p>Cửa hàng: {viewingContract.tenKhoCuaHang}</p>
                    <p>Mã kho: {viewingContract.maKhoCuaHang}</p>
                    <p>Người đại diện: {viewingContract.chuKyShop?.nguoiKy || viewingContract.nguoiYeuCau || 'Chủ Shop'}</p>
                  </div>
                </div>

                <table className="items-table">
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
                  <tfoot>
                    <tr>
                      <td colSpan="5"><strong>TỔNG GIÁ TRỊ HỢP ĐỒNG:</strong></td>
                      <td><strong style={{ color: '#dc2626' }}>{Number(viewingContract.tongTien).toLocaleString('vi-VN')} đ</strong></td>
                    </tr>
                  </tfoot>
                </table>

                {/* Nhật ký xử lý */}
                <div className="audit-log-box">
                  <strong>📋 Nhật Ký Kiểm Duyệt Hệ Thống:</strong>
                  <ul>
                    <li>
                      <strong>Vòng 1 (Duyệt Yêu Cầu):</strong> {viewingContract.adminDuyetVong1?.daDuyet ? `✓ Đã duyệt bởi ${viewingContract.adminDuyetVong1.nguoiDuyet} lúc ${new Date(viewingContract.adminDuyetVong1.ngayDuyet).toLocaleString('vi-VN')}` : '⏳ Chưa duyệt'}
                    </li>
                    <li>
                      <strong>Chữ Ký Số Shop:</strong> {viewingContract.chuKyShop?.daKy ? `✓ Đã ký bởi ${viewingContract.chuKyShop.nguoiKy} (${viewingContract.chuKyShop.maChuKySo}) lúc ${new Date(viewingContract.chuKyShop.ngayKy).toLocaleString('vi-VN')}` : '⏳ Chưa ký'}
                    </li>
                    <li>
                      <strong>Vòng 2 (Duyệt Chuyển Kho):</strong> {viewingContract.adminDuyetVong2?.daDuyet ? `✓ Đã duyệt bởi ${viewingContract.adminDuyetVong2.nguoiDuyet} lúc ${new Date(viewingContract.adminDuyetVong2.ngayDuyet).toLocaleString('vi-VN')}` : '⏳ Chưa duyệt'}
                    </li>
                    <li>
                      <strong>Lên Đơn Kho Tổng:</strong> {viewingContract.thongTinXuatKho?.daLenDon ? `✓ Phiếu xuất [${viewingContract.thongTinXuatKho.maPhieuXuat}] tạo lúc ${new Date(viewingContract.thongTinXuatKho.ngayXuat).toLocaleString('vi-VN')}` : '⏳ Chưa lên đơn'}
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="modal-foot">
              <button className="btn-close" onClick={() => setViewingContract(null)}>Đóng</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Từ Chối */}
      {rejectModalContract && (
        <div className="admin-modal-backdrop" onClick={() => setRejectModalContract(null)}>
          <div className="admin-contract-detail-modal" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-top">
              <h3>❌ Từ Chối Hợp Đồng Cung Ứng</h3>
              <FiX className="close-icon" onClick={() => setRejectModalContract(null)} />
            </div>
            <div style={{ padding: '16px 0' }}>
              <p>Xác nhận từ chối hợp đồng <strong>{rejectModalContract.maHopDong}</strong> của shop <strong>{rejectModalContract.tenKhoCuaHang}</strong>?</p>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', margin: '8px 0 4px 0' }}>
                Lý do từ chối:
              </label>
              <textarea
                rows="3"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
              />
            </div>
            <div className="modal-foot">
              <button className="btn-close" onClick={() => setRejectModalContract(null)}>Hủy</button>
              <button 
                type="button" 
                style={{ background: '#dc2626', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
                onClick={handleRejectConfirm}
              >
                Xác Nhận Từ Chối
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupplyContractManagement;

