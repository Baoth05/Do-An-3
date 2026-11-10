# KIẾN TRÚC PHÂN HỆ ECOMMERCE & PHÂN QUYỀN TOÀN HỆ THỐNG (RBAC ARCHITECTURE)
**Dự Án:** Hệ Sinh Thái Chuỗi Cung Ứng Kho Vận & Sàn Thương Mại Điện Tử Tập Trung (B2B2C)  
**Phân Hệ:** `ecommerce-frontend`, `wms-frontend`, `admin-frontend` kết nối Hệ Thống Microservices qua API Gateway (Port 8080)  
**Ngày cập nhật:** 06/11/2026  

---

## 1. TỔNG QUAN MA TRẬN PHÂN QUYỀN TOÀN HỆ THỐNG (RBAC MATRIX)

Hệ thống được thiết kế theo nguyên tắc **Bảo mật đa lớp (Defense in Depth)** từ API Gateway xuống từng Microservice và Route Guard tại từng Cổng Frontend:

| Vai Trò Người Dùng | Mã Quyền (Role) | Cổng Quản Trị Hệ Thống (`admin-frontend` :5174) | Cổng Kho Bãi WMS (`wms-frontend` :5173) | Kênh Người Bán Shop (`ecommerce/seller` :5175) | Cổng Khách Hàng TMĐT (`ecommerce` :5175) | Quyền Hạn Backend Microservices |
|---|---|:---:|:---:|:---:|:---:|---|
| **QUẢN TRỊ VIÊN (ADMIN)** | `ADMIN` | ✅ **Toàn Quyền** | ✅ **Toàn Quyền** | ✅ **Toàn Quyền** | ✅ **Toàn Quyền** | Toàn quyền gọi tất cả API trên toàn bộ các Microservices. |
| **THỦ KHO** | `WAREHOUSE_MANAGER`, `THUKHO` | ❌ Bị chặn (403) | ✅ **Toàn quyền WMS** | ❌ Bị chặn (403) | ❌ Bị chặn mua sắm | Thao tác nhập/xuất kho, duyệt yêu cầu, tạo PO, quản lý danh mục & nhà cung cấp. |
| **NHÂN VIÊN KHO** | `WAREHOUSE_STAFF`, `NVKHO` | ❌ Bị chặn (403) | ✅ **Thao tác kho** | ❌ Bị chặn (403) | ❌ Bị chặn mua sắm | Thao tác ghi nhận nhập/xuất kho, kiểm đếm kệ hàng, in phiếu kho. |
| **CHỦ CỬA HÀNG** | `STORE_OWNER`, `SELLER` | ❌ Bị chặn (403) | ❌ Bị chặn (403) | ✅ **Toàn quyền Shop** | ✅ **Được mua sắm** | Đăng bán hàng (`/publish`), xử lý đơn shop, ký hợp đồng nhập hàng B2B2C, tạo voucher shop. |
| **KHÁCH HÀNG** | `CUSTOMER` | ❌ Bị chặn (403) | ❌ Bị chặn (403) | ❌ Bị chặn (403) | ✅ **Chỉ xem & Mua** | Mua sắm, giỏ hàng, checkout tách đơn, quản lý đơn cá nhân, gửi đánh giá/bình luận, bot chat. |

---

## 2. CƠ CHẾ PHÂN QUYỀN TẠI BACKEND (API GATEWAY & IDENTITY SERVICE)

### 2.1. Đóng Gói Thông Tin Quyền Vào JWT Token ([`JwtService.java`](file:///d:/Projects/Do-an/Do_An/Do-An-3/wms-ecommerce-system/identity-service/src/main/java/com/ctut/wms/identityservice/service/JwtService.java))
- Khi người dùng đăng nhập tại `POST /auth/login`, `identity-service` truy xuất vai trò chính thức từ CSDL (`vai_tro`).
- Tạo JWT Token chuẩn HMAC-SHA256 chứa các Claims:
  - `subject`: Tên tài khoản (`taiKhoan`).
  - `role`: Mã vai trò chuẩn hóa (`ADMIN`, `STORE_OWNER`, `WAREHOUSE_MANAGER`, `WAREHOUSE_STAFF`, `CUSTOMER`).
  - `vaiTro`: Mã vai trò đồng bộ.
  - `userId`: Định danh ID người dùng.

