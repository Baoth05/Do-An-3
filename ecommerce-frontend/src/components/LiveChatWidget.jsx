// src/components/LiveChatWidget.jsx
import React, { useState, useEffect, useRef } from 'react';
import { 
  FiMessageSquare, FiX, FiSend, FiHelpCircle, FiAlertTriangle, 
  FiCheckCircle, FiClock, FiShoppingBag, FiShield, FiPhoneCall, FiChevronRight 
} from 'react-icons/fi';
import { authService } from '../services/authService';
import './LiveChatWidget.css';

const DEFAULT_MESSAGES = [
  {
    id: 1,
    sender: 'bot',
    text: '👋 Xin chào bạn! Mình là Trợ lý AI của CTUT Gear. Bạn cần mình tư vấn cấu hình sản phẩm hay muốn gửi khiếu nại/báo lỗi đơn hàng?',
    time: 'Vừa xong',
    mode: 'consult'
  }
];

const QUICK_CONSULT_PROMPTS = [
  '🎮 Gợi ý cấu hình PC Gaming 2026',
  '🛡️ Chính sách bảo hành 1 đổi 1',
  '🎟️ Cách săn & dùng Voucher toàn sàn',
  '🚚 Thời gian & phí giao hàng liên kho',
  '📦 Quy trình ký hợp đồng đối tác bán hàng'
];

