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
4. **`ecommerce-frontend`:** Build thành công Vite (`✓ 131 modules transformed`, exit code 0).
