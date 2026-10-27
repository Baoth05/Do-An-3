// src/services/marketplaceService.js
import api from './api';

const MOCK_STORES = [
  {
    id: 2,
    maKho: 'STORE-APPLE',
    tenKho: 'Apple Store Chính Hãng CTUT',
    moTaGianHang: 'Gian hàng ủy quyền chính hãng Apple tại Cần Thơ, bảo hành 12 tháng 1 đổi 1.',
    diaChi: '256 Đường 30/4, Quận Ninh Kiều, Cần Thơ',
    anhDaiDienShop: 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=200&auto=format&fit=crop',
    rating: 4.9,
    followerCount: 1240,
    trangThai: 'HOAT_DONG',
  },
  {
    id: 3,
    maKho: 'STORE-GEAR',
    tenKho: 'CTUT Gaming & Gear Hub',
    moTaGianHang: 'Thiên đường gaming gear, bàn phím cơ, chuột không dây & phụ kiện gaming cao cấp.',
    diaChi: '88 Nguyễn Văn Cừ, Quận Ninh Kiều, Cần Thơ',
    anhDaiDienShop: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=200&auto=format&fit=crop',
    rating: 4.8,
    followerCount: 890,
    trangThai: 'HOAT_DONG',
  },
];

const MOCK_PRODUCTS = [
  {
    id: 1,
    sanPhamId: 1,
    sku: 'SP001',
    tenSanPham: 'iPhone 15 Pro Max 256GB Titan Tự Nhiên',
    khoHangId: 2,
    tenKho: 'Apple Store Chính Hãng CTUT',
    tenShop: 'Apple Store Chính Hãng CTUT',
    moTaShop: 'Đại lý ủy quyền Apple',
    giaBan: 29990000,
    giaBanHienTai: 29490000,
    soLuongThucTe: 25,
    soLuongDaBan: 18,
    dangBan: true,
    donViTinh: 'Cái',
    hinhAnh: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600&auto=format&fit=crop',
    moTa: 'iPhone 15 Pro Max với khung viền Titan chuẩn hàng không vũ trụ, chip A17 Pro mạnh mẽ hàng đầu, camera tiềm vọng zoom quang 5x đỉnh cao.',
    danhMuc: 'Điện Thoại & Tablet',
    rating: 5,
  },
  {
    id: 2,
    sanPhamId: 2,
    sku: 'SP002',
    tenSanPham: 'Chuột Không Dây Logitech MX Master 3S',
    khoHangId: 3,
    tenKho: 'CTUT Gaming & Gear Hub',
    tenShop: 'CTUT Gaming & Gear Hub',
    moTaShop: 'Chuyên phụ kiện Gaming cao cấp',
    giaBan: 2490000,
    giaBanHienTai: 2390000,
    soLuongThucTe: 40,
    soLuongDaBan: 32,
    dangBan: true,
    donViTinh: 'Cái',
    hinhAnh: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=600&auto=format&fit=crop',
    moTa: 'Chuột công thái học hàng đầu cho dân văn phòng và lập trình viên, nút bấm giảm 90% tiếng ồn, mắt đọc 8000 DPI lướt mượt trên mọi bề mặt kính.',
    danhMuc: 'Phụ Kiện Gaming & Văn Phòng',
    rating: 4.8,
  },
  {
    id: 3,
    sanPhamId: 3,
    sku: 'SP003',
    tenSanPham: 'Bàn Phím Cơ Keychron K2 Pro QMK/VIA Wireless',
    khoHangId: 3,
    tenKho: 'CTUT Gaming & Gear Hub',
    tenShop: 'CTUT Gaming & Gear Hub',
    moTaShop: 'Chuyên phụ kiện Gaming cao cấp',
    giaBan: 2250000,
    giaBanHienTai: 2190000,
    soLuongThucTe: 15,
    soLuongDaBan: 44,
    dangBan: true,
    donViTinh: 'Cái',
    hinhAnh: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&auto=format&fit=crop',
    moTa: 'Bàn phím cơ layout 75% gọn gàng, hỗ trợ Bluetooth 5.1 và Type-C, keycap PBT double-shot chống mờ cao cấp, tương thích Mac & Windows.',
    danhMuc: 'Phụ Kiện Gaming & Văn Phòng',
    rating: 4.9,
  },
  {
    id: 4,
    sanPhamId: 4,
    sku: 'SP004',
    tenSanPham: 'MacBook Air 15 inch M3 16GB / 512GB Midnight',
    khoHangId: 2,
    tenKho: 'Apple Store Chính Hãng CTUT',
    tenShop: 'Apple Store Chính Hãng CTUT',
    moTaShop: 'Đại lý ủy quyền Apple',
    giaBan: 34990000,
    giaBanHienTai: 33890000,
    soLuongThucTe: 10,
    soLuongDaBan: 9,
    dangBan: true,
    donViTinh: 'Cái',
    hinhAnh: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&auto=format&fit=crop',
    moTa: 'Thiết kế siêu mỏng nhẹ thời thượng với màn hình Liquid Retina 15.3 inch tuyệt mỹ, chip Apple M3 thế hệ mới với hiệu năng AI vượt trội.',
    danhMuc: 'Laptop & Máy Tính',
    rating: 5,
  },
];

