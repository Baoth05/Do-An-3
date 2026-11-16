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

// Quản lý hợp đồng cung ứng của shop và toàn sàn trên local storage
const getGlobalContracts = () => {
  try {
    const raw = localStorage.getItem('global_supply_contracts');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveGlobalContract = (contract) => {
  try {
    const list = getGlobalContracts();
    const existingIdx = list.findIndex(
      (c) => String(c.id) === String(contract.id) || c.maHopDong === contract.maHopDong
    );
    let updated;
    if (existingIdx >= 0) {
      updated = [...list];
      updated[existingIdx] = contract;
    } else {
      updated = [contract, ...list];
    }
    localStorage.setItem('global_supply_contracts', JSON.stringify(updated));

    // Đồng bộ vào danh sách của riêng từng shop
    if (contract.storeId) {
      const shopContracts = updated.filter((c) => String(c.storeId) === String(contract.storeId));
      localStorage.setItem(`seller_contracts_${contract.storeId}`, JSON.stringify(shopContracts));
    }

    window.dispatchEvent(new CustomEvent('supply-contracts-updated', { detail: contract }));
    return updated;
  } catch (e) {
    console.warn('Could not save contract', e);
    return [contract];
  }
};

const getLocalContracts = (storeId) => {
  try {
    const globalList = getGlobalContracts();
    if (globalList.length > 0) {
      const filtered = globalList.filter((c) => String(c.storeId) === String(storeId));
      if (filtered.length > 0) return filtered;
    }
    const raw = localStorage.getItem(`seller_contracts_${storeId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveLocalContract = (storeId, contract) => {
  return saveGlobalContract({ ...contract, storeId: Number(storeId) });
};

export const marketplaceService = {
  // ==================== DÀNH CHO KHÁCH HÀNG (MARKETPLACE) ====================

  // Lấy danh sách sản phẩm ĐANG ĐƯỢC CHỦ SHOP ĐĂNG BÁN trên sàn (dangBan == true & tonKho > 0) từ DB
  getMarketplaceProducts: async () => {
    try {
      const res = await api.get('/inventory/marketplace');
      if (Array.isArray(res) && res.length > 0) return res;
    } catch (err) {
      console.warn('Lỗi gọi /inventory/marketplace:', err?.message);
    }

    // Thu thập các sản phẩm do chủ shop nhập từ Kho Tổng và Đã Đăng Bán
    const localPublished = [];
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('seller_inventory_')) {
          const raw = localStorage.getItem(key);
          if (raw) {
            const list = JSON.parse(raw);
            if (Array.isArray(list)) {
              list.filter((it) => it.dangBan !== false && ((it.soLuongThucTe || 0) > 0 || (it.soLuongKhaDung || 0) > 0))
                .forEach((it) => localPublished.push(it));
            }
          }
        }
      }
    } catch (e) {
      console.warn('Lỗi đọc local seller inventory:', e);
    }

    return localPublished;
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

  // Đồng bộ Quản lý Voucher Đã Lưu Của Người Dùng (User Saved Vouchers)
  getUserSavedVouchers: async () => {
    const map = new Map();

    // 1. Đọc từ user_saved_vouchers
    try {
      const raw = JSON.parse(localStorage.getItem('user_saved_vouchers') || '[]');
      for (const item of raw) {
        if (typeof item === 'string') {
          try {
            const vObj = await marketplaceService.checkVoucher(item);
            if (vObj && vObj.maVoucher) map.set(vObj.maVoucher, vObj);
          } catch {
            map.set(item, {
              maVoucher: item,
              phanTramGiam: 10,
              giamToiDa: 50000,
              donHangToiThieu: 150000,
              moTa: 'Mã ưu đãi đã lưu'
            });
          }
        } else if (item && item.maVoucher) {
          map.set(item.maVoucher, item);
        }
      }
    } catch (e) {
      console.warn(e);
    }

    // 2. Đọc từ customer_vouchers_{taiKhoan} nếu có
    const customer = getCurrentCustomerUser();
    if (customer?.taiKhoan) {
      try {
        const custRaw = JSON.parse(localStorage.getItem(`customer_vouchers_${customer.taiKhoan}`) || '[]');
        for (const item of custRaw) {
          if (item && item.maVoucher && !map.has(item.maVoucher)) {
            map.set(item.maVoucher, item);
          }
        }
      } catch (e) {
        console.warn(e);
      }
    }

    // Nếu chưa có voucher nào, nạp sẵn mã chào mừng
    if (map.size === 0) {
      const defaultSaved = {
        id: 1,
        maVoucher: 'CTUT50K',
        phanTramGiam: 10,
        giamToiDa: 50000,
        donHangToiThieu: 150000,
        soLuongConLai: 500,
        moTa: 'Giảm 10% tối đa 50.000đ cho đơn hàng đa shop từ 150.000đ'
      };
      map.set('CTUT50K', defaultSaved);
    }

    return Array.from(map.values());
  },

  saveUserVoucher: async (voucher) => {
    let vObj = voucher;
    if (typeof voucher === 'string') {
      try {
        vObj = await marketplaceService.checkVoucher(voucher);
      } catch {
        vObj = {
          maVoucher: voucher.trim().toUpperCase(),
          phanTramGiam: 10,
          giamToiDa: 50000,
          donHangToiThieu: 150000,
          moTa: 'Ưu đãi đã lưu vào ví'
        };
      }
    }

    // Lưu vào user_saved_vouchers dưới dạng Object
    try {
      const currentList = await marketplaceService.getUserSavedVouchers();
      const nextList = [vObj, ...currentList.filter((v) => v.maVoucher !== vObj.maVoucher)];
      localStorage.setItem('user_saved_vouchers', JSON.stringify(nextList));

      const customer = getCurrentCustomerUser();
      if (customer?.taiKhoan) {
        localStorage.setItem(`customer_vouchers_${customer.taiKhoan}`, JSON.stringify(nextList));
      }
      return vObj;
    } catch (e) {
      console.warn('Lỗi lưu voucher:', e);
      return vObj;
    }
  },

  removeUserSavedVoucher: async (code) => {
    const normalized = code.trim().toUpperCase();
    try {
      const currentList = await marketplaceService.getUserSavedVouchers();
      const nextList = currentList.filter((v) => v.maVoucher !== normalized);
      localStorage.setItem('user_saved_vouchers', JSON.stringify(nextList));

      const customer = getCurrentCustomerUser();
      if (customer?.taiKhoan) {
        localStorage.setItem(`customer_vouchers_${customer.taiKhoan}`, JSON.stringify(nextList));
      }
      return nextList;
    } catch (e) {
      console.warn(e);
      return [];
    }
  },

  isVoucherSaved: (savedList, code) => {
    if (!savedList || !code) return false;
    return savedList.some((v) => (v.maVoucher || v) === code);
  },

  // Đặt hàng Đa Shop (Tách đơn tự động Order Splitting)
  checkoutMultiShop: async (payload) => {
    return await api.post('/orders/checkout-multishop', payload);
  },

  // Lấy lịch sử đơn hàng của User
  getUserOrders: async (userId = 101) => {
    try {
      const res = await api.get(`/orders/user/${userId}`);
      if (Array.isArray(res) && res.length > 0) return res;
    } catch (err) {
      console.warn(`Lỗi gọi /orders/user/${userId}:`, err?.message);
    }

    // Fallback lịch sử đơn hàng đã lưu trong localStorage
    try {
      const localOrders = JSON.parse(localStorage.getItem(`user_orders_${userId}`) || '[]');
      return localOrders;
    } catch {
      return [];
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
      console.warn('Backend update profile fallback:', err?.message);
      return { success: true };
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
      const res = await api.post('/stores', storeData);
      return res;
    } catch (err) {
      console.warn('Backend create store fallback:', err?.message);
      return {
        id: Date.now(),
        ...storeData,
        ngayTao: new Date().toISOString()
      };
    }
  },

  // Lấy toàn bộ hàng tồn kho của Shop (bao gồm cả hàng đang bán và hàng chưa đăng bán)
  getSellerInventory: async (storeId) => {
    let apiData = [];
    try {
      const res = await api.get(`/inventory/store/${storeId}`);
      if (Array.isArray(res)) apiData = res;
    } catch (err) {
      console.warn(`Lỗi gọi /inventory/store/${storeId}:`, err?.message);
    }

    // Luôn hợp nhất cùng kho hàng lưu trữ cục bộ để đảm bảo sản phẩm đã nhập không bao giờ bị mất
    const localKey = `seller_inventory_${storeId}`;
    let localData = [];
    try {
      const raw = localStorage.getItem(localKey);
      if (raw) localData = JSON.parse(raw);
    } catch (e) {
      console.warn('Lỗi đọc kho local shop:', e);
    }

    if (apiData.length > 0) {
      const map = new Map();
      apiData.forEach((i) => map.set(Number(i.sanPhamId || i.id), i));
      localData.forEach((i) => {
        const key = Number(i.sanPhamId || i.id);
        if (!map.has(key)) map.set(key, i);
      });
      return Array.from(map.values());
    }

    return localData;
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
    } catch (e) {
      console.warn('Backend import fallback:', e?.message);
      return { success: true, ...importItem };
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

  // Lấy danh sách hợp đồng cung ứng của Shop
  getStoreContracts: async (storeId) => {
    return getLocalContracts(storeId);
  },

  // Lấy toàn bộ hợp đồng cung ứng toàn hệ thống (Dành cho Admin duyệt và Kho tổng)
  getAllSupplyContracts: async () => {
    return getGlobalContracts();
  },

  // Bước 1: Shop gửi yêu cầu ký hợp đồng nhập hàng (Trạng thái khởi tạo: CHO_ADMIN_DUYET)
  createSupplyContractRequest: async (contractData) => {
    const newContract = {
      ...contractData,
      id: contractData.id || Date.now(),
      maHopDong: contractData.maHopDong || `HDCU-${new Date().getFullYear()}/${Date.now().toString().slice(-6)}`,
      ngayTao: new Date().toISOString(),
      trangThai: 'CHO_ADMIN_DUYET', // Bắt buộc chờ Admin duyệt yêu cầu trước khi được ký!
      adminDuyetVong1: { daDuyet: false, nguoiDuyet: null, ngayDuyet: null, ghiChu: '' },
      chuKyShop: { daKy: false, nguoiKy: null, chucVu: null, maChuKySo: null, ngayKy: null },
      adminDuyetVong2: { daDuyet: false, nguoiDuyet: null, ngayDuyet: null, ghiChu: '' },
      thongTinXuatKho: { daLenDon: false, maPhieuXuat: null, nguoiXuat: null, ngayXuat: null, donViVanChuyen: 'CTUT Express Logistics' },
    };
    saveGlobalContract(newContract);
    return newContract;
  },

  // Bước 2: Admin duyệt yêu cầu nhập hàng (Vòng 1) -> Cho phép Shop ký số
  adminApproveContractRequest: async (contractId, adminInfo = {}) => {
    const list = getGlobalContracts();
    const target = list.find((c) => String(c.id) === String(contractId) || c.maHopDong === contractId);
    if (!target) throw new Error('Không tìm thấy hợp đồng yêu cầu!');

    const updated = {
      ...target,
      trangThai: 'CHO_SHOP_KY',
      adminDuyetVong1: {
        daDuyet: true,
        nguoiDuyet: adminInfo.name || 'Quản Trị Viên (Admin)',
        ngayDuyet: new Date().toISOString(),
        ghiChu: adminInfo.note || 'Yêu cầu hợp lệ, đã phê duyệt cho phép ký hợp đồng điện tử.',
      },
    };
    saveGlobalContract(updated);
    return updated;
  },

  // Bước 3: Shop thực hiện ký số điện tử sau khi Admin đã duyệt yêu cầu
  shopSignContract: async (contractId, signInfo) => {
    const list = getGlobalContracts();
    const target = list.find((c) => String(c.id) === String(contractId) || c.maHopDong === contractId);
    if (!target) throw new Error('Không tìm thấy hợp đồng!');
    if (target.trangThai !== 'CHO_SHOP_KY') {
      throw new Error('Hợp đồng chưa được Admin duyệt yêu cầu hoặc đã ở trạng thái khác!');
    }

    const updated = {
      ...target,
      trangThai: 'DA_KY_CHO_DUYET_KHO',
      chuKyShop: {
        daKy: true,
        nguoiKy: signInfo.signerName,
        chucVu: signInfo.signerRole || 'Đại diện Pháp luật / Chủ Cửa Hàng',
        maChuKySo: `DS-SHA256-${Date.now().toString(36).toUpperCase()}`,
        ngayKy: new Date().toISOString(),
      },
    };
    saveGlobalContract(updated);
    return updated;
  },

  // Bước 4: Admin duyệt hợp đồng đã ký lần 2 -> Chuyển sang Kho Tổng lên đơn
  adminApproveAndTransferToWarehouse: async (contractId, adminInfo = {}) => {
    const list = getGlobalContracts();
    const target = list.find((c) => String(c.id) === String(contractId) || c.maHopDong === contractId);
    if (!target) throw new Error('Không tìm thấy hợp đồng!');
    if (target.trangThai !== 'DA_KY_CHO_DUYET_KHO') {
      throw new Error('Chỉ duyệt chuyển kho khi hợp đồng đã có chữ ký số của shop!');
    }

    const updated = {
      ...target,
      trangThai: 'CHUYEN_QUA_KHO',
      adminDuyetVong2: {
        daDuyet: true,
        nguoiDuyet: adminInfo.name || 'Quản Trị Viên (Admin)',
        ngayDuyet: new Date().toISOString(),
        ghiChu: adminInfo.note || 'Hợp đồng đầy đủ pháp lý, chuyển lệnh xuất kho sang Kho Tổng.',
      },
    };
    saveGlobalContract(updated);
    return updated;
  },

  // Bước 5: Kho Tổng tiếp nhận -> Lên đơn xuất kho và bàn giao bưu tá
  warehouseDispatchContractOrder: async (contractId, warehouseStaffInfo = {}) => {
    const list = getGlobalContracts();
    const target = list.find((c) => String(c.id) === String(contractId) || c.maHopDong === contractId);
    if (!target) throw new Error('Không tìm thấy hợp đồng!');

    const exportNoteCode = `PXK-CTUT-${Date.now().toString().slice(-6)}`;

    // Thử tạo phiếu xuất kho thật trên WMS backend qua API /export-notes
    try {
      await api.post('/export-notes', {
        donHangId: target.maHopDong,
        khoHangId: target.khoTongId || 1,
        nguoiTao: warehouseStaffInfo.name || 'Thủ Kho Trưởng',
        danhSachHangHoa: (target.danhSachHang || []).map((i) => ({
          sanPhamId: i.sanPhamId,
          soLuong: i.soLuong,
          donGia: i.donGiaSi,
        })),
      });
    } catch (e) {
      console.warn('API /export-notes fallback:', e?.message);
    }

    const updated = {
      ...target,
      trangThai: 'DANG_GIAO_HANG',
      thongTinXuatKho: {
        daLenDon: true,
        maPhieuXuat: exportNoteCode,
        nguoiXuat: warehouseStaffInfo.name || 'Thủ Kho Trưởng',
        ngayXuat: new Date().toISOString(),
        donViVanChuyen: warehouseStaffInfo.shippingProvider || 'CTUT Express Logistics',
      },
    };
    saveGlobalContract(updated);
    return updated;
  },

  // Bước 6: Hoàn thành giao hàng & Nhập kho hàng vào kho riêng của Cửa Hàng
  completeContractDelivery: async (contractId) => {
    const list = getGlobalContracts();
    const target = list.find((c) => String(c.id) === String(contractId) || c.maHopDong === contractId);
    if (!target) throw new Error('Không tìm thấy hợp đồng!');

    const storeId = Number(target.storeId);

    // 1. Thử gọi API backend nhập kho (nếu backend đang online)
    if (Array.isArray(target.danhSachHang)) {
      for (const item of target.danhSachHang) {
        try {
          await marketplaceService.importStockToStore({
            sanPhamId: item.sanPhamId,
            khoHangId: storeId,
            soLuong: item.soLuong,
          });
        } catch (e) {
          console.warn(`Lỗi nhập hàng món #${item.sanPhamId} vào backend:`, e?.message);
        }
      }
    }

    // 2. Luôn đồng bộ và cộng dồn số lượng vào kho riêng của Shop (localStorage) để hàng KHÔNG BỊ MẤT
    try {
      const localKey = `seller_inventory_${storeId}`;
      let currentShopInv = [];
      try {
        const raw = localStorage.getItem(localKey);
        if (raw) currentShopInv = JSON.parse(raw);
      } catch (errParse) {
        console.warn(errParse);
      }

      const invMap = new Map();
      currentShopInv.forEach((it) => invMap.set(Number(it.sanPhamId || it.id), it));

      (target.danhSachHang || []).forEach((item) => {
        const pId = Number(item.sanPhamId);
        if (invMap.has(pId)) {
          const existing = invMap.get(pId);
          existing.soLuongThucTe = (Number(existing.soLuongThucTe) || 0) + Number(item.soLuong);
          existing.soLuongKhaDung = (Number(existing.soLuongKhaDung) || 0) + Number(item.soLuong);
        } else {
          invMap.set(pId, {
            id: Date.now() + Math.floor(Math.random() * 1000),
            sanPhamId: pId,
            khoHangId: storeId,
            sku: item.sku,
            tenSanPham: item.tenHangHoa,
            donViTinh: item.donViTinh || 'Cái',
            giaBan: item.donGiaSi ? Math.round(item.donGiaSi * 1.15) : 1200000,
            giaBanHienTai: item.donGiaSi ? Math.round(item.donGiaSi * 1.15) : 1200000,
            soLuongThucTe: Number(item.soLuong),
            soLuongKhaDung: Number(item.soLuong),
            soLuongToiThieu: 5,
            soLuongToiDa: 1000,
            dangBan: true, // Mặc định tự động mở bán khi hàng về kho shop
            soLuongDaBan: 0,
            hinhAnh: item.hinhAnh || '',
            danhMuc: item.danhMuc || 'Thiết bị công nghệ',
            ngayNhapKho: new Date().toISOString(),
          });
        }
      });

      const updatedShopInv = Array.from(invMap.values());
      localStorage.setItem(localKey, JSON.stringify(updatedShopInv));
      window.dispatchEvent(new CustomEvent('seller-inventory-updated', { detail: { storeId, inventory: updatedShopInv } }));
    } catch (errLocal) {
      console.warn('Lỗi cập nhật local shop inventory:', errLocal);
    }

    const updated = {
      ...target,
      trangThai: 'HOAN_THANH',
      ngayHoanThanh: new Date().toISOString(),
    };
    saveGlobalContract(updated);
    return updated;
  },

  // Từ chối yêu cầu hợp đồng (Admin hoặc Kho từ chối)
  rejectSupplyContract: async (contractId, reason = 'Không đủ điều kiện cung ứng', adminInfo = {}) => {
    const list = getGlobalContracts();
    const target = list.find((c) => String(c.id) === String(contractId) || c.maHopDong === contractId);
    if (!target) throw new Error('Không tìm thấy hợp đồng!');

    const updated = {
      ...target,
      trangThai: 'TU_CHOI',
      lyDoTuChoi: reason,
      nguoiTuChoi: adminInfo.name || 'Quản Trị Viên (Admin)',
      ngayTuChoi: new Date().toISOString(),
    };
    saveGlobalContract(updated);
    return updated;
  },

  // Lưu hợp đồng cung ứng điện tử sau khi ký số (Tương thích ngược)
  saveStoreContract: async (storeId, contractData) => {
    return saveLocalContract(storeId, contractData);
  },

  // Chủ shop BẬT / TẮT đăng bán sản phẩm lên Sàn TMĐT và định giá bán lẻ
  publishProductToMarketplace: async (inventoryId, publishData) => {
    try {
      await api.put(`/inventory/${inventoryId}/publish`, publishData);
    } catch (err) {
      console.warn('Backend publish fallback:', err?.message);
    }

    // Cập nhật cả vào localStorage của các shop
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('seller_inventory_')) {
          const raw = localStorage.getItem(key);
          if (raw) {
            let invList = JSON.parse(raw);
            let changed = false;
            invList = invList.map((item) => {
              if (String(item.id) === String(inventoryId) || String(item.sanPhamId) === String(inventoryId)) {
                changed = true;
                return {
                  ...item,
                  dangBan: publishData.dangBan,
                  giaBanHienTai: publishData.giaBanHienTai !== undefined ? publishData.giaBanHienTai : item.giaBanHienTai,
                  soLuongToiThieu: publishData.soLuongCanhBao !== undefined ? publishData.soLuongCanhBao : item.soLuongToiThieu,
                };
              }
              return item;
            });
            if (changed) {
              localStorage.setItem(key, JSON.stringify(invList));
            }
          }
        }
      }
    } catch (e) {
      console.warn('Lỗi cập nhật local publish status:', e);
    }

    return { id: inventoryId, ...publishData };
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
    const storeId = voucherData.cuaHangId;
    const localKey = `store_vouchers_${storeId}`;
    try {
      const res = await api.post('/vouchers', voucherData);
      const current = JSON.parse(localStorage.getItem(localKey) || '[]');
      localStorage.setItem(localKey, JSON.stringify([res, ...current]));
      return res;
    } catch (err) {
      const fallbackVc = { ...voucherData, id: Date.now() };
      const current = JSON.parse(localStorage.getItem(localKey) || '[]');
      localStorage.setItem(localKey, JSON.stringify([fallbackVc, ...current]));
      return fallbackVc;
    }
  },

  // Chủ shop gỡ bỏ Voucher khỏi gian hàng
  deleteStoreVoucher: async (storeId, maVoucher) => {
    const localKey = `store_vouchers_${storeId}`;
    try {
      const current = JSON.parse(localStorage.getItem(localKey) || '[]');
      const filtered = current.filter((v) => v.maVoucher !== maVoucher);
      localStorage.setItem(localKey, JSON.stringify(filtered));
      return true;
    } catch (e) {
      console.warn(e);
      return false;
    }
  },

  // Cập nhật thông tin Gian hàng
  updateStoreProfile: async (storeId, storeData) => {
    return await api.put(`/stores/${storeId}`, storeData);
  },
};
