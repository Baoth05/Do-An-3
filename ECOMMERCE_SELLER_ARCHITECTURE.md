# KIẾN TRÚC PHÂN HỆ ECOMMERCE & KÊNH NGƯỜI BÁN (SELLER PORTAL)
**Dự Án:** Hệ Sinh Thái Chuỗi Cung Ứng Kho Vận & Sàn Thương Mại Điện Tử Tập Trung (B2B2C)  
**Phân Hệ:** `ecommerce-frontend` kết nối Hệ Thống Microservices qua API Gateway (Port 8080)  
**Ngày cập nhật:** 03/11/2026  

---

## 1. TỔNG QUAN KIẾN TRÚC 2 PHÂN HỆ (BUYER vs SELLER)

Hệ thống được thiết kế theo mô hình **Sàn Thương Mại Điện Tử Tập Trung (Centralized Marketplace)** kết hợp **Kho Vận 2 Tầng (Central WMS & Store-level Fulfillment)**. 

Cổng giao diện Frontend thương mại điện tử phục vụ 2 nhóm đối tượng người dùng chính:
1. **Khách hàng Mua Sắm (Marketplace Buyer):**
   - Xem và tìm kiếm các sản phẩm đang được mở bán trên toàn sàn.
   - Giỏ hàng đa shop Shopee Mall, tự động gom nhóm theo cửa hàng.
   - Áp dụng Voucher toàn sàn và Voucher riêng của Shop.
   - Đặt hàng theo thuật toán **Order Splitting** (tự động tách thành nhiều đơn độc lập cho từng gian hàng).
   - Thanh toán đa phương thức: COD, Ví MoMo (VietQR), Web3 Crypto Blockchain (USDT).
   - Quản lý đơn mua, theo dõi vận chuyển và gửi đánh giá / bình luận sản phẩm.
2. **Chủ Cửa Hàng / Người Bán Hàng (Shop Owner / Seller):**
   - Quản lý kho hàng nội bộ của cửa hàng.
   - **Chủ động chọn lọc sản phẩm muốn bán** để đăng bán lên sàn (không hiển thị tất cả hàng trong kho).
   - Định giá bán lẻ trên sàn (`giaBanHienTai`) và thiết lập ngưỡng cảnh báo tồn kho.
   - Tiếp nhận, đóng gói và điều phối bưu tá cho các đơn hàng thuộc quyền quản lý của shop.
   - Tạo mã giảm giá (Voucher) riêng của gian hàng để thu hút khách.
   - Tùy chỉnh thông tin hồ sơ gian hàng, ảnh đại diện, địa chỉ kho bãi.

```
                          ┌────────────────────────┐
                          │   API GATEWAY (8080)   │
                          └───────────┬────────────┘
                                      │
     ┌──────────────────┬─────────────┼─────────────┬──────────────────┐
     ▼                  ▼             ▼             ▼                  ▼
┌───────────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────────────┐
│WMS-CORE (8081)│ │ORDER(8082)│ │PAYMENT(85)│ │INTERACT(83│ │IDENTITY-SRV (8084)│
│- Warehouse    │ │- Orders   │ │- MoMo     │ │- Reviews  │ │- Auth             │
│- Inventory    │ │- Splitting│ │- Crypto   │ │- Comments │ │- User profiles    │
│- Products     │ │- Vouchers │ │  (Web3)   │ │           │ │                   │
└───────────────┘ └───────────┘ └───────────┘ └───────────┘ └───────────────────┘
```

---

## 2. NGUYÊN TẮC QUẢN LÝ DỮ LIỆU THẬT & LOGIC ĐĂNG BÁN HÀNG HÓA

### 2.1. Loại Bỏ Hoàn Toàn Dữ Liệu Giả (Mock Data)
- **100% dữ liệu** hiển thị trên Frontend được gọi trực tiếp từ cơ sở dữ liệu thật qua API Gateway.
- Không sử dụng mảng tĩnh trong code (`MOCK_PRODUCTS`, `MOCK_STORES`, `MOCK_VOUCHERS` đã được dọn sạch).
- Khi hệ thống chưa có dữ liệu hoặc danh mục rỗng, giao diện hiển thị trạng thái **Empty State** thân thiện, hướng dẫn khách hàng và chủ shop thao tác thực tế.

### 2.2. Logic "Chủ Cửa Hàng Muốn Bán Gì Thì Đăng Lên" (Selective Listing)
Trong hệ thống bán lẻ B2B2C, một Cửa hàng / Kho có thể lưu trữ rất nhiều mã hàng hóa (`Inventory`), bao gồm:
- Hàng dự trữ nội bộ, hàng trưng bày, hàng phục vụ bán buôn (B2B).
- Hàng chuẩn bị nhập kho, chưa chốt giá bán lẻ.
- Hàng hóa độc quyền chỉ mở bán vào dịp khuyến mãi.