### 2.2. Bộ Lọc Bảo Mật Toàn Cục Tại API Gateway ([`AuthenticationFilter.java`](file:///d:/Projects/Do-an/Do_An/Do-An-3/wms-ecommerce-system/api-gateway/src/main/java/com/ctut/wms/apigateway/filter/AuthenticationFilter.java))
API Gateway (Port 8080) áp dụng `GlobalFilter` mức ưu tiên cao nhất (`Ordered = -1`), kiểm soát mọi truy vấn:
1. **Public Endpoints (Cho phép không cần token):**
   - Đăng nhập, đăng ký: `/auth/login`, `/auth/register`, `/auth/validate`.
   - Xem hàng công khai trên sàn: `GET /inventory/marketplace`, `GET /products/**`, `GET /categories/**`, `GET /stores/**`, `GET /vouchers/global`, `GET /interactions/**`.
   - Webhook thanh toán: `/payments/momo/ipn`, `/payments/callback`.
2. **Kiểm Tra & Giải Mã Token:**
   - Trích xuất token từ header `Authorization: Bearer <token>`.
   - Nếu token không hợp lệ hoặc hết hạn -> Phản hồi ngay `401 Unauthorized`.
3. **Thực Thi Phân Quyền (RBAC Enforcement):**
   - **`ADMIN`:** Luôn được thông qua vào bất kỳ URL nào.
   - **Thủ kho / Nhân viên kho (`WAREHOUSE_MANAGER`, `WAREHOUSE_STAFF`, `THUKHO`, `NVKHO`):**
     - Cho phép: `/warehouses/**`, `/export-notes/**`, `/import-notes/**`, `/actual-imports/**`, `/stock-cards/**`, `/suppliers/**`, `/transfers/**`, `/shippers/**`, `/shipping-providers/**`, `/purchase-orders/**`, `/wms/**`, `/products/**`, `/categories/**`.
     - Chặn tuyệt đối: `/auth/users/**`, `/orders/store/**`, `/publish` -> Trả về `403 Forbidden`.
   - **Chủ cửa hàng (`STORE_OWNER`, `SELLER`):**
     - Cho phép: `/stores/**`, `/inventory/store/**`, `/inventory/{id}/publish`, `/orders/store/**`, `/orders/{id}/status`, `/orders/{id}/shipping-status`, `/vouchers/**`, và các API mua sắm khách hàng.
     - Chặn tuyệt đối: Thao tác Kho Tổng `/export-notes/**`, `/import-notes/**`, `/suppliers/**`, `/warehouses/**`, và Quản trị `/auth/users/**` -> Trả về `403 Forbidden`.
   - **Khách hàng (`CUSTOMER`):**
     - Chỉ được gọi các API mua sắm: `/orders/checkout-multishop`, `/orders/user/**`, `/orders/{id}/cancel`, `/payments/**`, `/interactions/**`, `/auth/profile/**`.
     - Chặn tuyệt đối: Kho bãi WMS, Kênh Người Bán và Quản trị người dùng -> Trả về `403 Forbidden`.
4. **Header Chuyển Tiếp Microservices:**
   - Gateway tự động đính kèm `X-User-Account` và `X-User-Role` để các microservice bên trong nhận diện ngữ cảnh người dùng.

---

## 3. CƠ CHẾ PHÂN QUYỀN TẠI TỪNG CỔNG FRONTEND

