import React, { useState, useEffect } from 'react';
import { 
  FiSearch, FiEye, FiCheckCircle, FiXCircle, FiRefreshCw, 
  FiTruck, FiBox, FiCheck, FiX, FiFileText, FiClock, FiShield 
} from 'react-icons/fi';
import { wmsCoreService } from '../../services/wmsCoreService';
import './SupplyContractList.css';

const SupplyContractList = () => {
  const [contracts, setContracts] = useState([]);
  const [filterTab, setFilterTab] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [alertNotice, setAlertNotice] = useState('');

  // Modal xem chi tiết
  const [viewingContract, setViewingContract] = useState(null);

  // Modal phê duyệt của thủ kho
  const [approveModalContract, setApproveModalContract] = useState(null);
  const [approveNote, setApproveNote] = useState('Thủ kho đã đối chiếu tồn kho và phê duyệt lệnh xuất kho.');

  // Modal lên đơn của nhân viên kho
  const [dispatchModalContract, setDispatchModalContract] = useState(null);
  const [shippingProvider, setShippingProvider] = useState('CTUT Express Logistics');

  const fetchContracts = async () => {
    setIsLoading(true);
    try {
      const res = await wmsCoreService.getSupplyContracts();
      setContracts(Array.isArray(res) ? res : []);
    } catch (err) {
      console.warn('Lỗi tải hợp đồng cung ứng:', err);
      setContracts([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchContracts();
  }, []);

  const showAlert = (msg) => {
    setAlertNotice(msg);
    setTimeout(() => setAlertNotice(''), 4000);
  };

  // 1. THỦ KHO DUYỆT LỆNH XUẤT (Chuyển xuống cho nhân viên)
  const handleConfirmWarehouseApprove = async () => {
    if (!approveModalContract) return;
    try {
      await wmsCoreService.warehouseManagerApproveSupplyContract(approveModalContract.id, approveNote);
      showAlert(`✅ [Thủ Kho] Đã phê duyệt lệnh xuất kho cho hợp đồng ${approveModalContract.maHopDong}! Chuyển nhân viên kho lên đơn.`);
      setApproveModalContract(null);
      await fetchContracts();
    } catch (err) {
      alert('Lỗi phê duyệt thủ kho: ' + (err.response?.data || err.message));
    }
  };

  // 2. NHÂN VIÊN KHO LÊN ĐƠN VÀ XUẤT KHO (Tạo phiếu xuất, trừ tồn, giao bưu tá)
  const handleConfirmDispatch = async () => {
    if (!dispatchModalContract) return;
    try {
      await wmsCoreService.warehouseStaffDispatchSupplyContract(dispatchModalContract.id, shippingProvider);
      showAlert(`🚚 [Nhân Viên Kho] Đã lên đơn & xuất kho cho hợp đồng ${dispatchModalContract.maHopDong}! Hàng đang được vận chuyển.`);
      setDispatchModalContract(null);
      await fetchContracts();
    } catch (err) {
      alert('Lỗi xuất kho: ' + (err.response?.data || err.message));
    }
  };

  // Lọc hợp đồng
  const filteredContracts = contracts.filter((c) => {
    let matchTab = true;
    if (filterTab === 'PENDING_MANAGER') {
      matchTab = c.trangThai === 'CHUYEN_QUA_KHO';
    } else if (filterTab === 'PENDING_STAFF') {
      matchTab = c.trangThai === 'THU_KHO_DA_DUYET';
    } else if (filterTab === 'SHIPPING') {
      matchTab = c.trangThai === 'DANG_GIAO_HANG';
    } else if (filterTab === 'COMPLETED') {
      matchTab = c.trangThai === 'HOAN_THANH';
    }

    const q = searchTerm.toLowerCase().trim();
    const matchSearch = !q || 
      (c.maHopDong || '').toLowerCase().includes(q) ||
      (c.tenKhoCuaHang || '').toLowerCase().includes(q) ||
      (c.maKhoCuaHang || '').toLowerCase().includes(q);

    return matchTab && matchSearch;
  });

  const countPendingManager = contracts.filter((c) => c.trangThai === 'CHUYEN_QUA_KHO').length;
  const countPendingStaff = contracts.filter((c) => c.trangThai === 'THU_KHO_DA_DUYET').length;
  const countShipping = contracts.filter((c) => c.trangThai === 'DANG_GIAO_HANG').length;
  const countCompleted = contracts.filter((c) => c.trangThai === 'HOAN_THANH').length;

  const renderStatusBadge = (status) => {
    switch (status) {
      case 'CHO_ADMIN_DUYET':
        return <span className="wms-sc-badge pending"><FiClock /> 1. Chờ Admin Duyệt V1</span>;
      case 'CHO_SHOP_KY':
        return <span className="wms-sc-badge blue"><FiShield /> 2. Chờ Shop Ký Số</span>;
      case 'DA_KY_CHO_DUYET_KHO':
        return <span className="wms-sc-badge purple"><FiCheckCircle /> 3. Đã Ký • Chờ Admin Chuyển Kho</span>;
      case 'CHUYEN_QUA_KHO':
        return <span className="wms-sc-badge orange-alert"><FiBox /> 4. Chờ Thủ Kho Duyệt Lệnh</span>;
      case 'THU_KHO_DA_DUYET':
        return <span className="wms-sc-badge teal-alert"><FiTruck /> 5. Thủ Kho Đã Duyệt • Chờ NV Lên Đơn</span>;
      case 'DANG_GIAO_HANG':
        return <span className="wms-sc-badge shipping"><FiTruck /> 6. Đang Giao Sang Shop</span>;
      case 'HOAN_THANH':
        return <span className="wms-sc-badge completed"><FiCheck /> 7. Hoàn Tất (Shop Đã Nhận)</span>;
      case 'TU_CHOI':
        return <span className="wms-sc-badge rejected"><FiX /> Đã Từ Chối</span>;
      default:
        return <span className="wms-sc-badge">{status}</span>;
    }
  };

  return (
    <div className="wms-supply-contracts-page">
      {/* Toast Alert */}
      {alertNotice && (
        <div className="wms-sc-toast">
          <FiCheckCircle size={18} />
          <span>{alertNotice}</span>
        </div>
      )}

      {/* Header */}
      <div className="wms-sc-header">
        <div>
          <h2>Quản Lý Xuất Cung Ứng Hợp Đồng (Kho Tổng ➔ Cửa Hàng)</h2>
          <p>
            Tiếp nhận các hợp đồng đã ký số từ sàn Thương Mại Điện Tử. 
            Thủ kho phê duyệt lệnh điều chuyển và nhân viên kho thực hiện soạn hàng, lên đơn xuất kho.
          </p>
        </div>
        <button type="button" className="btn-wms-refresh" onClick={fetchContracts} disabled={isLoading}>
          <FiRefreshCw size={15} className={isLoading ? 'spinner' : ''} />
          {isLoading ? 'Đang nạp...' : 'Làm mới'}
        </button>
      </div>

      {/* Tabs lọc */}
      <div className="wms-sc-toolbar">
        <div className="wms-sc-tabs">
          <button 
            type="button" 
            className={`wms-sc-tab ${filterTab === 'ALL' ? 'active' : ''}`}
            onClick={() => setFilterTab('ALL')}
          >
            Tất Cả ({contracts.length})
          </button>
          <button 
            type="button" 
            className={`wms-sc-tab highlight-orange ${filterTab === 'PENDING_MANAGER' ? 'active' : ''}`}
            onClick={() => setFilterTab('PENDING_MANAGER')}
          >
            Chờ Thủ Kho Duyệt ({countPendingManager})
          </button>
          <button 
            type="button" 
            className={`wms-sc-tab highlight-teal ${filterTab === 'PENDING_STAFF' ? 'active' : ''}`}
            onClick={() => setFilterTab('PENDING_STAFF')}
          >
            Chờ NV Lên Đơn Xuất ({countPendingStaff})
          </button>
          <button 
            type="button" 
            className={`wms-sc-tab ${filterTab === 'SHIPPING' ? 'active' : ''}`}
            onClick={() => setFilterTab('SHIPPING')}
          >
            Đang Giao ({countShipping})
          </button>
          <button 
            type="button" 
            className={`wms-sc-tab ${filterTab === 'COMPLETED' ? 'active' : ''}`}
            onClick={() => setFilterTab('COMPLETED')}
          >
            Hoàn Tất ({countCompleted})
          </button>
        </div>

        <div className="wms-sc-search">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Tìm theo mã HĐ, tên gian hàng, mã kho..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Bảng Hợp Đồng */}
      <div className="wms-sc-table-card">
        {isLoading ? (
          <div className="wms-sc-loading">
            <FiRefreshCw size={24} className="spinner" />
            <p>Đang tải dữ liệu hợp đồng cung ứng từ Kho Tổng...</p>
          </div>
        ) : filteredContracts.length === 0 ? (
          <div className="wms-sc-empty">
            <FiFileText size={44} />
            <h4>Không có hợp đồng nào trong mục này</h4>
            <p>Khi các shop tạo yêu cầu cung ứng và được Admin chuyển lệnh, hợp đồng sẽ xuất hiện tại đây.</p>
          </div>
        ) : (
          <table className="wms-sc-table">
            <thead>
              <tr>
                <th>Mã Hợp Đồng</th>
                <th>Gian Hàng Nhận (Bên B)</th>
                <th>Tổng Mặt Hàng</th>
                <th>Tổng Giá Trị</th>
                <th>Trạng Thái</th>
                <th>Thao Tác Kho Tổng</th>
                <th>Chi Tiết</th>
              </tr>
            </thead>
            <tbody>
              {filteredContracts.map((c) => (
                <tr key={c.id}>
                  <td>
                    <strong className="code-highlight">{c.maHopDong}</strong>
                    <span className="date-sub">
                      {new Date(c.ngayTao).toLocaleDateString('vi-VN')}
                    </span>
                  </td>
                  <td>
                    <strong>{c.tenKhoCuaHang}</strong>
                    <span className="store-sub">Mã: {c.maKhoCuaHang}</span>
                  </td>
                  <td>
                    <strong>{c.tongSoLuongHang}</strong> cái 
                    <small style={{ color: '#64748b', display: 'block' }}>({c.soLuongMatHang} mã SP)</small>
                  </td>
                  <td>
                    <strong className="price-text">
                      {Number(c.tongTien).toLocaleString('vi-VN')} đ
                    </strong>
                  </td>
                  <td>
                    {renderStatusBadge(c.trangThai)}
                    {c.thongTinXuatKho?.maPhieuXuat && (
                      <span className="sub-note-link">
                        Mã PX: {c.thongTinXuatKho.maPhieuXuat}
                      </span>
                    )}
                  </td>
                  <td>
                    <div className="wms-actions-cell">
                      {/* Bước 1: Thủ kho duyệt */}
                      {c.trangThai === 'CHUYEN_QUA_KHO' && (
                        <button
                          type="button"
                          className="btn-wms-action approve-mgr"
                          onClick={() => setApproveModalContract(c)}
                        >
                          <FiCheckCircle size={14} /> Thủ Kho Duyệt Xuất
                        </button>
                      )}

                      {/* Bước 2: Nhân viên lên đơn và xuất kho */}
                      {c.trangThai === 'THU_KHO_DA_DUYET' && (
                        <button
                          type="button"
                          className="btn-wms-action dispatch-staff"
                          onClick={() => setDispatchModalContract(c)}
                        >
                          <FiTruck size={14} /> NV Lên Đơn & Xuất Kho
                        </button>
                      )}

                      {c.trangThai === 'DANG_GIAO_HANG' && (
                        <span className="state-info-text text-shipping">
                          🚚 Đang giao hàng sang shop
                        </span>
                      )}

                      {c.trangThai === 'HOAN_THANH' && (
                        <span className="state-info-text text-done">
                          ✓ Shop đã nhận & nhập kho
                        </span>
                      )}

                      {(c.trangThai === 'CHO_ADMIN_DUYET' || c.trangThai === 'CHO_SHOP_KY' || c.trangThai === 'DA_KY_CHO_DUYET_KHO') && (
                        <span className="state-info-text text-wait">
                          ⏳ Chờ hoàn tất thủ tục ký/duyệt
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <button 
                      type="button" 
                      className="btn-wms-view"
                      onClick={() => setViewingContract(c)}
                    >
                      <FiEye size={15} /> Xem
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* MODAL 1: THỦ KHO PHÊ DUYỆT LỆNH XUẤT */}
      {approveModalContract && (
        <div className="wms-sc-modal-overlay">
          <div className="wms-sc-modal-card">
            <div className="modal-header">
              <div className="header-title-wrap">
                <FiCheckCircle size={20} color="#059669" />
                <h3>Thủ Kho Phê Duyệt Lệnh Xuất Kho</h3>
              </div>
              <button type="button" className="btn-close" onClick={() => setApproveModalContract(null)}>
                <FiX size={18} />
              </button>
            </div>

            <div className="modal-body">
              <p>
                Xác nhận phê duyệt hợp đồng <strong>{approveModalContract.maHopDong}</strong> chuyển xuống cho 
                <strong> Nhân viên kho lên đơn xuất</strong> hàng cho gian hàng 
                <strong> {approveModalContract.tenKhoCuaHang}</strong>?
              </p>
              
              <div className="contract-brief-box">
                <div><strong>Tổng số lượng:</strong> {approveModalContract.tongSoLuongHang} sản phẩm</div>
                <div><strong>Tổng giá trị sỉ:</strong> {Number(approveModalContract.tongTien).toLocaleString('vi-VN')} VNĐ</div>
              </div>

              <div className="form-group-wms">
                <label>Ghi chú của Thủ kho:</label>
                <textarea
                  rows={3}
                  value={approveNote}
                  onChange={(e) => setApproveNote(e.target.value)}
                  placeholder="Nhập ghi chú cho nhân viên kho..."
                />
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn-modal-cancel" onClick={() => setApproveModalContract(null)}>
                Hủy bỏ
              </button>
              <button type="button" className="btn-modal-confirm approve" onClick={handleConfirmWarehouseApprove}>
                <FiCheck /> Xác Nhận Duyệt Lệnh
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: NHÂN VIÊN KHO LÊN ĐƠN VÀ XUẤT KHO */}
      {dispatchModalContract && (
        <div className="wms-sc-modal-overlay">
          <div className="wms-sc-modal-card">
            <div className="modal-header">
              <div className="header-title-wrap">
                <FiTruck size={20} color="#ea580c" />
                <h3>Nhân Viên Lên Đơn & Xuất Kho Cung Ứng</h3>
              </div>
              <button type="button" className="btn-close" onClick={() => setDispatchModalContract(null)}>
                <FiX size={18} />
              </button>
            </div>

            <div className="modal-body">
              <p>
                Thực hiện lập <strong>Phiếu Xuất Kho Cung Ứng</strong> và trừ tồn kho thực tế tại Kho Tổng cho hợp đồng 
                <strong> {dispatchModalContract.maHopDong}</strong>:
              </p>

              <div className="contract-brief-box">
                <div><strong>Gian hàng nhận:</strong> {dispatchModalContract.tenKhoCuaHang}</div>
                <div><strong>Tổng hàng xuất:</strong> {dispatchModalContract.tongSoLuongHang} cái ({dispatchModalContract.soLuongMatHang} mặt hàng)</div>
              </div>

              <div className="form-group-wms">
                <label>Đơn vị vận chuyển bàn giao:</label>
                <select
                  value={shippingProvider}
                  onChange={(e) => setShippingProvider(e.target.value)}
                >
                  <option value="CTUT Express Logistics">Đội Xe Vận Chuyển Nội Bộ CTUT</option>
                  <option value="Giao Hàng Tiết Kiệm (GHTK)">Giao Hàng Tiết Kiệm (GHTK)</option>
                  <option value="Viettel Post">Viettel Post</option>
                  <option value="VNPost Nhanh">VNPost Nhanh</option>
                </select>
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn-modal-cancel" onClick={() => setDispatchModalContract(null)}>
                Hủy bỏ
              </button>
              <button type="button" className="btn-modal-confirm dispatch" onClick={handleConfirmDispatch}>
                <FiTruck /> Xác Nhận Lên Đơn & Xuất Kho
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: XEM CHI TIẾT HỢP ĐỒNG */}
      {viewingContract && (
        <div className="wms-sc-modal-overlay">
          <div className="wms-sc-modal-card large">
            <div className="modal-header">
              <div className="header-title-wrap">
                <FiFileText size={20} color="#2563eb" />
                <h3>Chi Tiết Hợp Đồng Cung Ứng: {viewingContract.maHopDong}</h3>
              </div>
              <button type="button" className="btn-close" onClick={() => setViewingContract(null)}>
                <FiX size={18} />
              </button>
            </div>

            <div className="modal-body">
              <div className="detail-meta-grid">
                <div><span>Kho Cung Ứng:</span> <strong>{viewingContract.khoCungUng || 'Kho Tổng Trung Tâm'}</strong></div>
                <div><span>Gian Hàng Nhận:</span> <strong>{viewingContract.tenKhoCuaHang} ({viewingContract.maKhoCuaHang})</strong></div>
                <div><span>Người Đại Diện Ký:</span> <strong>{viewingContract.chuKyShop?.nguoiKy || '---'}</strong></div>
                <div><span>Trạng Thái Hiện Tại:</span> {renderStatusBadge(viewingContract.trangThai)}</div>
              </div>

              <h4 style={{ margin: '16px 0 8px 0', fontSize: '14px', color: '#0f172a' }}>Danh Sách Hàng Hóa Cung Ứng:</h4>
              <div className="modal-items-table-wrap">
                <table className="modal-items-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Tên Sản Phẩm</th>
                      <th>SKU</th>
                      <th>ĐVT</th>
                      <th style={{ textAlign: 'center' }}>Số Lượng</th>
                      <th style={{ textAlign: 'right' }}>Đơn Giá Sỉ</th>
                      <th style={{ textAlign: 'right' }}>Thành Tiền</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(viewingContract.danhSachHang || []).map((item, idx) => (
                      <tr key={idx}>
                        <td>{idx + 1}</td>
                        <td><strong>{item.tenHangHoa}</strong></td>
                        <td><code>{item.sku}</code></td>
                        <td>{item.donViTinh}</td>
                        <td style={{ textAlign: 'center' }}><strong>{item.soLuong}</strong></td>
                        <td style={{ textAlign: 'right' }}>{Number(item.donGiaSi).toLocaleString('vi-VN')} đ</td>
                        <td style={{ textAlign: 'right' }}><strong>{Number(item.thanhTien).toLocaleString('vi-VN')} đ</strong></td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={4}><strong>TỔNG CỘNG:</strong></td>
                      <td style={{ textAlign: 'center' }}><strong>{viewingContract.tongSoLuongHang}</strong></td>
                      <td></td>
                      <td style={{ textAlign: 'right', color: '#ea580c' }}>
                        <strong>{Number(viewingContract.tongTien).toLocaleString('vi-VN')} đ</strong>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Lịch sử nhật ký phê duyệt */}
              <h4 style={{ margin: '20px 0 8px 0', fontSize: '14px', color: '#0f172a' }}>Nhật Ký Duyệt & Chữ Ký:</h4>
              <div className="wms-log-box">
                <div>• <strong>Admin Duyệt V1:</strong> {viewingContract.adminDuyetVong1?.daDuyet ? `Đã duyệt bởi ${viewingContract.adminDuyetVong1.nguoiDuyet} (${new Date(viewingContract.adminDuyetVong1.ngayDuyet).toLocaleString('vi-VN')})` : 'Chưa duyệt'}</div>
                <div>• <strong>Chữ Ký Số Shop:</strong> {viewingContract.chuKyShop?.daKy ? `Đã ký bởi ${viewingContract.chuKyShop.nguoiKy} - Hash: ${viewingContract.chuKyShop.maChuKySo}` : 'Chưa ký'}</div>
                <div>• <strong>Admin Chuyển Kho:</strong> {viewingContract.adminDuyetVong2?.daDuyet ? `Đã chuyển bởi ${viewingContract.adminDuyetVong2.nguoiDuyet} (${new Date(viewingContract.adminDuyetVong2.ngayDuyet).toLocaleString('vi-VN')})` : 'Chưa chuyển'}</div>
                <div>• <strong>Thủ Kho Phê Duyệt:</strong> {viewingContract.thuKhoDuyet?.daDuyet ? `Thủ kho ${viewingContract.thuKhoDuyet.nguoiDuyet} đã duyệt (${new Date(viewingContract.thuKhoDuyet.ngayDuyet).toLocaleString('vi-VN')}) - Ghi chú: ${viewingContract.thuKhoDuyet.ghiChu}` : 'Chờ thủ kho duyệt...'}</div>
                <div>• <strong>Nhân Viên Lên Đơn:</strong> {viewingContract.thongTinXuatKho?.daLenDon ? `Phiếu xuất #${viewingContract.thongTinXuatKho.maPhieuXuat} lập bởi ${viewingContract.thongTinXuatKho.nguoiXuat} (${new Date(viewingContract.thongTinXuatKho.ngayXuat).toLocaleString('vi-VN')})` : 'Chưa xuất kho...'}</div>
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn-modal-cancel" onClick={() => setViewingContract(null)}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupplyContractList;
