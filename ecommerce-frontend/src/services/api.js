// src/services/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8080',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    // Tự động kiểm tra token khách hàng hoặc token chủ shop
    const token = localStorage.getItem('customer_token') || localStorage.getItem('seller_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.warn('API Gateway request failed:', error?.response?.data || error?.message);
    return Promise.reject(error);
  }
);

export default api;