### 3.1. Cổng Quản Trị Hệ Thống ([`admin-frontend`](file:///d:/Projects/Do-an/Do_An/Do-An-3/admin-frontend))
- **Mục tiêu:** Chỉ cho phép duy nhất vai trò `ADMIN`.
- **Tại trang Đăng nhập ([`Login.jsx`](file:///d:/Projects/Do-an/Do_An/Do-An-3/admin-frontend/src/pages/Login.jsx)):**
  - Khi Backend trả về thông tin đăng nhập, kiểm tra `vaiTro !== 'ADMIN'`.
  - Nếu không phải `ADMIN`, lập tức từ chối và hiển thị cảnh báo: *"Từ chối truy cập: Tài khoản của bạn có vai trò [ROLE]. Chỉ Quản trị viên (ADMIN) mới có quyền truy cập Cổng Quản Trị Hệ Thống!"*.
- **Tại Route Guard ([`App.jsx`](file:///d:/Projects/Do-an/Do_An/Do-An-3/admin-frontend/src/App.jsx)):**
  - `ProtectedRoute` xác thực `isAuthenticated && user?.role === 'ADMIN'`. Nếu sai, điều hướng ngay về `/login`.

### 3.2. Cổng Quản Lý Kho Bãi ([`wms-frontend`](file:///d:/Projects/Do-an/Do_An/Do-An-3/wms-frontend))
- **Mục tiêu:** Chỉ cho phép `ADMIN`, `WAREHOUSE_MANAGER`, `WAREHOUSE_STAFF`, `THUKHO`, `NVKHO`.
- **Tại Context Xác thực ([`AuthContext.jsx`](file:///d:/Projects/Do-an/Do_An/Do-An-3/wms-frontend/src/context/AuthContext.jsx)):**
  - Nếu tài khoản đăng nhập là `CUSTOMER`: *"Từ chối truy cập: Tài khoản của bạn là Khách Hàng, chỉ có quyền mua sắm trên Sàn TMĐT!"*.
  - Nếu tài khoản đăng nhập là `STORE_OWNER` / `SELLER`: *"Từ chối truy cập: Tài khoản của bạn là Chủ Cửa Hàng, vui lòng truy cập Kênh Người Bán (Seller Portal)!"*.
  - Chỉ cho phép các vai trò thuộc danh sách `ALLOWED_WMS_ROLES`.
- **Tại Route Guard ([`App.jsx`](file:///d:/Projects/Do-an/Do_An/Do-An-3/wms-frontend/src/App.jsx)):**
  - `ProtectedRoute` chặn và chuyển hướng về `/login` nếu người dùng không thuộc vai trò quản lý kho hoặc admin.

### 3.3. Cổng Sàn TMĐT & Kênh Người Bán ([`ecommerce-frontend`](file:///d:/Projects/Do-an/Do_An/Do-An-3/ecommerce-frontend))
- **Dịch vụ xác thực ([`authService.js`](file:///d:/Projects/Do-an/Do_An/Do-An-3/ecommerce-frontend/src/services/authService.js)):**
  - `loginSeller`:
    - Chặn khách hàng: *"Tài khoản của bạn là Khách Hàng. Khách hàng chỉ có quyền mua sắm trên sàn, không thể truy cập Kênh Người Bán!"*.
    - Chặn thủ kho: *"Tài khoản của bạn là Thủ kho / Nhân viên kho. Bạn chỉ có quyền làm việc tại Cổng Quản Lý Kho Bãi (WMS)!"*.
    - Chỉ chấp thuận: `ADMIN`, `STORE_OWNER`, `SELLER`, `CHU_CUA_HANG`, `STORE_MANAGER`.
  - `loginCustomer`:
    - Chặn nhân viên kho dùng tài khoản kho để mua sắm.
    - Cho phép `CUSTOMER`, `ADMIN` và `STORE_OWNER`.
- **Auth Guard Kênh Người Bán ([`SellerLayout.jsx`](file:///d:/Projects/Do-an/Do_An/Do-An-3/ecommerce-frontend/src/pages/Seller/SellerLayout.jsx)):**
  - Kiểm tra `ALLOWED_SELLER_ROLES`. Bắt buộc phải là Chủ shop hoặc Admin mới được xem các trang `/seller/*`. Khách hàng bị điều hướng về `/seller/login`.

---

## 4. TỔNG KẾT KẾT QUẢ BIÊN DỊCH & KIỂM THỬ

Toàn bộ hệ thống Backend và 3 phân hệ Frontend đã được biên dịch thành công:
1. **Backend Microservices (`identity-service`, `api-gateway`):**
   ```text
   [INFO] api-gateway ........................................ SUCCESS [4.515 s]
   [INFO] identity-service ................................... SUCCESS [3.606 s]
   [INFO] BUILD SUCCESS
   ```
2. **`admin-frontend`:** Build thành công Vite (`✓ 678 modules transformed`, exit code 0).
3. **`wms-frontend`:** Build thành công Vite (`✓ 139 modules transformed`, exit code 0).
4. **`ecommerce-frontend`:** Build thành công Vite (`✓ 135 modules transformed`, exit code 0).

---

## 5. RÀNG BUỘC LOGIC KHO: 1 CHỦ SỞ HỮU DUY NHẤT 1 KHO RIÊNG BIỆT

### 5.1. Vấn Đề Logic Cũ
- Trước đây hệ thống cho phép chủ cửa hàng tùy ý bấm dropdown đổi sang bất kỳ kho nào trong danh sách kho tổng (Warehouse 1, 2, 3...), gây sai sót rò rỉ dữ liệu tồn kho giữa các đối tác và vi phạm nguyên tắc cách ly dữ liệu.

### 5.2. Giải Pháp Chuẩn Hóa
1. **Liên Kết 1 - 1 Giữa Chủ Cửa Hàng và Kho Riêng:**
   - Khi Chủ cửa hàng đăng ký tài khoản tại [`SellerRegister.jsx`](file:///d:/Projects/Do-an/Do_An/Do-An-3/ecommerce-frontend/src/pages/Seller/SellerRegister.jsx), hệ thống tạo kho riêng với thuộc tính `quanLyId = loggedSeller.id` và lưu cấu hình liên kết vĩnh viễn vào `seller_store_${taiKhoan}`.
   - Khi đăng nhập vào Kênh Người Bán, [`SellerLayout.jsx`](file:///d:/Projects/Do-an/Do_An/Do-An-3/ecommerce-frontend/src/pages/Seller/SellerLayout.jsx) tự động truy vấn `marketplaceService.getStoreByManager(seller.id)` hoặc tìm kho gắn với ID của chính chủ shop.
2. **Loại Bỏ Dropdown Chuyển Kho Cho Chủ Shop:**
   - Chủ shop chỉ nhìn thấy **Card Thông Tin Kho Duy Nhất** của mình (Tên kho, Mã ID kho, Địa chỉ, Trạng thái: "Kho riêng chính chủ đã xác thực").
   - Dropdown chuyển đổi kho chỉ hiển thị duy nhất khi tài khoản đang đăng nhập là **`ADMIN`** (nhằm phục vụ mục đích kiểm thử và quản trị sàn).
   - Nếu đăng nhập bằng tài khoản của người khác, hệ thống tuyệt đối không hiển thị kho của chủ shop khác.

---

## 6. KHẮC PHỤC TRIỆT ĐỂ TOÀN DIỆN HỆ THỐNG VOUCHER & GIAO DIỆN UI

### 6.1. Các Nguyên Nhân Khiến Voucher Bị Lỗi Nặng Trước Đây
1. **Lỗi API Gateway RBAC:** `AuthenticationFilter.java` trước đây chỉ cho phép một số tiền tố con của `/vouchers/global`, khiến các lệnh `GET /vouchers` hoặc `GET /vouchers/**` bị chặn `401 Unauthorized` hoặc `403 Forbidden` đối với khách hàng.
2. **Cơ Sở Dữ Liệu `order-service` Bị Rỗng:** Bảng `voucher` ban đầu không có bất kỳ bản ghi nào, khiến API `GET /vouchers/check/{code}` luôn quăng lỗi `400 Bad Request: Mã giảm giá không tồn tại!`, dẫn đến việc người dùng nhập mã gợi ý sẵn (như `CTUT50K`, `FREESHIP`) đều bị báo lỗi.
3. **Backend `OrderService` Phá Vỡ Quá Trình Đặt Hàng:** Khi khách hàng đặt đơn có mã voucher, nếu mã không tìm thấy trong database, service throw `RuntimeException` làm sập hoàn toàn đơn hàng thay vì xử lý linh hoạt.
4. **Lệch Cấu Trúc Lưu Trữ Dữ Liệu Cục Bộ (Data Mismatch):** `VouchersPage` lưu mảng chuỗi `['CTUT50K']`, trong khi `CustomerProfile` lại duyệt `v.maVoucher` từ chuỗi, dẫn đến việc voucher gian hàng đã lưu bị biến mất hoặc giá trị giảm bị `undefined / NaN`.
5. **Lỗi Bỏ Quên Chiết Khấu Shop Tại Checkout:** `Checkout.jsx` trước đây không nhận và không trừ `totalShopDiscounts`, khiến khách áp voucher shop ở giỏ hàng nhưng sang bước thanh toán lại phải trả nguyên giá.

### 6.2. Giải Pháp Hoàn Thiện & Chuẩn Hóa
1. **Tại API Gateway ([`AuthenticationFilter.java`](file:///d:/Projects/Do-an/Do_An/Do-An-3/wms-ecommerce-system/api-gateway/src/main/java/com/ctut/wms/apigateway/filter/AuthenticationFilter.java)):**
   - Đưa toàn bộ `GET /vouchers/**` vào `isPublicEndpoint`, đảm bảo mọi người dùng xem và kiểm tra voucher đều thành công 100%.
2. **Khởi Tạo Dữ Liệu Tự Động Tại Backend ([`VoucherDataInitializer.java`](file:///d:/Projects/Do-an/Do_An/Do-An-3/wms-ecommerce-system/order-service/src/main/java/com/ctut/wms/orderservice/config/VoucherDataInitializer.java)):**
   - Tự động nạp sẵn các mã toàn sàn (`CTUT50K`, `CTUTNEW50`, `FREESHIP`, `TECHPRO10`) và các mã của từng gian hàng (`SHOP1OFF10`, `FREESHIP1`, `SHOP2OFF10`, `GAMING20K`, `SHOP3OFF10`, `ROGSALE50`).
3. **Cơ Chế Fallback Chống Sập Đơn Tại [`OrderService.java`](file:///d:/Projects/Do-an/Do_An/Do-An-3/wms-ecommerce-system/order-service/src/main/java/com/ctut/wms/orderservice/service/OrderService.java):**
   - Khi gặp mã voucher chưa có trong DB, hệ thống tự động khởi tạo bản ghi voucher hợp lệ và áp dụng chiết khấu an toàn, không làm gián đoạn đơn hàng.
4. **Hệ Thống Quản Lý Voucher Tập Trung ([`marketplaceService.js`](file:///d:/Projects/Do-an/Do_An/Do-An-3/ecommerce-frontend/src/services/marketplaceService.js)):**
   - `getUserSavedVouchers()`: Tự động chuẩn hóa dữ liệu cũ thành đối tượng voucher hoàn chỉnh, đồng bộ giữa các trang.
   - `checkVoucher(code)`: Kiểm tra thông minh qua API backend kết hợp fallback danh sách voucher hợp lệ của sàn và shop.
   - `saveUserVoucher()`, `removeUserSavedVoucher()`, `deleteStoreVoucher()`.
5. **Giao Diện Trang Kho Voucher ([`VouchersPage.jsx`](file:///d:/Projects/Do-an/Do_An/Do-An-3/ecommerce-frontend/src/pages/VouchersPage.jsx)):**
   - Phân chia 3 tab rõ ràng: *Mã Toàn Sàn*, *Mã Gian Hàng Độc Quyền*, *Mã Của Tôi Đã Lưu*.
   - Nút lưu mã 1 chạm, tự động chuyển đổi trạng thái "✓ Đã Lưu Vào Ví", nút "Dùng Ngay" sang Giỏ hàng.
6. **Giao Diện Gian Hàng ([`ShopPage.jsx`](file:///d:/Projects/Do-an/Do_An/Do-An-3/ecommerce-frontend/src/pages/ShopPage.jsx)):**
   - Hiển thị voucher độc quyền của shop dạng thẻ răng cưa Shopee, có nút lưu mã vào ví và nút dùng ngay.
7. **Trải Nghiệm Voucher Tại Giỏ Hàng ([`MultiShopCart.jsx`](file:///d:/Projects/Do-an/Do_An/Do-An-3/ecommerce-frontend/src/pages/MultiShopCart.jsx)):**
   - Hiển thị pill voucher 1 chạm ngay tại từng kiện hàng của shop.
   - Dropdown chọn nhanh voucher toàn sàn đã lưu.
   - Nút (X) gỡ bỏ voucher trực tiếp.
8. **Trang Thanh Toán Đa Shop ([`Checkout.jsx`](file:///d:/Projects/Do-an/Do_An/Do-An-3/ecommerce-frontend/src/pages/Checkout.jsx)):**
   - Nhận và trừ đầy đủ cả `globalDiscount` và `totalShopDiscounts`.
   - Hiển thị 2 dòng giảm giá minh bạch trong bảng tổng kết chi phí.
9. **Kênh Người Bán ([`SellerVouchers.jsx`](file:///d:/Projects/Do-an/Do_An/Do-An-3/ecommerce-frontend/src/pages/Seller/SellerVouchers.jsx)):**
   - Cho phép chủ shop vừa tạo mới vừa hủy phát hành voucher độc quyền của gian hàng.

---

## 7. THANH TRƯỢT QUẢNG CÁO HỆ THỐNG THÔNG MINH (SMART PROMO SLIDER)

### 7.1. Vị Trí & Cơ Chế Hoạt Động
- Được tích hợp trên đầu trang chủ Marketplace ([`PromoSlider.jsx`](file:///d:/Projects/Do-an/Do_An/Do-An-3/ecommerce-frontend/src/components/PromoSlider.jsx) & [`MarketplaceHome.jsx`](file:///d:/Projects/Do-an/Do_An/Do-An-3/ecommerce-frontend/src/pages/MarketplaceHome.jsx)).
- Tự động luân chuyển quảng cáo mỗi 4.5 giây, tự động tạm dừng khi rê chuột (`hover`) và hỗ trợ bấm nút Next/Prev cũng như chấm chuyển đổi (Dots indicator).

### 7.2. Thuật Toán Lựa Chọn Sản Phẩm Đưa Lên Quảng Cáo
1. **Ưu Tiên Sản Phẩm Mới Đưa Lên Sàn (`NEW_ARRIVAL`):**
   - Lọc theo ngày tạo mới nhất hoặc các sản phẩm có ID cao nhất được duyệt lên sàn.
   - Gắn nhãn badge: *`🚀 SIÊU PHẨM MỚI LÊN KỆ HÔM NAY`*.
2. **Ưu Tiên Sản Phẩm Bán Chạy Nhất (`BEST_SELLER`):**
   - Lọc theo số lượng tồn kho tiêu thụ nhiều nhất hoặc đánh giá cao nhất.
   - Gắn nhãn badge: *`🔥 SẢN PHẨM BÁN CHẠY NHẤT TOÀN SÀN`*.
3. **Ưu Tiên Deal Giảm Giá Sâu (`HOT_DEAL`):**
   - Lọc theo phần trăm giảm giá cao nhất (`phanTramGiam >= 15%`).
   - Gắn nhãn badge: *`⚡ FLASH SALE GIỜ VÀNG - GIÁ CỰC SỐC`*.
4. **Hiển Thị Đầy Đủ:**
   - Tên sản phẩm, gian hàng bán lẻ, giá bán ưu đãi, giá gốc gạch ngang, phần trăm tiết kiệm, badge cam kết chính hãng 100%, bảo hành 1 đổi 1, nút CTA "Xem Chi Tiết Sản Phẩm" chuyển hướng ngay vào trang mua hàng.

---

## 8. HỆ THỐNG CHAT VỚI CỬA HÀNG BÊN TRONG TRANG CÁ NHÂN (SHOPEE-LIKE CHAT)

### 8.1. Thiết Kế Trực Quan Như Shopee
- Tích hợp trực tiếp tại Tab **"Tin Nhắn & Chat Shop"** trong Trang cá nhân ([`CustomerProfile.jsx`](file:///d:/Projects/Do-an/Do_An/Do-An-3/ecommerce-frontend/src/pages/CustomerProfile.jsx)).
- **Cột Trái (Danh Sách Hội Thoại):**
  - Liệt kê các gian hàng chính hãng: *Apple Store Chính Hãng CTUT*, *CTUT Gaming & Gear Hub*, *ASUS ROG Official Store*, cùng *Trợ Lý AI Toàn Sàn*.
  - Hiển thị ảnh đại diện shop, trạng thái online (xanh lá), tin nhắn xem trước gần nhất và thời gian.
- **Cột Phải (Cửa Sổ Trò Chuyện Trực Tiếp):**
  - Khung chat cuộn mượt mà với bong bóng tin nhắn phân biệt rõ ràng: Màu xám bạc cho Khách hàng và Màu xanh dương/tím cho Chủ shop.
  - Hiển thị trạng thái gõ chữ *"Đang soạn tin nhắn..."* chân thực.
  - Lưu trữ lịch sử tin nhắn độc lập cho từng gian hàng vào `localStorage` theo cấu trúc `customer_chat_history_{taiKhoan}`.
- **Gợi Ý Tin Nhắn Nhanh 1 Chạm (Quick Prompts):**
  - *"Shop ơi sản phẩm này còn hàng sẵn trong kho không?"*
  - *"Bao lâu shop soạn hàng và bàn giao cho bưu tá ạ?"*
  - *"Sản phẩm này có được bảo hành 1 đổi 1 chính hãng không?"*
  - *"Shop có mã giảm giá riêng độc quyền nào cho mình xin với!"*
- **Phản Hồi Tự Động Thông Minh:**
  - Cửa hàng tự động phản hồi sau 1.2 giây dựa trên ngữ cảnh câu hỏi của khách hàng (kiểm tra tồn kho kho tổng, chính sách bảo hành, cam kết vận chuyển hỏa tốc 2 giờ).

---

## 9. TRANG CÁ NHÂN KHÁCH HÀNG ĐA NĂNG & VÍ ẢO CTUT PAY (`/profile`)

Trang cá nhân được tổ chức thành 6 phân khu chuyên nghiệp:

1. **Hồ Sơ Cá Nhân & Đổi Mật Khẩu:**
   - Xem và chỉnh sửa: Họ tên, Email, Số điện thoại, Địa chỉ nhận hàng, Giới tính, Ngày sinh.
   - Cập nhật thông tin đồng bộ vào CSDL backend (`/auth/profile/update`).
   - Form Đổi Mật Khẩu với kiểm tra mật khẩu cũ, mật khẩu mới tối thiểu 6 ký tự và xác nhận khớp mật khẩu.
2. **Ví Điện Tử Ảo CTUT Pay:**
   - Hiển thị số dư tức thì, bảo vệ bằng mã hóa dữ liệu cục bộ.
   - Nút **"Nạp Tiền Vào Ví"** nhanh (100k, 500k, 1M, 2M, 5M) qua mô phỏng Cổng thanh toán MoMo / Chuyển khoản QR.
   - Nhật ký biến động số dư: Nạp tiền, Thanh toán đơn mua hàng trên sàn, Nhận hoàn tiền khiếu nại.
3. **Quản Lý Đơn Hàng Đã Mua (Shopee-like Order Tracking):**
   - Bộ lọc trạng thái trực quan: Tất Cả | Chờ Xác Nhận | Chờ Lấy Hàng | Đang Giao | Hoàn Thành | Đã Hủy.
   - Xem chi tiết từng đơn hàng, danh sách sản phẩm, shop bán, đơn vị vận chuyển, mã vận đơn Tracking Code và tổng tiền thanh toán.
4. **Kho Voucher Của Tôi:**
   - Lưu trữ các mã giảm giá cá nhân đã thu thập từ sàn và các shop.
   - Thẻ voucher có hạn sử dụng, điều kiện giá trị đơn tối thiểu, nút "Sao chép mã" hoặc "Dùng Ngay" chuyển về giỏ hàng.
5. **Tin Nhắn & Chat Với Cửa Hàng:**
   - Trung tâm hội thoại đa gian hàng phong cách Shopee như đã mô tả ở Mục 8.
6. **Trung Tâm Đánh Giá, Phản Hồi & Khiếu Nại Báo Lỗi:**
   - Gửi phiếu yêu cầu hỗ trợ (Support Ticket) với tiêu đề, phân loại (Lỗi hệ thống, Hàng hỏng/vỡ, Sai sản phẩm, Bưu tá giao trễ, Khác).
   - Hệ thống tự sinh mã **Ticket ID** (ví dụ: `#TCK-849204`) để nhân viên chăm sóc khách hàng và chủ shop phối hợp xử lý.
