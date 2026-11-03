import React, { useState, useEffect } from 'react';
import {
  FiArrowDownRight, FiArrowUpRight, FiDollarSign, FiDownload,
  FiSearch, FiFilter, FiFileText, FiCheckCircle, FiBox
} from 'react-icons/fi';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { financeService } from '../services/financeService'; // Bổ sung dòng import này
import './FinancialManagement.css';

const FinancialManagement = () => {
  // 1. Tạo các biến State để lưu trữ dữ liệu thật
  const [summary, setSummary] = useState({ income: 0, expense: 0, profit: 0, profitMargin: 0 });
  const [chartData, setChartData] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // 2. Dùng useEffect để gọi API ngay khi mở trang
  useEffect(() => {
    const fetchFinanceData = async () => {
      setIsLoading(true);
      try {
        // Dùng Promise.all để gọi 3 API cùng một lúc cho tốc độ load trang nhanh hơn
        const [summaryData, chartResponse, txResponse] = await Promise.all([
          financeService.getSummary(3, 2025), // Ví dụ lấy tháng 3 năm 2025
          financeService.getChartData(),
          financeService.getTransactions(10)
        ]);

        // Cập nhật state bằng dữ liệu trả về từ Backend
        setSummary(summaryData);
        setChartData(chartResponse);
        setTransactions(txResponse);
      } catch (error) {
        console.error("Không thể tải dữ liệu tài chính", error);
        // Ở đây cậu có thể hiển thị một thông báo Toast lỗi cho người dùng
      } finally {
        setIsLoading(false);
      }
    };

    fetchFinanceData();
  }, []);

  // 3. Hiển thị thông báo đang tải nếu dữ liệu chưa về kịp
  if (isLoading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Đang tải dữ liệu tài chính...</div>;
  }

  // Hàm hỗ trợ định dạng tiền tệ VNĐ
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN').format(amount) + ' ₫';
  };

  return (
    <div>
      {/* Tiêu đề & Công cụ điều khiển */}
      <div className="page-header">
        <div className="page-title">
          <h1>Quản Lý Tài Chính & Dòng Tiền</h1>
          <p>Theo dõi doanh thu, chi phí vận hành và lợi nhuận ròng của cửa hàng CTUT Gear</p>
        </div>
        <div className="header-actions">
          <span className="report-label">KỲ BÁO CÁO</span>
          <select className="month-select">
            <option>Tháng này - Tháng 03/2025</option>
          </select>
          <button className="export-btn"><FiDownload size={16} /> Xuất dữ liệu (Excel)</button>
        </div>
      </div>

      {/* Thẻ thống kê */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-title">TỔNG DÒNG TIỀN VÀO <span className="sub">Cash Inflow (Doanh thu)</span></div>
            <div className="icon-box green"><FiArrowDownRight size={18} /></div>
          </div>
          <div className="stat-value in">+ {formatCurrency(summary.income)}</div>
          <div className="stat-desc green-text">↗ Dữ liệu cập nhật theo thời gian thực</div>
          <div className="stat-desc" style={{ marginTop: '5px' }}><FiCheckCircle size={12} /> Đã cộng dồn tất cả phiếu thu</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-title">TỔNG DÒNG TIỀN RA <span className="sub">Cash Outflow (Chi phí)</span></div>
            <div className="icon-box red"><FiArrowUpRight size={18} /></div>
          </div>
          <div className="stat-value out">- {formatCurrency(summary.expense)}</div>
          <div className="stat-desc" style={{ color: '#d63031' }}>↳ Chi nhập hàng & vận chuyển</div>
          <div className="stat-desc" style={{ marginTop: '5px' }}><FiBox size={12} /> Chi phí linh kiện, bàn phím và đóng gói</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-title">LỢI NHUẬN RÒNG <span className="sub">Net Operating Profit</span></div>
            <div className="icon-box orange"><FiDollarSign size={18} /></div>
          </div>
          <div className="stat-value profit">{formatCurrency(summary.profit)}</div>
          <div className="stat-desc" style={{ color: '#d63031' }}>% Tỷ suất lợi nhuận: {summary.profitMargin}%</div>
          <div className="stat-desc" style={{ marginTop: '5px' }}><FiCheckCircle size={12} /> Dòng tiền thực thu sau khi trừ toàn bộ chi phí</div>
        </div>
      </div>

      {/* Biểu đồ */}
      <div className="chart-container">
        <div className="chart-header">
          <div className="chart-title">
            <h3>Biểu Đồ Tổng Quan Dòng Tiền</h3>
            <div className="chart-legend">
              <div className="legend-item"><span className="dot green"></span> Tiền vào (Doanh thu)</div>
              <div className="legend-item"><span className="dot red"></span> Tiền ra (Chi phí)</div>
            </div>
          </div>
          <div className="chart-tabs">
            <button className="chart-tab">Theo tuần</button>
            <button className="chart-tab active">Theo tháng (6 tháng gần nhất)</button>
            <button className="chart-tab">Theo quý</button>
          </div>
        </div>
        <div style={{ width: '100%', height: 250 }}>
          <ResponsiveContainer>
            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00b894" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#00b894" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#d63031" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#d63031" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} tickFormatter={(value) => `${value} Tr`} />
              <Tooltip />
              <Area type="monotone" dataKey="income" stroke="#00b894" strokeWidth={2} fillOpacity={1} fill="url(#colorIncome)" />
              <Area type="monotone" dataKey="expense" stroke="#d63031" strokeWidth={2} fillOpacity={1} fill="url(#colorExpense)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bảng dữ liệu */}
      <div className="table-wrapper">
        <div className="table-header-flex">
          <div>
            <h3>Nhật Ký Giao Dịch Gần Đây</h3>
            <p>Chi tiết các khoản thu chi mới nhất theo thời gian thực</p>
          </div>
          <div className="table-controls">
            <div className="search-box">
              <FiSearch className="search-icon" size={14} />
              <input type="text" placeholder="Tìm mã giao dịch..." />
            </div>
            <button className="filter-btn"><FiFilter size={16} /></button>
          </div>
        </div>

        <table className="custom-table">
          <thead>
            <tr>
              <th>Mã giao dịch</th>
              <th>Loại (Vào/Ra)</th>
              <th>Số tiền & Nội dung diễn giải</th>
              <th>Thời gian</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {transactions.length > 0 ? (
              transactions.map(t => (
                <tr key={t.id}>
                  <td style={{ color: '#d63031', fontWeight: 'bold' }}>{t.maGiaoDich}</td>
                  <td><span className={`badge ${t.type === 'IN' ? 'in' : 'out'}`}>{t.type === 'IN' ? '↓ Tiền vào' : '↑ Tiền ra'}</span></td>
                  <td>
                    <div className={t.type === 'IN' ? 'val-in' : 'val-out'}>
                      {t.type === 'IN' ? '+ ' : '- '} {formatCurrency(t.amount)}
                    </div>
                    <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>{t.description}</div>
                  </td>
                  <td style={{ fontSize: '12px' }}>{t.time}</td>
                  <td><button className="action-btn"><FiFileText size={18} /></button></td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>Không có giao dịch nào gần đây.</td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Phân trang */}
        <div className="pagination">
          <span>Hiển thị {transactions.length} giao dịch gần nhất • <span style={{ color: '#d63031', cursor: 'pointer' }}>Xem tất cả nhật ký</span></span>
          <div className="page-numbers">
            <button className="page-btn">Trước</button>
            <button className="page-btn active">1</button>
            <button className="page-btn">2</button>
            <button className="page-btn">Sau</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialManagement;