import React from 'react';
import { 
  FiDownload, FiDollarSign, FiShoppingBag, FiUserPlus, 
  FiTrendingUp, FiCreditCard, FiCheckCircle, FiBarChart2, 
  FiPieChart, FiTarget 
} from 'react-icons/fi';
import './StrategicReport.css';

const StrategicReport = () => {
  // Dữ liệu mẫu mảng Top 5 Sản phẩm
  const topProducts = [
    { id: 1, name: 'Bàn phím Akko 3098B Multi-Modes', rev: '18.500.000 đ', orders: 42, percent: 100, rankClass: 'rank-1' },
    { id: 2, name: 'Chuột không dây Logitech G Pro X Superlight', rev: '11.200.000 đ', orders: 28, percent: 60, rankClass: 'rank-2' },
    { id: 3, name: 'Bàn phím cơ Keychron Q1 Pro', rev: '9.800.000 đ', orders: 18, percent: 52, rankClass: 'rank-3' },
    { id: 4, name: 'Lót chuột CTUT Neon Cyberpunk XL', rev: '6.200.000 đ', orders: 55, percent: 33, rankClass: 'rank-4' },
    { id: 5, name: 'Bộ Switch Jelly Red Akko', rev: '4.300.000 đ', orders: 15, percent: 23, rankClass: 'rank-5' },
  ];

  return (
    <div className="report-page-container">
      {/* 1. Header Khu Vực */}
      <div className="report-header">
        <div className="title-group">
          <h1>
            Báo Cáo & Thống Kê Chiến Lược
            <span className="tag-badge-project">DỮ LIỆU ĐỒ ÁN</span>
          </h1>
          <p className="subtitle">Tổng hợp phân tích hiệu quả kinh doanh, cơ cấu đơn hàng và sản phẩm bán chạy của cửa hàng CTUT Gear.</p>
        </div>
        <div className="report-header-actions">
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
          <div className="report-stat-value red">50.000.000 đ</div>
          <div className="report-stat-trend trend-up">
            <FiTrendingUp size={14}/> +15.4% <span style={{color: '#636e72', fontWeight: 500}}>so với tháng trước</span>
          </div>
          <div className="report-stat-footer">
            <FiCreditCard size={14}/> Doanh thu ghi nhận từ 120 đơn
          </div>
        </div>

        <div className="report-stat-card">
          <div className="report-stat-header">
            <span>Tổng đơn hàng</span>
            <FiShoppingBag size={16} color="#d63031"/>
          </div>
          <div className="report-stat-value dark">120 <span style={{fontSize: '18px'}}>đơn</span></div>
          <div className="report-stat-trend trend-up">
            <FiTrendingUp size={14}/> +8.2% <span style={{color: '#636e72', fontWeight: 500}}>tăng trưởng đơn hàng</span>
          </div>
          <div className="report-stat-footer">
            <FiCheckCircle size={14}/> 95% tỷ lệ giao thành công
          </div>
        </div>

        <div className="report-stat-card">
          <div className="report-stat-header">
            <span>Khách hàng mới</span>
            <FiUserPlus size={16} color="#0984e3"/>
          </div>
          <div className="report-stat-value dark">45 <span style={{fontSize: '18px'}}>khách</span></div>
          <div className="report-stat-trend">
            <span className="trend-badge"><FiUserPlus size={12}/> +12</span> <span style={{color: '#636e72', fontWeight: 500}}>khách mới tuần này</span>
          </div>
          <div className="report-stat-footer">
            <FiPieChart size={14} color="#d63031"/> Chiếm 37.5% tổng lượt mua
          </div>
        </div>
      </div>

      {/* 3. Lưới Biểu Đồ */}
      <div className="charts-grid">
        {/* Cột Trái: Top 5 */}
        <div className="chart-card">
          <div className="chart-header">
            <div>
              <div className="chart-title">Top 5 Sản Phẩm Bán Chạy</div>
              <div className="chart-sub">Thống kê theo số lượng bán và đóng góp doanh số</div>
            </div>
            <FiBarChart2 size={20} color="#888"/>
          </div>

          <div className="top-products-list">
            {topProducts.map((product) => (
              <div className="product-item" key={product.id}>
                <div className="product-info-row">
                  <div className="product-name-col">
                    <div className={`rank-badge ${product.rankClass}`}>{product.id}</div>
                    <div className="product-name">{product.name}</div>
                  </div>
                  <div className="product-stats-col">
                    <div className="product-revenue">{product.rev}</div>
                    <div className="product-orders">{product.orders} đơn</div>
                  </div>
                </div>
                <div className="progress-track">
                  <div className={`progress-fill ${product.rankClass}-fill`} style={{ width: `${product.percent}%` }}></div>
                </div>
              </div>
            ))}
          </div>

          <div className="top-products-footer">
            <span style={{fontSize: '13px', color: '#636e72'}}>Tổng giá trị Top 5: <strong style={{color: '#2d3436'}}>50.000.000 đ</strong></span>
            <span style={{fontSize: '13px', color: '#d63031', fontWeight: 600, cursor: 'pointer'}}>Chi tiết kho hàng</span>
          </div>
        </div>

        {/* Cột Phải: Biểu đồ Donut */}
        <div className="chart-card">
          <div className="chart-header">
            <div>
              <div className="chart-title">Tỷ Lệ Trạng Thái Đơn Hàng</div>
              <div className="chart-sub">Phân bổ 120 đơn hàng trong kỳ</div>
            </div>
            <FiPieChart size={20} color="#888"/>
          </div>

          <div className="donut-chart-container">
            {/* CSS Conic Gradient tạo thành Donut Chart */}
            <div className="donut-wrapper">
              <div className="donut-inner">
                <span className="donut-inner-val">120</span>
                <span className="donut-inner-label">Đơn hàng</span>
              </div>
            </div>

            <div className="chart-legend">
              <div className="legend-item">
                <div className="legend-label"><span className="legend-dot dot-blue"></span> Thành công</div>
                <div className="legend-stats"><span>90 đơn</span> <span className="legend-pct" style={{color: '#0984e3'}}>75%</span></div>
              </div>
              <hr style={{border: 'none', borderTop: '1px solid #f1f2f6', width: '100%', margin: '4px 0'}}/>
              <div className="legend-item">
                <div className="legend-label"><span className="legend-dot dot-pink"></span> Đang giao</div>
                <div className="legend-stats"><span>22 đơn</span> <span className="legend-pct" style={{color: '#d63031', background: '#fff0f0'}}>18%</span></div>
              </div>
              <hr style={{border: 'none', borderTop: '1px solid #f1f2f6', width: '100%', margin: '4px 0'}}/>
              <div className="legend-item">
                <div className="legend-label"><span className="legend-dot dot-red"></span> Đã hủy</div>
                <div className="legend-stats"><span>8 đơn</span> <span className="legend-pct" style={{color: '#b31217', background: '#ffebeb'}}>7%</span></div>
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
          {/* Cập nhật icon tại đây */}
          <div className="strategy-icon"><FiTarget size={20} /></div>
          <div className="strategy-text">
            <h4>Đánh giá chiến lược từ hệ thống</h4>
            <p>Doanh số phụ kiện bàn phím cơ đóng góp hơn <strong>60%</strong> tổng doanh thu. Đề xuất tăng cường tồn kho dòng switch và keycap trong tháng tới.</p>
          </div>
        </div>
        <button className="btn-outline-red">Lập kế hoạch kho</button>
      </div>
    </div>
  );
};

export default StrategicReport;