const MOCK_VOUCHERS = [
  {
    id: 1,
    maVoucher: 'CTUT50K',
    cuaHangId: null, // Voucher toàn sàn
    phanTramGiam: 10,
    giamToiDa: 50000,
    donHangToiThieu: 200000,
    moTa: 'Giảm 10% tối đa 50K cho đơn từ 200K (Toàn Sàn)',
  },
  {
    id: 2,
    maVoucher: 'APPLE200K',
    cuaHangId: 2, // Voucher riêng shop Apple
    phanTramGiam: 5,
    giamToiDa: 200000,
    donHangToiThieu: 5000000,
    moTa: 'Giảm 5% tối đa 200K cho đơn hàng Apple từ 5Tr',
  },
  {
    id: 3,
    maVoucher: 'GEAR30K',
    cuaHangId: 3, // Voucher riêng shop Gear
    phanTramGiam: 15,
    giamToiDa: 30000,
    donHangToiThieu: 150000,
    moTa: 'Giảm 15% tối đa 30K cho phụ kiện tại CTUT Gaming Hub',
  },
];

export const marketplaceService = {
  // Lấy toàn bộ sản phẩm đang mở bán trên sàn chung
  getMarketplaceProducts: async () => {
    try {
      const res = await api.get('/inventory/marketplace');
      if (Array.isArray(res) && res.length > 0) return res;
      return MOCK_PRODUCTS;
    } catch {
      return MOCK_PRODUCTS;
    }
  },

  // Lấy danh sách Gian hàng
  getStores: async () => {
    try {
      const res = await api.get('/stores');
      if (Array.isArray(res) && res.length > 0) return res;
      return MOCK_STORES;
    } catch {
      return MOCK_STORES;
    }
  },

  // Lấy chi tiết Gian hàng
  getStoreById: async (id) => {
    try {
      const res = await api.get(`/stores/${id}`);
      if (res && res.id) return res;
      return MOCK_STORES.find((s) => s.id === Number(id)) || MOCK_STORES[0];
    } catch {
      return MOCK_STORES.find((s) => s.id === Number(id)) || MOCK_STORES[0];
    }
  },

  // Lấy danh sách sản phẩm theo Gian hàng
  getProductsByStore: async (storeId) => {
    try {
      const res = await api.get(`/inventory/store/${storeId}`);
      if (Array.isArray(res) && res.length > 0) return res;
      return MOCK_PRODUCTS.filter((p) => p.khoHangId === Number(storeId));
    } catch {
      return MOCK_PRODUCTS.filter((p) => p.khoHangId === Number(storeId));
    }
  },

  // Lấy Voucher toàn sàn và của từng Shop
  getGlobalVouchers: async () => {
    try {
      const res = await api.get('/vouchers/global');
      if (Array.isArray(res) && res.length > 0) return res;
      return MOCK_VOUCHERS.filter((v) => !v.cuaHangId);
    } catch {
      return MOCK_VOUCHERS.filter((v) => !v.cuaHangId);
    }
  },

  getStoreVouchers: async (storeId) => {
    try {
      const res = await api.get(`/vouchers/store/${storeId}`);
      if (Array.isArray(res) && res.length > 0) return res;
      return MOCK_VOUCHERS.filter((v) => v.cuaHangId === Number(storeId));
    } catch {
      return MOCK_VOUCHERS.filter((v) => v.cuaHangId === Number(storeId));
    }
  },

  // Checkout Đa Shop (Order Splitting)
  checkoutMultiShop: async (payload) => {
    try {
      return await api.post('/orders/checkout-multishop', payload);
    } catch {
      // Fallback giả lập đơn nếu backend chưa bật
      const maGiaoDichGoc = 'CHECKOUT-' + Math.random().toString(36).substring(2, 10).toUpperCase();
      const splitOrders = payload.shopOrders.map((block, idx) => ({
        id: Date.now() + idx,
        maDonHang: 'DH-' + Math.random().toString(36).substring(2, 9).toUpperCase(),
        maGiaoDichGoc,
        cuaHangId: block.cuaHangId,
        donViVanChuyen: block.donViVanChuyen || 'GHTK',
        tongTienHang: block.danhSachHang.reduce((s, i) => s + (i.giaMuaSnapshot * i.soLuong), 0),
        tienGiamGia: 0,
        tongThanhToan: block.danhSachHang.reduce((s, i) => s + (i.giaMuaSnapshot * i.soLuong), 0),
        trangThaiDonHang: 'PENDING',
        trangThaiThanhToan: 'UNPAID',
        trangThaiGiaoHang: 'WAITING',
      }));

      return {
        maGiaoDichGoc,
        soLuongDonHang: splitOrders.length,
        danhSachDonHang: splitOrders,
        tongThanhToanGop: splitOrders.reduce((s, o) => s + o.tongThanhToan, 0),
      };
    }
  },

  // Tạo liên kết và mã QR MoMo
  createPayment: async (data) => {
    try {
      return await api.post('/payments/create', data);
    } catch {
      const amount = data.soTien || 500000;
      const orderId = data.donHangId || data.maGiaoDichGoc || 'ORDER-TEST';
      return {
        momoOrderId: 'MOMO_' + Date.now(),
        donHangId: orderId,
        soTien: amount,
        paymentUrl: 'https://me.momo.vn/0912345678',
        qrCodeUrl: `https://api.vietqr.io/image/970422-0912345678-compact2.jpg?amount=${amount}&addInfo=CTUT%20${orderId}&accountName=CTUT%20MARKETPLACE`,
        accountNumber: '0912345678',
        accountName: 'SÀN TMĐT CTUT GEAR',
        trangThai: 'PENDING',
      };
    }
  },

  // Gửi xác nhận giao dịch Web3 Crypto
  submitCryptoPayment: async (data) => {
    try {
      return await api.post('/payments/crypto/submit', data);
    } catch {
      return {
        id: Date.now(),
        txHash: data.txHash,
        walletAddress: data.walletAddress,
        soTien: data.soTien,
        tokenSymbol: data.tokenSymbol || 'USDT',
        trangThaiGiaoDich: 'SUCCESS',
      };
    }
  },

  // Tương tác: Lấy đánh giá & bình luận
  getReviews: async (maHangHoa) => {
    try {
      const res = await api.get(`/interactions/danh-gia/${maHangHoa}`);
      if (Array.isArray(res) && res.length > 0) return res;
      return [
        { id: 1, soSao: 5, noiDung: 'Sản phẩm chính hãng, đóng gói rất cẩn thận và giao nhanh!', daMuaHang: true, nguoiDungId: 101 },
        { id: 2, soSao: 5, noiDung: 'Dùng rất thích, đúng mô tả của Shop. Sẽ ủng hộ tiếp.', daMuaHang: true, nguoiDungId: 102 },
      ];
    } catch {
      return [
        { id: 1, soSao: 5, noiDung: 'Sản phẩm chính hãng, đóng gói rất cẩn thận và giao nhanh!', daMuaHang: true, nguoiDungId: 101 },
      ];
    }
  },

  getComments: async (maHangHoa) => {
    try {
      const res = await api.get(`/interactions/binh-luan/${maHangHoa}`);
      if (Array.isArray(res) && res.length > 0) return res;
      return [];
    } catch {
      return [];
    }
  },
};