Vì vậy, hệ thống thiết kế cờ trạng thái **`dangBan` (Published on Marketplace)**:
- **Tại Sàn Mua Sắm (`/`, `/products/:id`, `/stores/:id`):**
  - Chỉ gọi API `/inventory/marketplace`.
  - Backend lọc nghiêm ngặt điều kiện: `dangBan == true AND soLuongThucTe > 0`.
  - Khách hàng tuyệt đối **không nhìn thấy toàn bộ kho hàng** của chủ shop nếu chủ shop chưa kích hoạt đăng bán!
- **Tại Kênh Người Bán (`/seller/products`):**
  - Chủ shop xem được toàn bộ danh mục hàng tồn kho của mình (`/inventory/store/{storeId}`).
  - Phân loại rõ ràng:
    - 🟢 **ĐANG MỞ BÁN:** Hàng đã duyệt và hiển thị công khai trên sàn TMĐT.
    - ⚪ **LƯU KHO (ẨN):** Hàng nội bộ, khách hàng trên sàn không thể tìm kiếm hay nhìn thấy.
  - Chủ shop có quyền:
    - Bấm **"Đăng Bán Sàn"**: Kích hoạt `dangBan = true`.
    - Bấm **"Gỡ Khỏi Sàn"**: Chuyển `dangBan = false`.
    - Thiết lập **Giá bán lẻ trên sàn** (`giaBanHienTai`).
    - Cài đặt **Ngưỡng cảnh báo tồn kho** (`soLuongToiThieu`).

---

## 3. CẤU TRÚC CHI TIẾT CÁC TRANG CỦA KÊNH NGƯỜI BÁN (SELLER PORTAL)

