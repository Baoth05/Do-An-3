import React, { useState, useEffect } from 'react';
import { 
  FiDownload, FiDollarSign, FiShoppingBag, FiUserPlus, 
  FiTrendingUp, FiCreditCard, FiCheckCircle, FiBarChart2, 
  FiPieChart, FiTarget, FiRefreshCw 
} from 'react-icons/fi';
import { financeService } from '../services/financeService';
import './StrategicReport.css';

const StrategicReport = () => {
  const [reportData, setReportData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchReport = async () => {
    try {
      setIsLoading(true);
      const data = await financeService.getStrategicReport();
      setReportData(data);
    } catch (err) {
      console.warn("Lỗi tải báo cáo chiến lược từ Backend:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const formatCurrency = (amount) => {
    if (!amount) return '0 ₫';
    return Number(amount).toLocaleString('vi-VN') + ' ₫';
  };

  const topProducts = reportData?.topProducts || [];
  const statusDist = reportData?.statusDistribution || {
    total: 120,
    successCount: 90,
    successPct: 75,
    pendingCount: 22,
    pendingPct: 18,
    cancelCount: 8,
    cancelPct: 7
  };

  return (
    <div className="report-page-container">
      {/* 1. Header Khu Vực */}
      <div className="report-header">
        <div className="title-group">
          <h1>
            Báo Cáo & Thống Kê Chiến Lược
            <span className="tag-badge-project">DỮ LIỆU ĐỒ ÁN</span>
          </h1>
          <p className="subtitle">Tổng hợp phân tích hiệu quả kinh doanh, cơ cấu đơn hàng và sản phẩm bán chạy của chuỗi bán lẻ & kho hàng.</p>
        </div>
        <div className="report-header-actions">
          <button 
            className="btn-export" 
            style={{ backgroundColor: '#ffffff', color: '#334155', border: '1px solid #cbd5e1' }}
            onClick={fetchReport}
            disabled={isLoading}
          >
            <FiRefreshCw className={isLoading ? 'spin-icon' : ''} size={15} /> Đồng bộ
          </button>
          <select className="select-month">
            <option>Tháng này</option>
            <option>Tháng trước</option>
          </select>
          <button className="btn-export">
            <FiDownload size={16} /> Xuất báo cáo (PDF/Excel)
          </button>
        </div>
      </div>

      {/* 2. Thẻ Thống Kê */}
      <div className="report-stats-grid">
        <div className="report-stat-card">
          <div className="report-stat-header">
            <span>Tổng doanh thu</span>
            <FiDollarSign size={16} color="#d63031"/>
          </div>
          <div className="report-stat-value red">
            {reportData?.totalRevenueFormatted || formatCurrency(reportData?.totalRevenue || 50000000)}
          </div>
          <div className="report-stat-trend trend-up">
            <FiTrendingUp size={14}/> {reportData?.revenueGrowth || '+15.4%'} <span style={{color: '#636e72', fontWeight: 500}}>so với kỳ trước</span>
          </div>
          <div className="report-stat-footer">
            <FiCreditCard size={14}/> Doanh thu tích lũy từ {reportData?.totalOrders || 120} phiếu xuất bán
          </div>
        </div>

        <div className="report-stat-card">
          <div className="report-stat-header">
            <span>Tổng đơn hàng / phiếu xuất</span>
            <FiShoppingBag size={16} color="#d63031"/>
          </div>
          <div className="report-stat-value dark">
            {reportData?.totalOrders || 120} <span style={{fontSize: '18px'}}>đơn</span>
          </div>
          <div className="report-stat-trend trend-up">
            <FiTrendingUp size={14}/> {reportData?.orderGrowth || '+8.2%'} <span style={{color: '#636e72', fontWeight: 500}}>tăng trưởng lưu chuyển</span>
          </div>
          <div className="report-stat-footer">
            <FiCheckCircle size={14}/> {statusDist.successPct}% tỷ lệ xuất kho thành công
          </div>
        </div>

        <div className="report-stat-card">
          <div className="report-stat-header">
            <span>Khách hàng & Đối tác</span>
            <FiUserPlus size={16} color="#0984e3"/>
          </div>
          <div className="report-stat-value dark">
            {reportData?.newCustomers || 45} <span style={{fontSize: '18px'}}>đối tác</span>
          </div>
          <div className="report-stat-trend">
            <span className="trend-badge"><FiUserPlus size={12}/> +12</span> <span style={{color: '#636e72', fontWeight: 500}}>kết nối mới tháng này</span>
          </div>
          <div className="report-stat-footer">
            <FiPieChart size={14} color="#d63031"/> Tỷ lệ quay lại mua hàng đạt 65%
          </div>
        </div>
      </div>

      {/* 3. Lưới Biểu Đồ */}
      <div className="charts-grid">
        {/* Cột Trái: Top 5 */}
        <div className="chart-card">
          <div className="chart-header">
            <div>
              <div className="chart-title">Top 5 Sản Phẩm Bán Chạy Nhất</div>
              <div className="chart-sub">Thống kê theo số lượng bán và đóng góp doanh số luân chuyển</div>
            </div>
            <FiBarChart2 size={20} color="#888"/>
          </div>

          <div className="top-products-list">
            {topProducts.length === 0 ? (
              <p style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>Chưa có dữ liệu sản phẩm bán chạy.</p>
            ) : (
              topProducts.map((product) => (
                <div className="product-item" key={product.id}>
                  <div className="product-info-row">
                    <div className="product-name-col">
                      <div className={`rank-badge ${product.rankClass}`}>{product.id}</div>
                      <div className="product-name">{product.name}</div>
                    </div>
                    <div className="product-stats-col">
                      <div className="product-revenue">{product.rev}</div>
                      <div className="product-orders">{product.orders} món</div>
                    </div>
                  </div>
                  <div className="progress-track">
                    <div className={`progress-fill ${product.rankClass}-fill`} style={{ width: `${product.percent}%` }}></div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="top-products-footer">
            <span style={{fontSize: '13px', color: '#636e72'}}>
              Tổng giá trị: <strong style={{color: '#2d3436'}}>{reportData?.totalRevenueFormatted || '50.000.000 đ'}</strong>
            </span>
            <span style={{fontSize: '13px', color: '#d63031', fontWeight: 600, cursor: 'pointer'}}>Chi tiết kho hàng</span>
          </div>
        </div>

        {/* Cột Phải: Biểu đồ Donut Phân Bổ Trạng Thái */}
        <div className="chart-card">
          <div className="chart-header">
            <div>
              <div className="chart-title">Tỷ Lệ Trạng Thái Đơn Hàng & Phiếu Xuất</div>
              <div className="chart-sub">Phân bổ {statusDist.total} chứng từ luân chuyển trong kỳ</div>
            </div>
            <FiPieChart size={20} color="#888"/>
          </div>

          <div className="donut-chart-container">
            <div className="donut-wrapper">
              <div className="donut-inner">
                <span className="donut-inner-val">{statusDist.total}</span>
                <span className="donut-inner-label">Đơn hàng</span>
              </div>
            </div>

            <div className="chart-legend">
              <div className="legend-item">
                <div className="legend-label"><span className="legend-dot dot-blue"></span> Thành công</div>
                <div className="legend-stats"><span>{statusDist.successCount} đơn</span> <span className="legend-pct" style={{color: '#0984e3'}}>{statusDist.successPct}%</span></div>
              </div>
              <hr style={{border: 'none', borderTop: '1px solid #f1f2f6', width: '100%', margin: '4px 0'}}/>
              <div className="legend-item">
                <div className="legend-label"><span className="legend-dot dot-pink"></span> Đang giao</div>
                <div className="legend-stats"><span>{statusDist.pendingCount} đơn</span> <span className="legend-pct" style={{color: '#d63031', background: '#fff0f0'}}>{statusDist.pendingPct}%</span></div>
              </div>
              <hr style={{border: 'none', borderTop: '1px solid #f1f2f6', width: '100%', margin: '4px 0'}}/>
              <div className="legend-item">
                <div className="legend-label"><span className="legend-dot dot-red"></span> Đã hủy</div>
                <div className="legend-stats"><span>{statusDist.cancelCount} đơn</span> <span className="legend-pct" style={{color: '#b31217', background: '#ffebeb'}}>{statusDist.cancelPct}%</span></div>
              </div>
            </div>

            <div style={{marginTop: '24px', fontSize: '12px', color: '#0984e3', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 500}}>
              <FiCheckCircle size={14}/> Tỷ lệ đơn hủy ở mức an toàn (&lt; 10%)
            </div>
          </div>
        </div>
      </div>

      {/* 4. Banner Đánh Giá */}
      <div className="strategy-banner">
        <div className="strategy-content">
          <div className="strategy-icon"><FiTarget size={20} /></div>
          <div className="strategy-text">
            <h4>Đánh giá chiến lược từ hệ thống WMS Core</h4>
            <p>{reportData?.strategicAdvice || 'Doanh số dòng sản phẩm chủ lực đóng góp hơn 60% tổng doanh thu. Đề xuất tăng cường tồn kho an toàn cho các mặt hàng bán chạy trong tháng tới.'}</p>
          </div>
        </div>
        <button className="btn-outline-red">Lập kế hoạch kho</button>
      </div>
    </div>
  );
};

export default StrategicReport;
