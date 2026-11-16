# CTUT GEAR MARKETPLACE (ECOMMERCE FRONTEND)

> **Phân hệ:** Sàn Thương Mại Điện Tử & Kênh Quản Trị Người Bán (B2B2C)  
> **Framework:** React 18, Vite, React Router DOM, React Icons, Axios  
> **Tài liệu kiến trúc chi tiết:** Xem tại [ECOMMERCE_SELLER_ARCHITECTURE.md](../ECOMMERCE_SELLER_ARCHITECTURE.md)  

---

## 1. TỔNG QUAN

`ecommerce-frontend` là phân hệ giao diện phục vụ hai nhóm đối tượng người dùng độc lập:
1. **Khách Hàng (Customer Model):** Mua sắm linh kiện PC, Laptop, Gaming Gear chính hãng, giỏ hàng đa shop, áp voucher 2 tầng, thanh toán tách đơn, ví ảo CTUT Pay, chat với gian hàng.
2. **Chủ Cửa Hàng (Seller Model):** Quản trị gian hàng, quản lý kho riêng độc lập, ký kết hợp đồng cung ứng 5 bước với Kho Tổng Trung Tâm, quản lý tồn kho kệ hàng, đăng bán sản phẩm và xử lý đơn hàng.

---

## 2. KHỞI CHẠY DỰ ÁN

```bash
# Cài đặt thư viện
npm install

# Khởi chạy môi trường phát triển
npm run dev

# Biên dịch sản phẩm (Production Build)
npm run build
```

---

## 3. CÁC TÀI KHOẢN KIỂM THỬ MẪU (TEST ACCOUNTS)

- **Khách Hàng (có thể chuyển sang Bán Hàng):** `hungbakkka` / `123456`
- **Chủ Shop (Kênh Người Bán):** `seller_minhquan` / `123456`
- **Khách Mua Hàng:** `baomap05` / `123456` hoặc `khachhang` / `123456`
- **Quản Trị Viên:** `admin` / `admin`
