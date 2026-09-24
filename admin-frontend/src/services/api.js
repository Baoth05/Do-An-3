// src/services/api.js
import axios from 'axios';

// Tạo một bản sao của axios với đường dẫn mặc định
const api = axios.create({
  baseURL: 'http://172.23.16.1:8080/api', // Thay đổi đường dẫn này theo Backend của bạn
  timeout: 10000, // Nếu quá 10 giây không có phản hồi thì báo lỗi
});

export default api;