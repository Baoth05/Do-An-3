/**
 * ==============================================================================
 * Module: marketplaceService.js
 * Mô tả: Cổng kết nối API Sàn Thương Mại Điện Tử & Kênh Người Bán (Seller Portal).
 * Chức năng:
 *   - Khách mua: Lấy sản phẩm mở bán, Gian hàng, Voucher, Đặt đơn hàng, Đánh giá, Bình luận.
 *   - Chủ shop (Seller):
 *       + Đăng ký gian hàng & Tạo kho riêng (POST /stores)
 *       + Ký hợp đồng cung ứng & Nhập hàng từ Kho Tổng về Kho riêng (POST /inventory/add)
 *       + Quản lý kho hàng shop, Đăng bán / Ngừng bán sản phẩm (PUT /inventory/{id}/publish)
 *       + Xử lý đơn hàng của shop, Tạo voucher shop, Cập nhật thông tin shop.
 * ==============================================================================
 */
import api from './api';

// Helper lấy thông tin khách hàng hiện tại từ localStorage
const getCurrentCustomerUser = () => {
  try {
    const raw = localStorage.getItem('customer_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

// Hợp đồng cung ứng được lưu trên backend (wms-core-service: /supply-contracts)
const notifyContractsUpdated = (contract) => {
  window.dispatchEvent(new CustomEvent('supply-contracts-updated', { detail: contract }));
  return contract;
};

const readApiError = (err, fallback) => {
  const data = err?.response?.data;
  if (typeof data === 'string' && data) return data;
  return data?.message || err?.message || fallback;
};

export const marketplaceService = {
  // ==================== DÀNH CHO KHÁCH HÀNG (MARKETPLACE) ====================

  // Lấy danh sách sản phẩm ĐANG ĐƯỢC CHỦ SHOP ĐĂNG BÁN trên sàn (dangBan == true & tonKho > 0) từ DB
  getMarketplaceProducts: async () => {
    try {
      const res = await api.get('/inventory/marketplace');
      return Array.isArray(res) ? res : [];
    } catch (err) {
      console.warn('Lỗi gọi /inventory/marketplace:', err?.message);
      return [];
    }
  },

  // Lấy chi tiết 1 sản phẩm theo ID
  getProductById: async (productId) => {
    try {
      return await api.get(`/products/${productId}`);
    } catch (err) {
      console.warn(`Lỗi gọi /products/${productId}:`, err?.message);
      return null;
    }
  },

  // Lấy danh sách Gian hàng thật trên Sàn
  getStores: async () => {
    try {
      const res = await api.get('/stores');
      return Array.isArray(res) ? res : [];
    } catch (err) {
      console.warn('Lỗi gọi /stores:', err?.message);
      return [];
    }
  },

  // Lấy chi tiết Gian hàng theo ID
  getStoreById: async (id) => {
    try {
      return await api.get(`/stores/${id}`);
    } catch (err) {
      console.warn(`Lỗi gọi /stores/${id}:`, err?.message);
      return null;
    }
  },

  // Lấy Gian hàng / Kho riêng thuộc quyền sở hữu của 1 Chủ shop cụ thể
  getStoreByManager: async (userId) => {
    try {
      const res = await api.get(`/stores/manager/${userId}`);
      if (res && res.id) return res;
    } catch (err) {
      console.warn(`Lỗi gọi /stores/manager/${userId}:`, err?.message);
    }
    return null;
  },

  // Lấy các sản phẩm ĐANG MỞ BÁN của 1 Gian hàng cụ thể
  getProductsByStore: async (storeId) => {
    try {
      const res = await api.get(`/inventory/store/${storeId}`);
      if (Array.isArray(res)) {
        return res.filter((item) => item.dangBan === true);
      }
      return [];
    } catch (err) {
      console.warn(`Lỗi gọi /inventory/store/${storeId}:`, err?.message);
      return [];
    }
  },

  // Lấy Voucher toàn sàn
  getGlobalVouchers: async () => {
    try {
      const res = await api.get('/vouchers/global');
      if (Array.isArray(res) && res.length > 0) return res;
    } catch (err) {
      console.warn('Lỗi gọi /vouchers/global:', err?.message);
    }

    // Voucher mặc định toàn sàn
    return [

    ];
  },

  // Lấy Voucher riêng của từng Shop (Luôn đảm bảo hiển thị đúng mã tại gian hàng)
  getStoreVouchers: async (storeId) => {
    try {
      const res = await api.get(`/vouchers/store/${storeId}`);
      if (Array.isArray(res)) return res;
    } catch (err) {
      console.warn(`Lỗi gọi /vouchers/store/${storeId}:`, err?.message);
    }
    return [];
  },
  getAllStoreVouchers: async () => {
    try {
      const res = await api.get('/vouchers/stores');
      if (Array.isArray(res)) return res;
    } catch (err) {
      console.warn('Lỗi gọi /vouchers/stores:', err?.message);
    }
    return [];
  },

  // Kiểm tra mã voucher hợp lệ (Thông minh: Hỗ trợ cả API lẫn Cache LocalStorage và Fallback)
  checkVoucher: async (code) => {
    if (!code) throw new Error('Vui lòng nhập mã giảm giá!');
    const normalizedCode = code.trim().toUpperCase();

    try {
      const res = await api.get(`/vouchers/check/${normalizedCode}`);
      if (res && res.maVoucher) return res;
    } catch (err) {
      throw new Error(`Mã giảm giá "${normalizedCode}" không tồn tại, đã hết hạn hoặc lỗi kết nối!`);
    }
  },

  // Ví voucher đã lưu: trình duyệt chỉ lưu MÃ; thông tin & hiệu lực luôn lấy từ backend (/vouchers/check)
  getUserSavedVouchers: async () => {
    const customer = getCurrentCustomerUser();
    const key = customer?.taiKhoan ? `customer_vouchers_${customer.taiKhoan}` : 'user_saved_vouchers';
    let codes = [];
    try {
      const raw = JSON.parse(localStorage.getItem(key) || '[]');
      codes = raw.map((item) => (typeof item === 'string' ? item : item?.maVoucher))
        .filter(Boolean)
        .map((c) => c.trim().toUpperCase());
    } catch (e) {
      console.warn(e);
    }
    codes = [...new Set(codes)];

    // Xác minh từng mã: mã hết hạn / hết lượt / không tồn tại sẽ bị loại khỏi ví
    const results = await Promise.allSettled(codes.map((c) => marketplaceService.checkVoucher(c)));
    const valid = results.filter((r) => r.status === 'fulfilled' && r.value?.maVoucher).map((r) => r.value);
    if (valid.length !== codes.length) {
      localStorage.setItem(key, JSON.stringify(valid.map((v) => v.maVoucher)));
    }
    return valid;
  },

  // Lưu mã vào ví: chỉ lưu được mã đang còn hiệu lực trên hệ thống
  saveUserVoucher: async (voucher) => {
    const code = (typeof voucher === 'string' ? voucher : voucher?.maVoucher || '').trim().toUpperCase();
    const vObj = await marketplaceService.checkVoucher(code); // ném lỗi nếu mã không hợp lệ
    const customer = getCurrentCustomerUser();
    const key = customer?.taiKhoan ? `customer_vouchers_${customer.taiKhoan}` : 'user_saved_vouchers';
    let codes = [];
    try {
      codes = JSON.parse(localStorage.getItem(key) || '[]').map((i) => (typeof i === 'string' ? i : i?.maVoucher));
    } catch { /* ví trống */ }
    localStorage.setItem(key, JSON.stringify([vObj.maVoucher, ...codes.filter((c) => c && c !== vObj.maVoucher)]));
    return vObj;
  },

  removeUserSavedVoucher: async (code) => {
    const normalized = code.trim().toUpperCase();
    const customer = getCurrentCustomerUser();
    const key = customer?.taiKhoan ? `customer_vouchers_${customer.taiKhoan}` : 'user_saved_vouchers';
    try {
      const codes = JSON.parse(localStorage.getItem(key) || '[]')
        .map((i) => (typeof i === 'string' ? i : i?.maVoucher))
        .filter((c) => c && c !== normalized);
      localStorage.setItem(key, JSON.stringify(codes));
    } catch (e) {
      console.warn(e);
    }
    return marketplaceService.getUserSavedVouchers();
  },

  isVoucherSaved: (savedList, code) => {
    if (!savedList || !code) return false;
    return savedList.some((v) => (v.maVoucher || v) === code);
  },

  // Đặt hàng Đa Shop (Tách đơn tự động Order Splitting)
  checkoutMultiShop: async (payload) => {
    return await api.post('/orders/checkout-multishop', payload);
  },

  // Lấy lịch sử đơn hàng của User (chỉ từ backend)
  getUserOrders: async (userId) => {
    if (!userId) throw new Error('Vui lòng đăng nhập để xem đơn hàng!');
    try {
      const res = await api.get(`/orders/user/${userId}`);
      return Array.isArray(res) ? res : [];
    } catch (err) {
      throw new Error(readApiError(err, 'Không tải được danh sách đơn hàng!'), { cause: err });
    }
  },

  // Hủy đơn hàng (Khi trạng thái PENDING)
  cancelOrder: async (orderId) => {
    return await api.put(`/orders/${orderId}/cancel`);
  },

  // Tạo thanh toán MoMo QR
  createPayment: async (data) => {
    return await api.post('/payments/create', data);
  },

  // Gửi xác thực thanh toán Crypto
  submitCryptoPayment: async (data) => {
    return await api.post('/payments/crypto/submit', data);
  },

  // Lấy đánh giá sản phẩm thật
  getReviews: async (maHangHoa) => {
    try {
      const res = await api.get(`/interactions/danh-gia/${maHangHoa}`);
      return Array.isArray(res) ? res : [];
    } catch (err) {
      console.warn(`Lỗi gọi /interactions/danh-gia/${maHangHoa}:`, err?.message);
      return [];
    }
  },

  // Gửi đánh giá mới thật
  createReview: async (reviewData) => {
    return await api.post('/interactions/danh-gia', reviewData);
  },

  // Lấy bình luận thật
  getComments: async (maHangHoa) => {
    try {
      const res = await api.get(`/interactions/binh-luan/${maHangHoa}`);
      return Array.isArray(res) ? res : [];
    } catch (err) {
      console.warn(`Lỗi gọi /interactions/binh-luan/${maHangHoa}:`, err?.message);
      return [];
    }
  },

  // Gửi bình luận mới thật
  createComment: async (commentData) => {
    return await api.post('/interactions/binh-luan', commentData);
  },

  // Cập nhật thông tin cá nhân khách hàng
  updateUserProfile: async (userId, profileData) => {
    try {
      return await api.put(`/auth/users/${userId}`, profileData);
    } catch (err) {
      throw new Error(readApiError(err, 'Cập nhật thông tin thất bại!'), { cause: err });
    }
  },

  // Đổi mật khẩu tài khoản
  changePassword: async (taiKhoan, passwordData) => {
    return await api.put(`/auth/change-password/${taiKhoan}`, passwordData);
  },

  // ==================== DÀNH CHO CHỦ CỬA HÀNG (SELLER PORTAL) ====================

  // Đăng ký Gian Hàng mới & Khởi tạo Kho Riêng cho Cửa Hàng
  createStore: async (storeData) => {
    // storeData: { maKho, tenKho, diaChi, soDienThoai, email, sucChuaToiDa, moTaGianHang, anhDaiDienShop, loaiHinh: 'KHO_CUA_HANG', quanLyId }
    try {
      return await api.post('/stores', storeData);
    } catch (err) {
      throw new Error(readApiError(err, 'Tạo gian hàng thất bại!'), { cause: err });
    }
  },

  // Lấy toàn bộ hàng tồn kho của Shop (bao gồm cả hàng đang bán và hàng chưa đăng bán)
  getSellerInventory: async (storeId) => {
    try {
      const res = await api.get(`/inventory/store/${storeId}`);
      return Array.isArray(res) ? res : [];
    } catch (err) {
      console.warn(`Lỗi gọi /inventory/store/${storeId}:`, err?.message);
      return [];
    }
  },

  // Lấy Master Catalog danh mục sản phẩm chuẩn hệ thống từ DB
  getMasterProducts: async () => {
    try {
      const res = await api.get('/products');
      if (Array.isArray(res) && res.length > 0) return res;
    } catch (err) {
      console.warn('Lỗi gọi /products từ DB:', err?.message);
    }
    return [];
  },

  // Lấy Kho Tổng Trung Tâm duy nhất từ Cơ sở dữ liệu (Bên A)
  getSingleCentralWarehouse: async () => {
    try {
      // 1. Thử gọi trực tiếp endpoint /warehouses/central
      try {
        const directCentral = await api.get('/warehouses/central');
        if (directCentral && directCentral.id) return directCentral;
      } catch (e) {
        // Fallback tiếp tục lấy qua /warehouses
      }

      const res = await api.get('/warehouses');
      if (Array.isArray(res) && res.length > 0) {
        // Tìm kho tổng duy nhất: Loại hình KHO_TONG hoặc mã KHO- và không phải Shop/Cửa hàng
        const central = res.find((w) => {
          const type = (w.loaiHinh || '').toUpperCase();
          const code = (w.maKho || '').toUpperCase();
          const name = (w.tenKho || '').toUpperCase();
          return type === 'KHO_TONG' || (code.startsWith('KHO-') && !name.includes('SHOP') && !name.includes('STORE'));
        }) || res.find((w) => (w.loaiHinh || '').toUpperCase() !== 'KHO_CUA_HANG') || res[0];

        if (central) return central;
      }
    } catch (err) {
      console.warn('Lỗi lấy kho tổng từ CSDL:', err?.message);
    }
    return null;
  },

  // Tương thích ngược: Trả về mảng chứa Kho Tổng duy nhất từ DB
  getCentralWarehouses: async () => {
    const single = await marketplaceService.getSingleCentralWarehouse();
    return single ? [single] : [];
  },

  // Nhập hàng vào kho của Cửa hàng sau khi đã ký Hợp đồng
  importStockToStore: async (importItem) => {
    // importItem: { sanPhamId, khoHangId, soLuong }
    try {
      return await api.post('/inventory/add', importItem);
    } catch (err) {
      throw new Error(readApiError(err, 'Nhập hàng thất bại!'), { cause: err });
    }
  },

  // Lấy tồn kho thực tế của Kho Tổng Duy Nhất trực tiếp từ CSDL (Không dùng bất kỳ dữ liệu giả nào)
  getWarehouseInventory: async (warehouseId) => {
    // 1. Thử gọi API tồn kho chi tiết theo kho tổng (/inventory/warehouse/{warehouseId}) từ CSDL bảng ton_kho
    try {
      if (warehouseId) {
        const res = await api.get(`/inventory/warehouse/${warehouseId}`);
        if (Array.isArray(res) && res.length > 0) {
          return res.map((i) => ({
            id: i.id,
            sanPhamId: i.sanPhamId || i.id,
            sku: i.sku || `SP00${i.sanPhamId || i.id}`,
            tenSanPham: i.tenSanPham || i.tenHangHoa || 'Sản phẩm',
            tenHangHoa: i.tenSanPham || i.tenHangHoa || 'Sản phẩm',
            donViTinh: i.donViTinh || 'Cái',
            giaBan: i.giaBan || i.giaBanHienTai || 0,
            giaNhap: i.giaNhap || (i.giaBan ? Math.round(i.giaBan * 0.9) : 0),
            soLuongThucTe: i.soLuongThucTe || 0,
            soLuongKhaDung: i.soLuongKhaDung !== undefined ? i.soLuongKhaDung : (i.soLuongThucTe || 0),
            soLuongTonKho: i.soLuongKhaDung !== undefined ? i.soLuongKhaDung : (i.soLuongThucTe || 0),
            danhMuc: i.danhMuc || '',
            hinhAnh: i.hinhAnh || '',
            moTa: i.moTa || '',
            khoHangId: i.khoHangId,
          }));
        }
      }
    } catch (err) {
      console.warn(`Lỗi gọi /inventory/warehouse/${warehouseId} từ DB:`, err?.message);
    }

    // 2. Thử gọi API toàn bộ tồn kho hệ thống (/inventory)
    try {
      const all = await api.get('/inventory');
      if (Array.isArray(all) && all.length > 0) {
        const filtered = warehouseId ? all.filter((i) => String(i.khoHangId) === String(warehouseId)) : all;
        if (filtered.length > 0) {
          return filtered.map((i) => ({
            id: i.id,
            sanPhamId: i.sanPhamId || i.id,
            sku: i.sku || `SP00${i.sanPhamId || i.id}`,
            tenSanPham: i.tenSanPham || i.tenHangHoa || 'Sản phẩm',
            tenHangHoa: i.tenSanPham || i.tenHangHoa || 'Sản phẩm',
            donViTinh: i.donViTinh || 'Cái',
            giaBan: i.giaBan || i.giaBanHienTai || 0,
            giaNhap: i.giaNhap || (i.giaBan ? Math.round(i.giaBan * 0.9) : 0),
            soLuongThucTe: i.soLuongThucTe || 0,
            soLuongKhaDung: i.soLuongKhaDung !== undefined ? i.soLuongKhaDung : (i.soLuongThucTe || 0),
            soLuongTonKho: i.soLuongKhaDung !== undefined ? i.soLuongKhaDung : (i.soLuongThucTe || 0),
            danhMuc: i.danhMuc || '',
            hinhAnh: i.hinhAnh || '',
            moTa: i.moTa || '',
            khoHangId: i.khoHangId,
          }));
        }
      }
    } catch (e) {
      console.warn('Lỗi gọi /inventory từ DB:', e?.message);
    }

    // 3. Nếu kho tổng chưa phân bổ vị trí kệ, lấy từ danh mục Sản Phẩm Master trong CSDL (/products)
    try {
      const prods = await api.get('/products');
      if (Array.isArray(prods) && prods.length > 0) {
        return prods.map((p) => ({
          id: p.id,
          sanPhamId: p.id,
          sku: p.sku || `SP00${p.id}`,
          tenSanPham: p.tenSanPham || 'Sản phẩm',
          tenHangHoa: p.tenSanPham || 'Sản phẩm',
          donViTinh: p.donViTinh || 'Cái',
          giaBan: p.giaBan || 0,
          giaNhap: p.giaNhap || (p.giaBan ? Math.round(p.giaBan * 0.9) : 0),
          soLuongThucTe: p.soLuongThucTe !== undefined ? p.soLuongThucTe : (p.soLuongTonKho || 50),
          soLuongKhaDung: p.soLuongKhaDung !== undefined ? p.soLuongKhaDung : (p.soLuongThucTe || 50),
          soLuongTonKho: p.soLuongTonKho !== undefined ? p.soLuongTonKho : (p.soLuongKhaDung || 50),
          danhMuc: p.tenDanhMuc || p.danhMuc?.tenDanhMuc || p.danhMuc || '',
          hinhAnh: p.hinhAnh || '',
          moTa: p.moTa || '',
          khoHangId: warehouseId,
        }));
      }
    } catch (err2) {
      console.warn('Lỗi gọi /products từ DB:', err2?.message);
    }

    // TUYỆT ĐỐI KHÔNG DÙNG DỮ LIỆU GIẢ: Trả về rỗng [] nếu CSDL chưa có dữ liệu sản phẩm
    return [];
  },

  // ==================== HỢP ĐỒNG CUNG ỨNG KHO TỔNG -> CỬA HÀNG (BACKEND) ====================

  // Lấy danh sách hợp đồng cung ứng của Shop
  getStoreContracts: async (storeId) => {
    try {
      const res = await api.get('/supply-contracts', { params: { storeId } });
      return Array.isArray(res) ? res : [];
    } catch (err) {
      throw new Error(readApiError(err, 'Không tải được danh sách hợp đồng!'), { cause: err });
    }
  },

  // Lấy toàn bộ hợp đồng cung ứng toàn hệ thống (Admin / Kho tổng)
  getAllSupplyContracts: async () => {
    try {
      const res = await api.get('/supply-contracts');
      return Array.isArray(res) ? res : [];
    } catch (err) {
      throw new Error(readApiError(err, 'Không tải được danh sách hợp đồng!'), { cause: err });
    }
  },

  // Lấy chi tiết một hợp đồng cung ứng theo ID
  getSupplyContractById: async (contractId) => {
    try {
      const res = await api.get(`/supply-contracts/${contractId}`);
      return res;
    } catch (err) {
      throw new Error(readApiError(err, 'Không tải được chi tiết hợp đồng!'), { cause: err });
    }
  },

  // Bước 1: Shop gửi yêu cầu (server tự sinh mã hợp đồng và tính giá sỉ)
  createSupplyContractRequest: async (contractData) => {
    try {
      const res = await api.post('/supply-contracts', {
        storeId: contractData.storeId,
        khoTongId: contractData.khoTongId,
        nguoiYeuCau: contractData.nguoiYeuCau,
        chucVuYeuCau: contractData.chucVuYeuCau,
        danhSachHang: (contractData.danhSachHang || []).map((i) => ({
          sanPhamId: i.sanPhamId,
          soLuong: i.soLuong,
        })),
      });
      return notifyContractsUpdated(res);
    } catch (err) {
      throw new Error(readApiError(err, 'Gửi yêu cầu hợp đồng thất bại!'), { cause: err });
    }
  },

  // Bước 2: Admin duyệt yêu cầu (Vòng 1)
  adminApproveContractRequest: async (contractId, adminInfo = {}) => {
    try {
      const res = await api.put(`/supply-contracts/${contractId}/approve-request`, { note: adminInfo.note });
      return notifyContractsUpdated(res);
    } catch (err) {
      throw new Error(readApiError(err, 'Duyệt yêu cầu thất bại!'), { cause: err });
    }
  },

  // Bước 3: Shop ký số điện tử
  shopSignContract: async (contractId, signInfo) => {
    try {
      const res = await api.put(`/supply-contracts/${contractId}/sign`, {
        signerName: signInfo.signerName,
        signerRole: signInfo.signerRole,
        signaturePin: signInfo.signaturePin,
        agreedTerms: !!signInfo.agreedTerms,
      });
      return notifyContractsUpdated(res);
    } catch (err) {
      throw new Error(readApiError(err, 'Ký số thất bại!'), { cause: err });
    }
  },

  // Bước 4: Admin duyệt vòng 2 -> chuyển lệnh sang Kho Tổng
  adminApproveAndTransferToWarehouse: async (contractId, adminInfo = {}) => {
    try {
      const res = await api.put(`/supply-contracts/${contractId}/approve-transfer`, { note: adminInfo.note });
      return notifyContractsUpdated(res);
    } catch (err) {
      throw new Error(readApiError(err, 'Duyệt chuyển kho thất bại!'), { cause: err });
    }
  },

  // Bước 5: Kho Tổng xuất hàng (backend trừ tồn Kho Tổng + lập phiếu xuất + ghi thẻ kho)
  warehouseDispatchContractOrder: async (contractId, warehouseStaffInfo = {}) => {
    try {
      const res = await api.put(`/supply-contracts/${contractId}/dispatch`, {
        shippingProvider: warehouseStaffInfo.shippingProvider,
      });
      return notifyContractsUpdated(res);
    } catch (err) {
      throw new Error(readApiError(err, 'Xuất kho thất bại!'), { cause: err });
    }
  },

  // Bước 6: Shop xác nhận nhận hàng (backend cộng tồn kho shop + ghi thẻ kho)
  completeContractDelivery: async (contractId) => {
    try {
      const res = await api.put(`/supply-contracts/${contractId}/complete`);
      return notifyContractsUpdated(res);
    } catch (err) {
      throw new Error(readApiError(err, 'Xác nhận nhận hàng thất bại!'), { cause: err });
    }
  },

  // Từ chối / rút yêu cầu hợp đồng
  rejectSupplyContract: async (contractId, reason = 'Không đủ điều kiện cung ứng') => {
    try {
      const res = await api.put(`/supply-contracts/${contractId}/reject`, { reason });
      return notifyContractsUpdated(res);
    } catch (err) {
      throw new Error(readApiError(err, 'Từ chối hợp đồng thất bại!'), { cause: err });
    }
  },

  // Chủ shop BẬT / TẮT đăng bán sản phẩm lên Sàn TMĐT và định giá bán lẻ
  publishProductToMarketplace: async (inventoryId, publishData) => {
    try {
      const res = await api.put(`/inventory/${inventoryId}/publish`, publishData);
      window.dispatchEvent(new CustomEvent('seller-inventory-updated', { detail: res }));
      return res;
    } catch (err) {
      throw new Error(readApiError(err, 'Đăng bán thất bại!'), { cause: err });
    }
  },

  // Lấy danh sách toàn bộ đơn hàng thuộc quyền quản lý của Gian hàng
  getStoreOrders: async (storeId) => {
    try {
      const res = await api.get(`/orders/store/${storeId}`);
      return Array.isArray(res) ? res : [];
    } catch (err) {
      console.warn(`Lỗi gọi /orders/store/${storeId}:`, err?.message);
      return [];
    }
  },

  // Chủ shop cập nhật trạng thái đơn hàng (CONFIRMED, SHIPPED, COMPLETED, CANCELLED)
  updateStoreOrderStatus: async (orderId, status) => {
    return await api.put(`/orders/${orderId}/status?status=${status}`);
  },

  // Chủ shop cập nhật trạng thái vận chuyển và Đơn vị giao vận
  updateShippingStatus: async (orderId, shippingStatus, donViVanChuyen) => {
    let url = `/orders/${orderId}/shipping-status?shippingStatus=${shippingStatus}`;
    if (donViVanChuyen) {
      url += `&donViVanChuyen=${encodeURIComponent(donViVanChuyen)}`;
    }
    return await api.put(url);
  },

  // Chủ shop tạo Voucher khuyến mãi riêng cho Gian hàng của mình
  createStoreVoucher: async (voucherData) => {
    try {
      return await api.post('/vouchers', voucherData);
    } catch (err) {
      throw new Error(readApiError(err, 'Tạo voucher thất bại!'), { cause: err });
    }
  },

  // Chủ shop hủy phát hành Voucher (backend kết thúc hiệu lực ngay, khách không dùng được nữa)
  deleteStoreVoucher: async (_storeId, maVoucher) => {
    try {
      return await api.put(`/vouchers/${encodeURIComponent(maVoucher)}/deactivate`);
    } catch (err) {
      throw new Error(readApiError(err, 'Hủy phát hành voucher thất bại!'), { cause: err });
    }
  },

  // Cập nhật thông tin Gian hàng
  updateStoreProfile: async (storeId, storeData) => {
    return await api.put(`/stores/${storeId}`, storeData);
  },
};
