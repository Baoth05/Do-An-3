/**
 * ==============================================================================
 * Module: wmsCoreService.js
 * Mô tả: Cổng dịch vụ Client API kết nối trực tiếp với microservice wms-core-service (Port 8081).
 * Chức năng: Cung cấp các hàm gọi API cho Hàng hóa, Danh mục, Kho bãi, Tồn kho, Thẻ kho, Phiếu nhập/xuất và Điều chuyển.
 * ==============================================================================
 */
import api from './api';

export const wmsCoreService = {
  // === HÀNG HÓA / SẢN PHẨM (HANG_HOA - Master Catalog) ===
  getProducts: () => api.get('/wms/products'),
  getProductById: (id) => api.get(`/wms/products/${id}`),
  createProduct: (data) => api.post('/wms/products', data),
  updateProduct: (id, data) => api.put(`/wms/products/${id}`, data),
  deleteProduct: (id) => api.delete(`/wms/products/${id}`),

  // === DANH MỤC SẢN PHẨM (DANH_MUC) ===
  getCategories: () => api.get('/wms/categories'),
  getCategoryById: (id) => api.get(`/wms/categories/${id}`),
  createCategory: (data) => api.post('/wms/categories', data),
  updateCategory: (id, data) => api.put(`/wms/categories/${id}`, data),
  deleteCategory: (id) => api.delete(`/wms/categories/${id}`),

  // === KHO BÃI & GIAN HÀNG SÀN (KHO_VA_CUA_HANG) ===
  getWarehouses: () => api.get('/wms/warehouses'),
  getWarehouseById: (id) => api.get(`/wms/warehouses/${id}`),
  createWarehouse: (data) => api.post('/wms/warehouses', data),
  updateWarehouse: (id, data) => api.put(`/wms/warehouses/${id}`, data),
  deleteWarehouse: (id) => api.delete(`/wms/warehouses/${id}`),
  getStores: () => api.get('/stores'),
  getStoreById: (id) => api.get(`/stores/${id}`),
  createStore: (data) => api.post('/stores', data),
  updateStore: (id, data) => api.put(`/stores/${id}`, data),

  // === TỒN KHO 2 CẤP & ĐĂNG BÁN SÀN (TON_KHO_CHI_NHANH) ===
  getInventory: () => api.get('/wms/inventory'),
  getAllInventory: () => api.get('/wms/inventory'),
  getInventoryStock: () => api.get('/wms/inventory'),
  getMarketplaceProducts: () => api.get('/wms/inventory/marketplace'),
  getStoreInventory: (storeId) => api.get(`/wms/inventory/store/${storeId}`),
  addStock: (data) => api.post('/wms/inventory/add', data),
  updateThresholds: (id, min, max) =>
    api.put(`/wms/inventory/${id}/thresholds?min=${min || ''}&max=${max || ''}`),
  publishToMarketplace: (id, data) => api.put(`/wms/inventory/${id}/publish`, data),

  // === THẺ KHO (THE_KHO) ===
  getStockCards: (params) => api.get('/stock-cards', { params }),
  createStockCard: (data) => api.post('/stock-cards', data),

  // === PHIẾU NHẬP KHO (PHIEU_NHAP) ===
  getImportNotes: () => api.get('/wms/import-notes'),
  getImportNoteById: (id) => api.get(`/wms/import-notes/${id}`),
  createImportNote: (data) => api.post('/wms/import-notes', data),
  updateImportNoteStatus: (id, status) =>
    api.put(`/wms/import-notes/${id}/status?status=${encodeURIComponent(status)}`),

  // === PHIẾU XUẤT KHO (PHIEU_XUAT) ===
  getExportNotes: () => api.get('/wms/export-notes'),
  getExportNoteById: (id) => api.get(`/wms/export-notes/${id}`),
  createExportNote: (data) => api.post('/wms/export-notes', data),
  updateExportNoteStatus: (id, status) =>
    api.put(`/wms/export-notes/${id}/status?status=${encodeURIComponent(status)}`),

  // === ĐIỀU CHUYỂN KHO (DIEU_CHUYEN) ===
  getTransfers: () => api.get('/wms/transfers'),
  getTransferById: (id) => api.get(`/wms/transfers/${id}`),
  createTransfer: (data) => api.post('/wms/transfers', data),

// === NHÀ CUNG CẤP (NHA_CUNG_CAP) ===
  getSuppliers: () => api.get('/wms/suppliers'),
  getSupplierById: (id) => api.get(`/wms/suppliers/${id}`),
  createSupplier: (data) => api.post('/wms/suppliers', data),
  
  // Sửa api.post thành api.put để khớp với chuẩn cập nhật dữ liệu (RESTful) của Backend
  updateSupplier: (id, data) => api.put(`/wms/suppliers/${id}`, data),

  deleteSupplier: (id) => api.delete(`/wms/suppliers/${id}`),

  // === ĐƠN VỊ VẬN CHUYỂN (VAN_CHUYEN) ===
  getShippers: () => api.get('/wms/shippers'),
  getShipperById: (id) => api.get(`/wms/shippers/${id}`),
  createShipper: (data) => api.post('/wms/shippers', data),
  updateShipper: (id, data) => api.put(`/wms/shippers/${id}`, data),
  deleteShipper: (id) => api.delete(`/wms/shippers/${id}`),
};
