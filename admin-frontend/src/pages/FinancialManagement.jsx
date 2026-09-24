import React from 'react';
import { 
  FiArrowDownRight, FiArrowUpRight, FiDollarSign, FiDownload, 
  FiSearch, FiFilter, FiFileText, FiCheckCircle, FiBox
} from 'react-icons/fi';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import './FinancialManagement.css';

const FinancialManagement = () => {
  // Mock data cho bảng
  const transactions = [
    { id: '#GD-89241', type: 'in', typeText: '↓ Tiền vào', amount: '+ 2.890.000 đ', desc: 'Bán lẻ Bàn phím Akko 3098B Multi-modes', time: '15/03/2025 14:32' },
    { id: '#GD-89240', type: 'out', typeText: '↑ Tiền ra', amount: '- 18.500.000 đ', desc: 'Nhập lô switch Jelly Red & linh kiện custom', time: '15/03/2025 11:15' },
    { id: '#GD-89239', type: 'in', typeText: '↓ Tiền vào', amount: '+ 42.500.000 đ', desc: 'Thanh toán bộ PC Custom RTX 4080 (Mã build: #CTUT-98)', time: '14/03/2025 18:40' },
    { id: '#GD-89238', type: 'out', typeText: '↑ Tiền ra', amount: '- 3.200.000 đ', desc: 'Cước vận chuyển Viettel Post & Shopee Xpress tuần 10', time: '14/03/2025 09:20' }
  ];

  // Mock data cho biểu đồ
  const chartData = [
    { name: 'Tháng 10', income: 90, expense: 30 },
    { name: 'Tháng 11', income: 110, expense: 40 },
    { name: 'Tháng 12', income: 175, expense: 60 },
    { name: 'Tháng 1', income: 120, expense: 40 },
    { name: 'Tháng 2', income: 140, expense: 45 },
    { name: 'Tháng 3 (Hiện tại)', income: 150, expense: 45 },
  ];

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
          <button className="export-btn"><FiDownload size={16}/> Xuất dữ liệu (Excel)</button>
        </div>
      </div>

      {/* Thẻ thống kê */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-title">TỔNG DÒNG TIỀN VÀO <span className="sub">Cash Inflow (Doanh thu)</span></div>
            <div className="icon-box green"><FiArrowDownRight size={18}/></div>
          </div>
          <div className="stat-value in">+ 150.000.000 ₫</div>
          <div className="stat-desc green-text">↗ +12% so với tháng trước</div>
          <div className="stat-desc" style={{marginTop: '5px'}}><FiCheckCircle size={12}/> Thu từ 320 đơn hàng thành công</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-title">TỔNG DÒNG TIỀN RA <span className="sub">Cash Outflow (Chi phí)</span></div>
            <div className="icon-box red"><FiArrowUpRight size={18}/></div>
          </div>
          <div className="stat-value out">- 45.000.000 ₫</div>
          <div className="stat-desc" style={{color: '#d63031'}}>↳ Chi nhập hàng & vận chuyển</div>
          <div className="stat-desc" style={{marginTop: '5px'}}><FiBox size={12}/> Chi phí linh kiện, bàn phím và đóng gói</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-title">LỢI NHUẬN RÒNG <span className="sub">Net Operating Profit</span></div>
            <div className="icon-box orange"><FiDollarSign size={18}/></div>
          </div>
          <div className="stat-value profit">105.000.000 ₫</div>
          <div className="stat-desc" style={{color: '#d63031'}}>% Tỷ suất lợi nhuận: 70%</div>
          <div className="stat-desc" style={{marginTop: '5px'}}><FiCheckCircle size={12}/> Dòng tiền thực thu sau khi trừ toàn bộ chi phí</div>
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
                  <stop offset="5%" stopColor="#00b894" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#00b894" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#d63031" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#d63031" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#888'}} />
              <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#888'}} tickFormatter={(value) => `${value} Tr`} />
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
              <FiSearch className="search-icon" size={14}/>
              <input type="text" placeholder="Tìm mã giao dịch..." />
            </div>
            <button className="filter-btn"><FiFilter size={16}/></button>
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
            {transactions.map(t => (
              <tr key={t.id}>
                <td style={{color: '#d63031', fontWeight: 'bold'}}>{t.id}</td>
                <td><span className={`badge ${t.type}`}>{t.typeText}</span></td>
                <td>
                  <div className={t.type === 'in' ? 'val-in' : 'val-out'}>{t.amount}</div>
                  <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>{t.desc}</div>
                </td>
                <td style={{fontSize: '12px'}}>{t.time}</td>
                <td><button className="action-btn"><FiFileText size={18}/></button></td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Phân trang */}
        <div className="pagination">
          <span>Hiển thị 4 giao dịch gần nhất • <span style={{color: '#d63031', cursor: 'pointer'}}>Xem tất cả nhật ký</span></span>
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