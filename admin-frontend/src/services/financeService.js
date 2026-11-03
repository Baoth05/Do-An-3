import api from './api';

export const financeService = {
    // 1. Lấy số liệu tổng quan (Tổng thu, tổng chi, lợi nhuận)
    getSummary: async (month, year) => {
        try {
            const response = await api.get('/wms/finance/summary', { params: { month, year }});
            return response.data;
        } catch (error) {
            console.error("Lỗi lấy tổng quan tài chính:", error);
            throw error;
        }
    },

    // 2. Lấy dữ liệu cho biểu đồ (6 tháng gần nhất)
    getChartData: async () => {
        try {
            const response = await api.get('/wms/finance/chart');
            return response.data;
        } catch (error) {
            console.error("Lỗi lấy dữ liệu biểu đồ:", error);
            throw error;
        }
    },

    // 3. Lấy danh sách nhật ký giao dịch
    getTransactions: async (limit = 10) => {
        try {
            const response = await api.get('/wms/finance/transactions', { params: { limit }});
            return response.data;
        } catch (error) {
            console.error("Lỗi lấy lịch sử giao dịch:", error);
            throw error;
        }
    },

    // 4. Lấy dữ liệu Báo cáo & Thống kê Chiến Lược
    getStrategicReport: async () => {
        try {
            const response = await api.get('/wms/finance/strategic-report');
            return response.data;
        } catch (error) {
            console.error("Lỗi lấy báo cáo chiến lược:", error);
            throw error;
        }
    }
};
