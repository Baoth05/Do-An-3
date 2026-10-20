// src/services/productService.js
import api from './api';

export const productService = {
  // Lấy toàn bộ hàng hóa trong kho (bao gồm cả hàng ẩn)
  getAllProducts: async () => {
    return await api.get('/wms/products/all');
  },

  // Lấy các sản phẩm đang kích hoạt
  getActiveProducts: async () => {
    return await api.get('/wms/products');
  },

  // Xem chi tiết hàng hóa theo ID
  getProductById: async (id) => {
    return await api.get(`/wms/products/${id}`);
  },

  // Thêm mới hàng hóa vào kho
  createProduct: async (productData) => {
    return await api.post('/wms/products', productData);
  },

  // Cập nhật thông tin hoặc số lượng tồn kho
  updateProduct: async (id, productData) => {
    return await api.put(`/wms/products/${id}`, productData);
  },

  // Ẩn / Xóa hàng hóa
  deleteProduct: async (id) => {
    return await api.delete(`/wms/products/${id}`);
  },

  // Lấy danh mục sản phẩm
  getCategories: async () => {
    return await api.get('/wms/categories');
  },
};

