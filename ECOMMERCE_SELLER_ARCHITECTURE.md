# KIẾN TRÚC PHÂN HỆ ECOMMERCE & KÊNH NGƯỜI BÁN (CTUT GEAR MARKETPLACE)

> **Mã đề tài đồ án:** DA-TMDT-04  
> **Phân hệ:** Sàn Thương Mại Điện Tử Tập Trung & Kênh Quản Trị Người Bán (B2B2C)  
> **Dự án Frontend:** `ecommerce-frontend` (Port Vite `5173` hoặc `5175`)  
> **Cổng API Gateway:** `http://localhost:8080`  
> **Dịch vụ Xác thực & Phân quyền:** `identity-service` (Port `8084`)  
> **Dịch vụ Kho Vận WMS:** `wms-core-service` (Port `8081`)  
> **Dịch vụ Đơn Hàng & Voucher:** `order-service` (Port `8082`)  
> **Cơ sở dữ liệu:** PostgreSQL (`identity_db`, `wms_core_db`, `order_db`)  
> **Ngày cập nhật:** 16/11/2026  

---

## 1. TỔNG QUAN KIẾN TRÚC HỆ THỐNG & MÔ HÌNH B2B2C

Hệ sinh thái CTUT Gear vận hành theo mô hình chuỗi cung ứng **B2B2C (Business-to-Business-to-Consumer)** kết hợp giữa **Kho Tổng Trung Tâm (WMS)** và **Sàn Thương Mại Điện Tử Đa Gian Hàng (Marketplace)**:

```
                  ┌─────────────────────────────────────────────────────────┐
                  │                 CTUT GEAR ECOSYSTEM                     │
                  └──────────────────────────┬──────────────────────────────┘
                                             │
                       ┌─────────────────────┴─────────────────────┐
                       ▼                                           ▼
         ┌───────────────────────────┐               ┌───────────────────────────┐
         │     CỔNG KHÁCH HÀNG       │               │      KÊNH NGƯỜI BÁN       │
         │   (Customer Marketplace)  │               │      (Seller Portal)      │
         │   • Xem sản phẩm, Voucher │               │   • Quản lý Gian hàng & Kho│
         │   • Giỏ hàng đa shop      │               │   • Hợp đồng cung ứng B2B │
         │   • Đặt hàng & Tra cứu    │               │   • Đăng bán & Xử lý đơn  │
         └─────────────┬─────────────┘               └─────────────┬─────────────┘
                       │ (customer_token)                          │ (seller_token)
                       └─────────────────────┬─────────────────────┘
                                             │
                                             ▼
                              ┌─────────────────────────────┐
                              │     API GATEWAY (Port 8080) │
                              │     AuthenticationFilter    │
                              └──────────────┬──────────────┘
                                             │
      ┌──────────────────────┬───────────────┼───────────────┬──────────────────────┐
      ▼                      ▼               ▼               ▼                      ▼
┌──────────────┐      ┌──────────────┐┌──────────────┐┌──────────────┐      ┌──────────────┐
│identity-serv │      │wms-core-serv ││order-service ││product-serv  │      │payment-serv  │
│  (Port 8084) │      │  (Port 8081) ││ (Port 8082)  ││ (Port 8083)  │      │ (Port 8085)  │
│ RBAC, User,  │      │ Kho tổng,    ││ Đơn hàng,    ││ Master Data  │      │ MoMo, QR Pay,│
│ JWT Token    │      │ Tồn kho kệ   ││ Voucher shop ││ Sản phẩm thật│      │ Ví CTUT Pay  │
└──────────────┘      └──────────────┘└──────────────┘└──────────────┘      └──────────────┘
```