Kênh Người Bán được tổ chức tại thư mục [`src/pages/Seller/`](file:///d:/Projects/Do-an/Do_An/Do-An-3/ecommerce-frontend/src/pages/Seller) với các trang chuyên biệt:

| STT | Tên Trang & File Component | Tuyến Đường (Route) | Chức Năng Chính Của Chủ Cửa Hàng |
|---|---|---|---|
| 1 | **Đăng Ký Gian Hàng & Tạo Kho Riêng**<br>`SellerRegister.jsx` | `/seller/register` | **Khởi tạo Shop & Kho:** Nhập thông tin pháp lý chủ sở hữu, thiết lập mã kho riêng (`STORE-XXXX`), địa chỉ nhận trả hàng bưu tá, sức chứa kho và kích hoạt kho riêng trên hệ thống (`POST /stores`, `loaiHinh: KHO_CUA_HANG`). |
| 2 | **Hợp Đồng Cung Ứng & Nhập Kho**<br>`SellerContracts.jsx` | `/seller/contracts` | **Nghiệp vụ nhập hàng có hợp đồng:** Chọn Kho Tổng Trung Tâm & sản phẩm Master Catalog, soạn thảo hợp đồng cung ứng B2B2C, thực hiện Ký số điện tử (Digital Signature) và tự động nhập hàng về kho riêng (`POST /inventory/add`). |
| 3 | **Seller Layout**<br>`SellerLayout.jsx` | `/seller` | Khung giao diện riêng của Kênh Người Bán, Sidebar điều hướng, bộ chọn quản lý nhiều Gian hàng (Multi-store switcher), nút chuyển về Sàn mua sắm. |
| 4 | **Tổng Quan Gian Hàng**<br>`SellerDashboard.jsx` | `/seller` (Index) | Báo cáo doanh thu tích lũy, số đơn hàng chờ xác nhận, số đơn đang giao, tỷ lệ hàng đang đăng bán so với tổng kho, cảnh báo các mặt hàng sắp hết tồn kho. |
| 5 | **Hàng Hóa & Đăng Bán**<br>`SellerProducts.jsx` | `/seller/products` | **Chức năng trọng tâm:** Tra cứu toàn bộ kho hàng, Bật/Tắt đăng bán (`publish/unpublish`), thiết lập giá bán lẻ và ngưỡng cảnh báo tồn kho thấp. |
| 6 | **Quản Lý Đơn Hàng**<br>`SellerOrders.jsx` | `/seller/orders` | Quản lý các đơn khách đặt tại shop: Lọc đơn theo trạng thái, Tiếp nhận & Soạn kho (`CONFIRMED`), Bàn giao bưu tá (`SHIPPING` + chọn ĐVVC GHTK/GHN/Viettel Post), Giao thành công (`COMPLETED`), Hủy đơn (`CANCELLED`). |
| 7 | **Mã Khuyến Mãi Của Shop**<br>`SellerVouchers.jsx` | `/seller/vouchers` | Quản lý danh sách voucher riêng của shop, Form phát hành mã giảm giá mới (% giảm, giảm tối đa, đơn tối thiểu, số lượng phát hành). |
| 8 | **Hồ Sơ & Thiết Lập Shop**<br>`SellerShopSettings.jsx` | `/seller/settings` | Cập nhật thông tin nhận diện thương hiệu của shop: Tên gian hàng, Địa chỉ kho, Số điện thoại hỗ trợ, Ảnh đại diện logo, Lời giới thiệu / chính sách bảo hành. |

---

## 4. TỔNG HỢP DANH SÁCH REST API CHO TỪNG PHÂN HỆ

### 4.1. Nhóm API Khách Hàng Mua Sắm (Marketplace Client)
- `GET /inventory/marketplace`: Lấy sản phẩm đang đăng bán toàn sàn (`dangBan == true`).
- `GET /stores`: Lấy danh sách các gian hàng chính hãng.
- `GET /stores/{id}`: Lấy chi tiết gian hàng và thông tin shop.
- `GET /inventory/store/{storeId}`: Lấy sản phẩm mở bán theo từng gian hàng.
- `GET /vouchers/global`: Lấy danh sách voucher khuyến mãi toàn sàn.
- `GET /vouchers/store/{storeId}`: Lấy voucher riêng của gian hàng.
- `GET /vouchers/check/{code}`: Kiểm tra hiệu lực của voucher trước khi áp dụng.
- `POST /orders/checkout-multishop`: Đặt hàng đa shop, tự động tách đơn (Order Splitting).
- `GET /orders/user/{userId}`: Lấy lịch sử đơn mua của người dùng.
- `PUT /orders/{id}/cancel`: Khách hàng hủy đơn hàng (khi ở trạng thái `PENDING`).
- `POST /payments/create`: Tạo liên kết thanh toán và mã QR MoMo (VietQR).
- `POST /payments/crypto/submit`: Xác thực giao dịch Web3 Blockchain (USDT).
- `GET /interactions/danh-gia/{maHangHoa}`: Xem đánh giá và số sao thực tế.
- `POST /interactions/danh-gia`: Gửi đánh giá sản phẩm mới.
- `GET /interactions/binh-luan/{maHangHoa}`: Xem danh sách hỏi đáp / bình luận.
- `POST /interactions/binh-luan`: Đăng câu hỏi hoặc bình luận mới.

### 4.2. Nhóm API Chủ Cửa Hàng (Seller Channel)
- `GET /inventory/store/{storeId}`: Lấy toàn bộ hàng tồn kho của shop (cả đang bán và lưu kho).
- `PUT /inventory/{id}/publish`: **Bật/Tắt đăng bán lên sàn** kèm giá bán lẻ (`giaBanHienTai`) và ngưỡng cảnh báo.
- `GET /orders/store/{storeId}`: Lấy toàn bộ đơn hàng khách đặt thuộc quyền quản lý của shop.
- `PUT /orders/{id}/status?status={STATUS}`: Chuyển trạng thái đơn (`CONFIRMED`, `COMPLETED`, `CANCELLED`).
- `PUT /orders/{id}/shipping-status?shippingStatus=DELIVERING&donViVanChuyen={PROVIDER}`: Điều phối bưu tá và chọn đơn vị vận chuyển (GHTK, GHN, Viettel Post).
- `POST /vouchers`: Tạo mã voucher khuyến mãi riêng cho shop.
- `PUT /stores/{id}`: Cập nhật hồ sơ thông tin gian hàng.

---

## 5. CẤU TRÚC THƯ MỤC SOURCE CODE FRONTEND

```text
ecommerce-frontend/
├── src/
│   ├── components/
│   │   ├── Header.jsx                 # Header sàn, tìm kiếm, giỏ hàng, menu chuyển đổi sang Kênh Người Bán
│   │   └── Header.css
│   ├── context/
│   │   └── CartContext.jsx            # Quản lý giỏ hàng đa shop, Checkbox Select CRUD, validate tồn kho thực
│   ├── pages/
│   │   ├── MarketplaceHome.jsx        # Trang chủ sàn TMĐT, tìm kiếm, lọc giá, sắp xếp bán chạy
│   │   ├── ProductDetail.jsx          # Chi tiết sản phẩm, CRUD Đánh giá sao & Bình luận hỏi đáp
│   │   ├── ShopPage.jsx               # Trang riêng của từng Chủ gian hàng (chỉ hiện hàng đang đăng bán)
│   │   ├── MultiShopCart.jsx          # Giỏ hàng đa shop, chọn từng món, áp dụng voucher sàn/shop
│   │   ├── Checkout.jsx               # Thanh toán gộp, Order Splitting, MoMo QR, Web3 Crypto, COD
│   │   ├── OrderSuccess.jsx           # Báo đặt hàng thành công, hiển thị danh sách các đơn con đã tách
│   │   ├── MyOrders.jsx               # Quản lý Đơn Mua của tôi: lọc trạng thái, hủy đơn, mua lại
│   │   ├── VouchersPage.jsx           # Kho voucher toàn sàn và danh sách voucher đã lưu
│   │   ├── Login.jsx                  # Đăng nhập hệ thống
│   │   │
│   │   └── Seller/                    # 🌟 KÊNH DÀNH RIÊNG CHO CHỦ CỬA HÀNG
│   │       ├── SellerLayout.jsx       # Layout Kênh Người Bán + Sidebar điều hướng + Multi-store selector
│   │       ├── SellerLayout.css
│   │       ├── SellerDashboard.jsx    # Tổng quan doanh thu, đơn cần soạn, cảnh báo tồn kho thấp
│   │       ├── SellerDashboard.css
│   │       ├── SellerProducts.jsx     # QUẢN LÝ KHO & CHỦ ĐỘNG ĐĂNG BÁN / GỠ BỎ HÀNG KHỎI SÀN
│   │       ├── SellerProducts.css
│   │       ├── SellerOrders.jsx       # TIẾP NHẬN, ĐÓNG GÓI & ĐIỀU PHỐI GIAO VẬN ĐƠN HÀNG CỦA SHOP
│   │       ├── SellerOrders.css
│   │       ├── SellerVouchers.jsx     # TẠO & QUẢN LÝ VOUCHER ĐỘC QUYỀN CỦA SHOP
│   │       ├── SellerVouchers.css
│   │       ├── SellerShopSettings.jsx # HỒ SƠ GIAN HÀNG, ẢNH ĐẠI DIỆN, ĐỊA CHỈ KHO
│   │       └── SellerShopSettings.css
│   ├── services/
│   │   ├── api.js                     # Cấu hình Axios BaseURL (http://localhost:8080) và JWT Interceptor
│   │   └── marketplaceService.js      # Toàn bộ API methods kết nối backend thật (100% no mock data)
│   ├── App.jsx                        # Điều phối định tuyến linh hoạt giữa Marketplace và Seller Portal
│   ├── App.css
│   └── main.jsx
├── package.json
└── vite.config.js
```

---

## 6. HƯỚNG DẪN KIỂM THỬ THỰC TẾ

1. **Khởi động Backend Microservices:**
   - Đảm bảo `discovery-server` (8761), `api-gateway` (8080), `wms-core-service` (8081), `order-service` (8082), `interaction-service` (8083) đang hoạt động.
2. **Khởi động Ecommerce Frontend:**
   ```bash
   cd ecommerce-frontend
   npm run dev
   ```
3. **Thử nghiệm Kênh Người Bán:**
   - Truy cập `http://localhost:5175/seller` hoặc bấm vào **"🏪 Kênh Người Bán (Chủ Cửa Hàng)"** trên thanh top banner.
   - Chọn gian hàng (ví dụ: `Apple Store Chính Hãng CTUT` hoặc `CTUT Gaming & Gear Hub`).
   - Vào mục **"Hàng Hóa & Đăng Bán"**: Thử bấm nút **"Đăng Bán Sàn"** hoặc **"Gỡ Khỏi Sàn"** cho một sản phẩm trong kho.
   - Quay lại trang chủ Sàn Mua Sắm (`/`): Kiểm tra xem sản phẩm vừa gỡ có lập tức biến mất khỏi sàn, và sản phẩm vừa đăng bán có xuất hiện hay không.
4. **Thử nghiệm Đặt Hàng & Điều Phối Đơn Hàng:**
   - Thêm sản phẩm vào giỏ, bấm Thanh toán (`/checkout`).
   - Sau khi tạo đơn thành công, truy cập `/seller/orders` để xem đơn hàng vừa được tách về đúng shop.
   - Bấm **"Tiếp Nhận & Soạn Hàng"**, sau đó bấm **"Bàn Giao Cho Bưu Tá"** để chọn đơn vị vận chuyển GHTK / GHN / Viettel Post.