export const LiveChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('consult'); // 'consult' | 'complaint'
  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem('chat_messages');
      return saved ? JSON.parse(saved) : DEFAULT_MESSAGES;
    } catch {
      return DEFAULT_MESSAGES;
    }
  });
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Form khiếu nại / báo lỗi
  const [complaintForm, setComplaintForm] = useState({
    orderId: '',
    category: 'Giao hàng trễ / Sai địa chỉ',
    urgency: 'Bình thường',
    description: '',
    contactPhone: ''
  });
  const [submittedTickets, setSubmittedTickets] = useState(() => {
    try {
      const saved = localStorage.getItem('support_tickets');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [ticketNotice, setTicketNotice] = useState(null);

  const messagesEndRef = useRef(null);

  // Lấy thông tin user đăng nhập
  const customer = authService.getCurrentCustomer();
  const seller = authService.getCurrentSeller();
  const currentUser = customer || seller;

  useEffect(() => {
    try {
      localStorage.setItem('chat_messages', JSON.stringify(messages));
    } catch (e) {
      console.error(e);
    }
  }, [messages]);

  useEffect(() => {
    try {
      localStorage.setItem('support_tickets', JSON.stringify(submittedTickets));
    } catch (e) {
      console.error(e);
    }
  }, [submittedTickets]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isTyping]);

  const handleSendMessage = (textToSend) => {
    const text = textToSend || inputValue;
    if (!text.trim()) return;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: text.trim(),
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      userName: currentUser?.hoTen || 'Bạn'
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputValue('');
    setIsTyping(true);

    // Xử lý phản hồi thông minh của Bot
    setTimeout(() => {
      const replyText = generateBotReply(text.trim(), currentUser);
      const botMsg = {
        id: Date.now() + 1,
        sender: 'bot',
        text: replyText,
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);
    }, 900);
  };

  const generateBotReply = (query, user) => {
    const q = query.toLowerCase();

    if (q.includes('pc') || q.includes('cấu hình') || q.includes('gaming')) {
      return `🖥️ CTUT Gear cung cấp đa dạng linh kiện từ VGA RTX 40/50 Series, CPU Core i7/i9 đến RAM DDR5. Bạn có thể ghé mục Danh mục trên Trang Chủ hoặc nhắn khoảng ngân sách (ví dụ: 15-20 triệu) để mình lọc cấu hình tối ưu nhất nhé!`;
    }
    if (q.includes('bảo hành') || q.includes('đổi trả') || q.includes('lỗi')) {
      return `🛡️ Tất cả sản phẩm tại CTUT Gear đều cam kết 100% chính hãng và được bảo hành 1 ĐỔI 1 trực tiếp tại Kho Tổng trong 30 ngày nếu có lỗi phần cứng từ nhà sản xuất. Nếu cần hỗ trợ đổi trả, bạn hãy chuyển sang tab "Khiếu Nại / Báo Lỗi" ngay góc trên để tạo yêu cầu nhé!`;
    }
    if (q.includes('voucher') || q.includes('mã giảm') || q.includes('khuyến mãi')) {
      return `🎟️ Hiện CTUT Gear đang phát hành mã CTUTNEW50 (giảm 50k), FREESHIP (miễn phí vận chuyển toàn quốc) và mã shop lên tới 15%. Bạn có thể vào mục "Kho Voucher" trên menu để lưu ngay!`;
    }
    if (q.includes('vận chuyển') || q.includes('ship') || q.includes('giao')) {
      return `🚚 Đơn hàng của bạn sẽ được hệ thống tự động gom và chia theo kho của từng shop. Giao hỏa tốc nội thành trong 2-4h và liên tỉnh từ 24h - 48h.`;
    }
    if (q.includes('người bán') || q.includes('chủ shop') || q.includes('kho') || q.includes('hợp đồng')) {
      return `🏪 Bạn có thể mở gian hàng và kho riêng ngay tại /seller/register! Sau khi tạo shop, chủ cửa hàng vào mục "Ký Hợp Đồng Kho Tổng" để nhập hàng phân phối điện tử và bán trực tiếp trên Marketplace.`;
    }
    if (q.includes('chào') || q.includes('hi') || q.includes('hello')) {
      return `Chào ${user?.hoTen || 'bạn'}! Rất vui được hỗ trợ bạn. Bạn muốn tư vấn sản phẩm công nghệ nào hay cần trợ giúp về đơn hàng hiện tại?`;
    }

    return `Cảm ơn ${user?.hoTen || 'bạn'} đã nhắn tin. Mình đã ghi nhận câu hỏi: "${query}". Đội ngũ Chăm sóc khách hàng CTUT Gear sẽ đồng hành và liên hệ hỗ trợ bạn ngay qua hotline 1900-888-CTUT nếu cần giải quyết khẩn cấp!`;
  };

  const handleTicketSubmit = (e) => {
    e.preventDefault();
    if (!complaintForm.description.trim()) {
      alert('Vui lòng nhập mô tả chi tiết vấn đề bạn đang gặp phải!');
      return;
    }

    const newTicket = {
      ticketId: 'TK-' + Math.floor(100000 + Math.random() * 900000),
      orderId: complaintForm.orderId.trim() || 'N/A',
      category: complaintForm.category,
      urgency: complaintForm.urgency,
      description: complaintForm.description.trim(),
      phone: complaintForm.contactPhone.trim() || currentUser?.soDienThoai || 'Chưa cung cấp',
      createdAt: new Date().toLocaleString('vi-VN'),
      status: 'Đã Tiếp Nhận (Đang xử lý)',
      customerName: currentUser?.hoTen || 'Khách hàng'
    };

    setSubmittedTickets((prev) => [newTicket, ...prev]);
    setTicketNotice(newTicket);

    // Gửi luôn một thông báo vào luồng tin nhắn chat
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        sender: 'bot',
        text: `✅ [HỆ THỐNG KHIẾU NẠI] Đã tạo thành công Phiếu tiếp nhận #${newTicket.ticketId} cho nội dung: "${newTicket.category}". Chuyên viên kỹ thuật sẽ kiểm tra và phản hồi trong 15-30 phút!`,
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
      }
    ]);

    setComplaintForm({
      orderId: '',
      category: 'Giao hàng trễ / Sai địa chỉ',
      urgency: 'Bình thường',
      description: '',
      contactPhone: ''
    });
  };

  return (
    <div className="live-chat-floating-wrapper">
      {/* Nút Tròn Bật/Tắt Chatbot */}
      <button 
        className={`chat-launcher-btn ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Hỗ trợ & Khiếu nại trực tuyến"
      >
        {isOpen ? (
          <FiX size={24} />
        ) : (
          <>
            <FiMessageSquare size={24} />
            <span className="online-indicator"></span>
            <span className="tooltip-hint">Hỗ trợ & Khiếu nại 24/7</span>
          </>
        )}
      </button>

      {/* Cửa Sổ Hộp Thoại Chat */}
      {isOpen && (
        <div className="chat-window-card">
          {/* Header */}
          <div className="chat-header">
            <div className="chat-header-info">
              <div className="chat-avatar-ring">
                <span className="avatar-icon">🤖</span>
                <span className="status-dot"></span>
              </div>
              <div>
                <h4>CTUT Gear AI Assistant</h4>
                <p>
                  {currentUser ? `Đang hỗ trợ: ${currentUser.hoTen || currentUser.taiKhoan}` : 'Trực tuyến 24/7 • Phản hồi tức thì'}
                </p>
              </div>
            </div>
            <button className="chat-close-btn" onClick={() => setIsOpen(false)}>
              <FiX size={18} />
            </button>
          </div>

          {/* Tab Chọn Chức Năng: Tư Vấn vs Khiếu Nại */}
          <div className="chat-mode-tabs">
            <button 
              className={`mode-tab ${activeTab === 'consult' ? 'active' : ''}`}
              onClick={() => setActiveTab('consult')}
            >
              <FiHelpCircle size={15} /> Tư Vấn Mua Sắm
            </button>
            <button 
              className={`mode-tab ${activeTab === 'complaint' ? 'active' : ''}`}
              onClick={() => setActiveTab('complaint')}
            >
              <FiAlertTriangle size={15} /> Khiếu Nại & Báo Lỗi
              {submittedTickets.length > 0 && (
                <span className="ticket-count-badge">{submittedTickets.length}</span>
              )}
            </button>
          </div>

          {/* NỘI DUNG TAB 1: TƯ VẤN MUA HÀNG */}
          {activeTab === 'consult' && (
            <div className="chat-consult-pane">
              <div className="chat-messages-container">
                {messages.map((msg) => (
                  <div 
                    key={msg.id} 
                    className={`chat-message-row ${msg.sender === 'user' ? 'outgoing' : 'incoming'}`}
                  >
                    {msg.sender === 'bot' && (
                      <div className="message-avatar">🤖</div>
                    )}
                    <div className="message-bubble">
                      <p>{msg.text}</p>
                      <span className="message-time">{msg.time}</span>
                    </div>
                  </div>
                ))}

                {isTyping && (
                  <div className="chat-message-row incoming">
                    <div className="message-avatar">🤖</div>
                    <div className="typing-indicator">
                      <span></span><span></span><span></span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Prompt Chips */}
              <div className="quick-prompts-bar">
                <div className="quick-prompts-scroll">
                  {QUICK_CONSULT_PROMPTS.map((prompt, idx) => (
                    <button 
                      key={idx} 
                      className="prompt-chip"
                      onClick={() => handleSendMessage(prompt)}
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Input Bar */}
              <div className="chat-input-row">
                <input
                  type="text"
                  placeholder="Nhập câu hỏi tư vấn sản phẩm, đơn hàng..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <button 
                  className="chat-send-btn"
                  onClick={() => handleSendMessage()}
                  disabled={!inputValue.trim()}
                >
                  <FiSend size={16} />
                </button>
              </div>
            </div>
          )}

          {/* NỘI DUNG TAB 2: KHIẾU NẠI & BÁO LỖI */}
          {activeTab === 'complaint' && (
            <div className="chat-complaint-pane">
              {ticketNotice && (
                <div className="ticket-success-alert">
                  <div className="ticket-success-header">
                    <FiCheckCircle size={18} color="#10b981" />
                    <strong>Đã Tạo Phiếu Tiếp Nhận #{ticketNotice.ticketId}</strong>
                  </div>
                  <p>Bộ phận Chăm Sóc Khách Hàng CTUT Gear đã tiếp nhận yêu cầu và sẽ liên hệ giải quyết trong thời gian sớm nhất.</p>
                  <button className="btn-dismiss-ticket" onClick={() => setTicketNotice(null)}>Đóng</button>
                </div>
              )}

              <form onSubmit={handleTicketSubmit} className="complaint-form">
                <div className="complaint-title-group">
                  <h5>Gửi Yêu Cầu Hỗ Trợ Kỹ Thuật & Khiếu Nại</h5>
                  <p>Cam kết giải quyết trong 24h từ Kho Tổng & Bộ phận Vận hành</p>
                </div>

                <div className="complaint-field">
                  <label>Mã Đơn Hàng (nếu khiếu nại về đơn mua)</label>
                  <input
                    type="text"
                    placeholder="ví dụ: ORD-173000..."
                    value={complaintForm.orderId}
                    onChange={(e) => setComplaintForm({ ...complaintForm, orderId: e.target.value })}
                  />
                </div>

                <div className="complaint-row-2">
                  <div className="complaint-field">
                    <label>Loại vấn đề *</label>
                    <select
                      value={complaintForm.category}
                      onChange={(e) => setComplaintForm({ ...complaintForm, category: e.target.value })}
                    >
                      <option value="Giao hàng trễ / Sai địa chỉ">🚚 Giao hàng trễ / Sai địa chỉ</option>
                      <option value="Sản phẩm lỗi phần cứng / Hỏng hóc">🛡️ Sản phẩm lỗi / Cần bảo hành</option>
                      <option value="Giao sai hoặc thiếu linh kiện">📦 Giao sai / Thiếu kiện hàng</option>
                      <option value="Lỗi thanh toán / Trừ tiền trùng">💳 Lỗi thanh toán / Tiền cọc</option>
                      <option value="Khiếu nại thái độ Người bán / Shop">🏪 Phản ánh gian hàng đối tác</option>
                      <option value="Vấn đề kỹ thuật khác">⚙️ Sự cố kỹ thuật khác</option>
                    </select>
                  </div>

                  <div className="complaint-field">
                    <label>Mức độ khẩn cấp</label>
                    <select
                      value={complaintForm.urgency}
                      onChange={(e) => setComplaintForm({ ...complaintForm, urgency: e.target.value })}
                    >
                      <option value="Bình thường">🟢 Bình thường</option>
                      <option value="Ưu tiên">🟡 Cần hỗ trợ trong ngày</option>
                      <option value="Khẩn cấp">🔴 Rất khẩn cấp (Hỏa tốc)</option>
                    </select>
                  </div>
                </div>

                <div className="complaint-field">
                  <label>Số điện thoại liên hệ xác minh</label>
                  <input
                    type="tel"
                    placeholder="ví dụ: 0908 123 456"
                    value={complaintForm.contactPhone}
                    onChange={(e) => setComplaintForm({ ...complaintForm, contactPhone: e.target.value })}
                  />
                </div>

                <div className="complaint-field">
                  <label>Mô tả chi tiết sự cố hoặc nội dung khiếu nại *</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Vui lòng mô tả chi tiết lỗi phát sinh, hình ảnh/video bằng chứng (nếu có) để kỹ thuật viên xử lý nhanh nhất..."
                    value={complaintForm.description}
                    onChange={(e) => setComplaintForm({ ...complaintForm, description: e.target.value })}
                  ></textarea>
                </div>

                <button type="submit" className="btn-submit-complaint">
                  GỬI PHIẾU KHIẾU NẠI & NHẬN MÃ TICKET →
                </button>
              </form>

              {/* Danh sách ticket đã gửi */}
              {submittedTickets.length > 0 && (
                <div className="ticket-history-section">
                  <h6>Phiếu hỗ trợ gần đây ({submittedTickets.length}):</h6>
                  <div className="ticket-list-cards">
                    {submittedTickets.slice(0, 3).map((tk) => (
                      <div key={tk.ticketId} className="ticket-summary-card">
                        <div className="ticket-card-header">
                          <span className="ticket-id-tag">#{tk.ticketId}</span>
                          <span className="ticket-status-pill">{tk.status}</span>
                        </div>
                        <p className="ticket-cat">{tk.category}</p>
                        <span className="ticket-date"><FiClock size={11} /> {tk.createdAt}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Footer hotline */}
          <div className="chat-footer-bar">
            <span><FiPhoneCall size={12} /> Hotline hỗ trợ khẩn cấp: <strong>1900-888-CTUT</strong> (8h - 22h)</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveChatWidget;