### Nguyên Tắc Cốt Lõi:
1. **Dữ Liệu Thật 100% (No Fake Data):** Mọi sản phẩm, kho hàng, số lượng tồn và trạng thái hợp đồng đều truy vấn trực tiếp từ CSDL PostgreSQL qua API Gateway.
2. **Kho 2 Tầng Chuẩn Hóa:**
   - **Tầng 1 (Kho Tổng Duy Nhất):** Kho Tổng Trung Tâm đại diện Bên A cung ứng nguồn hàng chính hãng chuẩn Master Catalog (`KHO-457` - SLO).
   - **Tầng 2 (Kho Riêng Độc Lập Của Shop):** Mỗi Chủ Cửa Hàng sở hữu duy nhất 1 kho hàng độc lập (`quanLyId = seller.id`), kết nối nhập hàng từ Kho Tổng qua Hợp đồng Cung ứng số.
3. **Phân Tách 2 Model Xác Thực Độc Lập:** Phân định rõ ràng giữa **Model Khách Hàng (Customer Model)** và **Model Người Bán (Seller Model)**, có cơ chế Chuyển đổi nhanh 1 chạm (Quick Switch) không cần nhập lại mật khẩu.

---

## 2. MA TRẬN PHÂN QUYỀN TOÀN HỆ THỐNG (RBAC MATRIX)

| Vai Trò Người Dùng | Mã Quyền (Role) | Cổng Quản Trị Hệ Thống (`admin-frontend` :5174) | Cổng Kho Bãi WMS (`wms-frontend` :5173) | Kênh Người Bán Shop (`ecommerce/seller` :5173) | Cổng Khách Hàng TMĐT (`ecommerce` :5173) | Quyền Hạn Backend Microservices |
|---|---|:---:|:---:|:---:|:---:|---|
| **QUẢN TRỊ VIÊN (ADMIN)** | `ADMIN` | ✅ **Toàn Quyền** | ✅ **Toàn Quyền** | ✅ **Toàn Quyền (Xem mọi kho)** | ✅ **Toàn Quyền** | Toàn quyền gọi tất cả API trên toàn bộ các Microservices. Duyệt hợp đồng cung ứng 2 vòng. |
| **THỦ KHO TỔNG** | `WAREHOUSE_MANAGER`, `THUKHO` | ❌ Bị chặn (403) | ✅ **Toàn quyền WMS** | ❌ Bị chặn (403) | ❌ Bị chặn mua sắm | Thao tác nhập/xuất kho tổng, xuất hàng theo hợp đồng cung ứng, tạo PO, quản lý danh mục & nhà cung cấp. |
| **NHÂN VIÊN KHO** | `WAREHOUSE_STAFF`, `NVKHO` | ❌ Bị chặn (403) | ✅ **Thao tác kho** | ❌ Bị chặn (403) | ❌ Bị chặn mua sắm | Thao tác ghi nhận nhập/xuất kho, kiểm đếm vị trí kệ hàng, in phiếu kho A4. |
| **CHỦ CỬA HÀNG** | `STORE_OWNER`, `SELLER` | ❌ Bị chặn (403) | ❌ Bị chặn (403) | ✅ **Toàn quyền Shop của mình** | ✅ **Được mua sắm** | Đăng bán hàng (`/publish`), ký hợp đồng cung ứng B2B, quản lý đơn hàng shop, phát hành voucher shop. |
| **KHÁCH HÀNG** | `CUSTOMER` | ❌ Bị chặn (403) | ❌ Bị chặn (403) | ⚡ **Chuyển đổi 1 chạm sang Seller** | ✅ **Xem & Mua sắm** | Xem hàng, giỏ hàng đa shop, checkout tách đơn, theo dõi đơn, lưu voucher, ví ảo CTUT Pay, chat shop. |

---

## 3. CƠ CHẾ XÁC THỰC HAI MODEL TÁCH BIỆT (DUAL AUTH MODEL)

Hệ thống `ecommerce-frontend` giải quyết triệt để xung đột phiên đăng nhập bằng cách tách biệt hoàn toàn state và lưu trữ giữa hai Model:

### 3.1. Model Khách Hàng (Customer Model)
- **Phạm vi hoạt động:** `/login`, `/register`, `/profile`, `/cart`, `/checkout`, `/my-orders`, `/vouchers`, `/stores/*`, `/products/*`.
- **Lưu trữ phiên:** `localStorage.getItem('customer_token')`, `localStorage.getItem('customer_user')`, `customer_profile_{taiKhoan}`.
- **Header gửi API Gateway:** Đính kèm `Bearer customer_token` cho mọi request thuộc sàn mua sắm.
- **Quy tắc phê duyệt (isApproved):** **Hoàn toàn KHÔNG chặn duyệt đối với đăng nhập mua sắm!** Bất kỳ người dùng nào đăng ký tài khoản khách hàng đều có thể đăng nhập mua hàng ngay lập tức.
- **Cách ly nghiệp vụ:** Nhân sự kho bãi (`WAREHOUSE_MANAGER`, `THUKHO`, `NVKHO`) bị chặn không được dùng tài khoản nghiệp vụ kho để mua sắm.

### 3.2. Model Người Bán Hàng (Seller Model)
- **Phạm vi hoạt động:** `/seller/login`, `/seller/register`, `/seller`, `/seller/contracts`, `/seller/products`, `/seller/orders`, `/seller/vouchers`, `/seller/settings`.
- **Lưu trữ phiên:** `localStorage.getItem('seller_token')`, `localStorage.getItem('seller_user')`, `seller_selected_store_id`, `seller_store_{taiKhoan}`.
- **Header gửi API Gateway:** `api.js` tự động phát hiện URL bắt đầu bằng `/seller` và gắn `Authorization: Bearer seller_token`.
- **Ràng buộc cách ly kho:** Chủ shop chỉ quản lý duy nhất kho hàng của chính mình (`quanLyId = seller.id`). Không hiển thị dropdown chuyển đổi kho khác (chỉ Admin mới có quyền đổi kho để kiểm tra).

### 3.3. Cơ Chế Chuyển Đổi Liền Mạch (Seamless Fast-Switch)
- Bất kỳ tài khoản Khách Hàng nào (ví dụ `@hungbakkka`) muốn tham gia bán hàng hoặc vào Kênh Người Bán:
  1. **Từ Header:** Nút `🏪 Vào Kênh Người Bán` luôn hiển thị trong menu cá nhân, dẫn trực tiếp vào `/seller`.
  2. **Từ Form Đăng Nhập Kênh Người Bán ([`SellerLogin.jsx`](file:///d:/Projects/Do-an/Do_An/Do-An-3/ecommerce-frontend/src/pages/Seller/SellerLogin.jsx)):**
     - Tự động nhận diện tài khoản khách hàng đang hoạt động.
     - Hiển thị Thẻ Chuyển Đổi Nhanh: *"Bạn đang đăng nhập: @hungbakkka - Nhấn [Chuyển Ngay Sang Kênh Người Bán] (Không Cần Nhập Lại Mật Khẩu)"*.
  3. **Hàm đồng bộ (`authService.syncSellerFromCustomer`):**
     - Tự động đọc hoặc khởi tạo hồ sơ kho riêng `seller_store_${taiKhoan}`.
     - Đồng bộ token sang `seller_token` và thiết lập phiên `seller_user` với quyền `STORE_OWNER`.
     - Chuyển hướng người dùng vào Dashboard Kênh Người Bán mượt mà với 0 lỗi.

---

## 4. QUY TRÌNH HỢP ĐỒNG CUNG ỨNG & NHẬP KHO B2B2C (5 BƯỚC CHUẨN)

Quy trình nhập hàng từ Kho Tổng về Kho Riêng của Shop được thực hiện theo đúng nghiệp vụ chuỗi cung ứng thực tế, kiểm soát chặt chẽ qua 5 trạng thái:

```
[BƯỚC 1: SHOP SOẠN & GỬI YÊU CẦU]
  Chủ Shop chọn hàng thật từ CSDL Kho Tổng (KHO-457)
  -> Trạng thái: CHO_ADMIN_DUYET_YEU_CAU (Chờ Admin Duyệt Bước 1)
                     │
                     ▼
[BƯỚC 2: ADMIN DUYỆT VĂN BẢN VÒNG 1]
  Admin thẩm định danh mục, số lượng và pháp lý hợp đồng
  -> Trạng thái: CHO_SHOP_KY (Admin đã chấp thuận, chuyển Shop Ký Số)
                     │
                     ▼
[BƯỚC 3: SHOP THỰC HIỆN KÝ SỐ ĐIỆN TỬ]
  Chủ Shop mở Modal Ký Số, xác nhận điều khoản & nhập mã PIN (123456)
  -> Khắc dấu điện tử CERTIFIED, lưu dấu vết chữ ký số
  -> Trạng thái: CHO_ADMIN_DUYET_LAN_2 (Chờ Admin Phê Duyệt Lệnh Xuất Kho)
                     │
                     ▼
[BƯỚC 4: ADMIN DUYỆT VÒNG 2 & PHÁT LỆNH XUẤT KHO]
  Admin ký số phê duyệt vòng 2 và gửi lệnh sang Thủ Kho Tổng
  -> Trạng thái: CHUYEN_KHO_XUAT (Đã chuyển Kho Tổng xuất kho)
                     │
                     ▼
[BƯỚC 5: KHO TỔNG LÊN ĐƠN XUẤT & HOÀN TẤT NHẬP KHO SHOP]
  Thủ Kho Tổng lập phiếu xuất kho vật lý và giao bưu tá vận chuyển
  -> Tự động cộng tồn kho vào Kho Riêng của Shop trong CSDL
  -> Trạng thái: HOAN_THANH (Hợp đồng hoàn tất, hàng sẵn sàng bán trên Sàn)
```

### Chi Tiết Nguồn Dữ Liệu Thực Tế:
- **Kho Tổng Trung Tâm (Bên A):** Lấy từ `GET /warehouses`, tìm kho có mã `KHO-457` (SLO) duy nhất trong hệ thống.
- **Sản phẩm có sẵn trong kho tổng:**
  - Ưu tiên 1: Lấy tồn kho thực tế của kho 1 qua `GET /inventory/warehouse/1` (10 sản phẩm có số lượng khả dụng).
  - Ưu tiên 2: Lấy từ danh mục Master Data `GET /products` (17 linh kiện PC, Laptop, Gaming Gear chính hãng).
  - Tuyệt đối không hardcode mảng sản phẩm ảo.

---

## 5. CẤU TRÚC THƯ MỤC SOURCE CODE (`ecommerce-frontend`)

```
ecommerce-frontend/
├── public/                         # Favicon, tài nguyên tĩnh sàn TMĐT
├── src/
│   ├── assets/                     # Banner, logo sàn CTUT Gear
│   ├── components/                 # Component dùng chung toàn sàn
│   │   ├── Header.jsx & .css       # Thanh điều hướng chính (Search, Cart, User Menu, Switch Seller)
│   │   ├── PromoSlider.jsx & .css  # Thanh trượt quảng cáo thông minh 3 chế độ (New/Best/Deal)
│   │   └── LiveChatWidget.jsx & .css # Widget Chat hỗ trợ trực tuyến toàn sàn & khiếu nại
│   ├── context/
│   │   └── CartContext.jsx         # Quản lý giỏ hàng đa shop, tính tổng tiền, voucher theo shop
│   ├── pages/                      # Phân hệ Cổng Mua Hàng Khách Hàng (Customer Portal)
│   │   ├── MarketplaceHome.jsx & .css # Trang chủ sàn: Banner, Danh mục, Sản phẩm nổi bật
│   │   ├── ShopPage.jsx & .css     # Trang chi tiết gian hàng của đối tác bán lẻ
│   │   ├── ProductDetail.jsx & .css # Trang chi tiết sản phẩm, đánh giá, chọn mua
│   │   ├── MultiShopCart.jsx & .css # Giỏ hàng phân nhóm theo từng shop, áp voucher riêng
│   │   ├── Checkout.jsx & .css     # Thanh toán đa shop, trừ voucher sàn + voucher shop
│   │   ├── OrderSuccess.jsx & .css # Thông báo đặt hàng thành công & mã vận đơn
│   │   ├── MyOrders.jsx & .css     # Danh sách đơn mua cá nhân & tra cứu hành trình giao
│   │   ├── CustomerProfile.jsx & .css # Trang cá nhân đa năng 6 tab (Hồ sơ, Ví, Đơn, Voucher, Chat, Khiếu nại)
│   │   ├── VouchersPage.jsx & .css # Kho Voucher toàn sàn: Mã Sàn, Mã Shop, Mã Đã Lưu
│   │   ├── Login.jsx & .css        # Cổng Đăng Nhập dành riêng cho Khách Hàng (Customer Model)
│   │   └── CustomerRegister.jsx & .css # Đăng ký tài khoản Khách Hàng mới
│   ├── pages/Seller/               # Phân hệ Kênh Người Bán Chuyên Biệt (Seller Portal)
│   │   ├── SellerLayout.jsx & .css # Khung giao diện Kênh Người Bán (Sidebar, Kho riêng, Route Guard)
│   │   ├── SellerLogin.jsx & .css  # Cổng Đăng Nhập Người Bán & Nút chuyển đổi nhanh từ Khách Hàng
│   │   ├── SellerRegister.jsx & .css # Đăng ký mở Gian Hàng mới & tạo Kho Riêng trong CSDL
│   │   ├── SellerDashboard.jsx & .css # Thống kê doanh thu, tồn kho, biểu đồ bán hàng
│   │   ├── SellerContracts.jsx & .css # Quản lý hợp đồng cung ứng B2B2C 5 bước & Ký số điện tử
│   │   ├── SellerProducts.jsx & .css  # Quản lý hàng hóa trong kho shop & nút Đăng bán lên sàn
│   │   ├── SellerOrders.jsx & .css    # Xử lý đơn hàng của shop, chuẩn bị hàng & giao bưu tá
│   │   ├── SellerVouchers.jsx & .css  # Phát hành & quản lý mã giảm giá riêng của gian hàng
│   │   └── SellerShopSettings.jsx & .css # Cấu hình thông tin shop, địa chỉ kho, hotline
│   ├── services/                   # Kết nối API Backend qua Gateway
│   │   ├── api.js                  # Axios interceptor gắn token tự động (`customer_token` vs `seller_token`)
│   │   ├── authService.js          # Xác thực độc lập Khách Hàng vs Người Bán, syncSellerFromCustomer
│   │   └── marketplaceService.js   # Toàn bộ API nghiệp vụ: Kho tổng, Hợp đồng, Đăng bán, Đơn hàng, Voucher
│   ├── App.jsx                     # Cấu hình Routing tách biệt phân hệ Mua sắm vs Kênh Người Bán
│   └── main.jsx                    # Điểm khởi động ứng dụng React Vite
├── package.json
└── vite.config.js                  # Cấu hình build & proxy
```

---

## 6. CHI TIẾT CÁC TÍNH NĂNG ĐẶC TRƯNG CỦA SÀN TMĐT

### 6.1. Giỏ Hàng Đa Shop & Đặt Hàng Tách Đơn (Multi-Shop Order Splitting)
- Khi khách hàng thêm sản phẩm từ nhiều gian hàng khác nhau vào giỏ hàng:
  - Giao diện [`MultiShopCart.jsx`](file:///d:/Projects/Do-an/Do_An/Do-An-3/ecommerce-frontend/src/pages/MultiShopCart.jsx) tự động phân nhóm các mặt hàng theo từng gian hàng cụ thể.
  - Cho phép áp dụng Voucher độc quyền của riêng từng shop kết hợp với Voucher giảm giá toàn sàn.
  - Khi thanh toán tại [`Checkout.jsx`](file:///d:/Projects/Do-an/Do_An/Do-An-3/ecommerce-frontend/src/pages/Checkout.jsx), hệ thống tự động tách thành các đơn con tương ứng cho từng shop để các chủ shop độc lập chuẩn bị hàng và bàn giao cho bưu tá.

### 6.2. Hệ Thống Voucher Hai Tầng (Global & Store Vouchers)
- **Voucher Toàn Sàn:** Khởi tạo tự động qua `VoucherDataInitializer.java` (`CTUT50K`, `FREESHIP`, `TECHPRO10`...).
- **Voucher Gian Hàng:** Do từng chủ shop tự cấu hình tại `SellerVouchers.jsx` (`SHOP1OFF10`, `ROGSALE50`...).
- **Kho Voucher Cá Nhân ([`VouchersPage.jsx`](file:///d:/Projects/Do-an/Do_An/Do-An-3/ecommerce-frontend/src/pages/VouchersPage.jsx)):** Thu thập mã 1 chạm, tự động lưu vào ví voucher cá nhân để dùng nhanh tại giỏ hàng.

### 6.3. Thanh Trượt Quảng Cáo Thông Minh ([`PromoSlider.jsx`](file:///d:/Projects/Do-an/Do_An/Do-An-3/ecommerce-frontend/src/components/PromoSlider.jsx))
- Tự động luân chuyển banner mỗi 4.5 giây, tạm dừng khi rê chuột.
- 3 thuật toán ưu tiên nổi bật:
  - `NEW_ARRIVAL`: Siêu phẩm công nghệ mới lên kệ sàn hôm nay.
  - `BEST_SELLER`: Sản phẩm bán chạy nhất toàn sàn.
  - `HOT_DEAL`: Flash Sale giảm sâu từ 15% trở lên.

### 6.4. Trò Chuyện Trực Tiếp Với Gian Hàng Kiểu Shopee (Shopee-like Chat)
- Tích hợp tại Tab "Tin Nhắn & Chat Shop" trong [`CustomerProfile.jsx`](file:///d:/Projects/Do-an/Do_An/Do-An-3/ecommerce-frontend/src/pages/CustomerProfile.jsx).
- Danh sách hội thoại đa gian hàng kèm Trợ Lý AI Toàn Sàn.
- Gợi ý câu hỏi nhanh 1 chạm (tồn kho, bảo hành 1 đổi 1, mã giảm giá).
- Shop tự động phản hồi thông minh theo ngữ cảnh câu hỏi.

### 6.5. Trang Cá Nhân Đa Năng & Ví Ảo CTUT Pay (`/profile`)
- **Hồ Sơ Cá Nhân & Sổ Địa Chỉ:** Quản lý thông tin giao nhận, đồng bộ tức thì với phiên đăng nhập.
- **Ví Điện Tử CTUT Pay:** Số dư thực, lịch sử biến động nạp tiền và thanh toán đơn hàng.
- **Theo Dõi Đơn Mua:** 6 trạng thái đơn hàng kiểu Shopee.
- **Trung Tâm Khiếu Nại & Báo Lỗi:** Tạo ticket hỗ trợ tự động có Ticket ID để sàn và shop xử lý.

---

## 7. DANH SÁCH TÀI KHOẢN KIỂM THỬ TOÀN HỆ THỐNG (TEST ACCOUNTS)

Tất cả các tài khoản dưới đây đã được khởi tạo và đồng bộ mã hóa mật khẩu chuẩn trong PostgreSQL (`identity_db`):

| Tên Đăng Nhập | Mật Khẩu | Vai Trò Chính | Cổng Khuyên Dùng | Mô Tả & Quyền Hạn |
|---|---|---|---|---|
| `hungbakkka` | `123456` | `CUSTOMER` (kèm quyền Shop) | `/login` hoặc `/seller/login` | Tài khoản Khách hàng thân thiết, chuyển đổi 1 chạm sang Kênh Người Bán. |
| `seller_minhquan` | `123456` | `STORE_OWNER` | `/seller/login` | Chủ Cửa Hàng Minh Quân, quản trị gian hàng và kho riêng. |
| `shop_apple` | `123456` | `STORE_OWNER` | `/seller/login` | Gian hàng đối tác Apple Authorized Store. |
| `baomap05` | `123456` | `CUSTOMER` | `/login` | Khách Hàng thành viên (Trương Hoàng Bảo). |
| `khachhang` | `123456` | `CUSTOMER` | `/login` | Khách Hàng VIP kiểm thử tính năng mua sắm & voucher. |
| `admin` | `admin` | `ADMIN` | `/seller/login` hoặc Admin :5174 | Quản trị viên hệ thống toàn quyền, duyệt hợp đồng cung ứng 2 vòng. |
| `thukho` | `123456` | `WAREHOUSE_MANAGER` | WMS :5173 | Thủ Kho Tổng Trung Tâm, xuất kho theo hợp đồng cung ứng. |
| `nvkho` | `123456` | `WAREHOUSE_STAFF` | WMS :5173 | Nhân viên vận hành kho bãi. |

---

## 8. HƯỚNG DẪN KHỞI CHẠY & KIỂM THỬ

### 8.1. Khởi Chạy Frontend
```bash
# Di chuyển vào thư mục ecommerce-frontend
cd ecommerce-frontend

# Cài đặt thư viện nếu chưa có
npm install

# Khởi chạy máy chủ phát triển
npm run dev
# Truy cập giao diện tại: http://localhost:5173 (hoặc port Vite cấp phát)
```

### 8.2. Kịch Bản Kiểm Thử Kênh Người Bán & Chuỗi Cung Ứng
1. **Kiểm thử Chuyển đổi Khách Hàng sang Người Bán:**
   - Vào `/login`, bấm chip đăng nhập `hungbakkka` / `123456`.
   - Bấm vào menu cá nhân góc phải, chọn **🏪 Vào Kênh Người Bán** (hoặc mở `/seller/login` bấm **"Chuyển Ngay Sang Kênh Người Bán Với @hungbakkka"**).
   - Hệ thống chuyển vào Dashboard Kênh Người Bán `/seller` thành công.
2. **Kiểm thử Ký Hợp Đồng Cung Ứng:**
   - Tại menu Kênh Người Bán, chọn **Hợp Đồng Cung Ứng** -> Bấm **Gửi Yêu Cầu Nhập Hàng**.
   - Kho Tổng duy nhất `KHO-457` (SLO) được chọn tự động.
   - 10 sản phẩm thực tế từ CSDL Kho Tổng hiển thị đầy đủ, chọn số lượng và bấm **Tiếp Tục**.
   - Kiểm tra văn bản hợp đồng pháp lý và bấm **Gửi Yêu Cầu Đến Admin**.
3. **Kiểm thử Quy Trình Duyệt 5 Bước:**
   - Sử dụng thanh "Mô Phỏng Phân Quyền Thao Tác" trên đầu trang:
     - Chọn quyền **Admin**: Bấm nút **✓ Duyệt Yêu Cầu (Vòng 1)**.
     - Chọn quyền **Chủ Shop**: Bấm nút **✍️ Ký Số Điện Tử**, nhập PIN `123456` và bấm **Ký Số**.
     - Chọn quyền **Admin**: Bấm nút **✓ Duyệt Lệnh Xuất (Vòng 2)**.
     - Chọn quyền **Thủ Kho**: Bấm nút **📦 Kho Lên Đơn & Giao Hàng**.
   - Hợp đồng chuyển sang trạng thái **HOÀN THÀNH**, hàng hóa được cộng ngay vào mục **Hàng Hóa & Đăng Bán** của shop.
