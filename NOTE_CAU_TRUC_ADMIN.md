# TÀI LIỆU CẤU TRÚC PHÂN HỆ QUẢN TRỊ HỆ THỐNG (ADMIN DASHBOARD)

> **Mã đề tài đồ án:** DA-TMDT-04  
> **Phân hệ:** Quản trị Người dùng, Phân quyền Nhân sự & Báo cáo  
> **Cổng dịch vụ Backend (identity-service):** `8084`  
> **Cổng API Gateway:** `8080`  
> **Cổng chạy Giao diện (admin-frontend):** `http://localhost:5174` (hoặc cổng Vite cấp phát)  
> **Cơ sở dữ liệu:** PostgreSQL - `identity_db`

---

## 1. TỔNG QUAN KIẾN TRÚC PHÂN HỆ ADMIN

Phân hệ Admin đóng vai trò là cơ quan quản lý đầu não của toàn bộ hệ sinh thái E-commerce & WMS:
- Quản lý tài khoản khách hàng trực tuyến (Khách hàng tự đăng ký từ Web bán hàng).
- Quản trị nhân sự nội bộ, cấp quyền và phân bổ vai trò (`ADMIN`, `THUKHO`, `NVKHO`).
- Kiểm soát truy cập: Khóa hoặc kích hoạt tài khoản vi phạm.
- Cung cấp báo cáo chiến lược doanh thu và quản lý tài chính vận hành.

```
       [ Trình Duyệt Web: admin-frontend ]
                     │  (HTTP / JWT Auth)
                     ▼
         [ API Gateway : 8080 ]
                     │  (lb://identity-service)
                     ▼
     [ identity-service : 8084 (Spring Boot) ]
        ├── PostgreSQL : identity_db (Bảng người dùng, thông tin cá nhân, vai trò)
        └── JWT Service (Ký & thẩm định Token bảo mật)
```

---

## 2. CẤU TRÚC THƯ MỤC SOURCE CODE (`admin-frontend`)

```
admin-frontend/
├── public/                     # Tài nguyên tĩnh công khai
├── src/
│   ├── assets/                 # Logo, hình ảnh minh họa
│   ├── components/             # Layout & Header dùng chung
│   │   ├── Header.jsx & .css   # Thanh điều hướng trên cùng của Admin
│   │   └── Sidebar.jsx & .css  # Thanh Sidebar chọn phân hệ
│   ├── pages/                  # Các màn hình nghiệp vụ
│   │   ├── Login.jsx & .css    # Đăng nhập Quản trị viên
│   │   ├── UserManagementDashboard.jsx # Trung tâm tổng quan người dùng & tab điều hướng
│   │   ├── UserManagement.css  # Kiểu dáng giao diện thẻ thống kê & bảng dữ liệu
│   │   ├── CustomerManagement.jsx # Quản lý khách hàng (Xem, tìm kiếm, khóa/mở khóa)
│   │   ├── CustomerManagement.css # Style riêng cho quản lý khách hàng
│   │   ├── StaffManagement.jsx # Quản lý nhân viên nội bộ (Xem, phân quyền, lọc)
│   │   ├── AddStaffForm.jsx    # Form thêm tài khoản nhân viên mới (Cấp vai trò)
│   │   ├── AddStaffForm.css    # Kiểu dáng biểu mẫu nhân viên
│   │   ├── EditStaffForm.jsx   # Form chỉnh sửa thông tin & đổi vai trò nhân sự
│   │   ├── StrategicReport.jsx & .css # Báo cáo chiến lược & biểu đồ doanh thu
│   │   └── FinancialManagement.jsx & .css # Quản trị dòng tiền & tài chính
│   ├── services/               # Kết nối API Backend
│   │   ├── api.js              # Cấu hình Axios trỏ về API Gateway (Port 8080)
│   │   ├── authService.js      # Dịch vụ xác thực đăng nhập/đăng ký
│   │   └── userService.js      # Toàn bộ API người dùng: getStats, getCustomers, getStaff, createStaff, updateStaff, toggleUserStatus
│   ├── App.jsx                 # Cấu hình bộ định tuyến Router
│   ├── main.jsx                # Điểm khởi động ứng dụng React
│   └── index.css               # Reset style cơ bản
├── package.json
└── vite.config.js
```

---

## 3. CHI TIẾT CÁC MODULE VÀ NGHIỆP VỤ QUẢN TRỊ

### 3.1. Dashboard Người Dùng (`UserManagementDashboard.jsx`)
- **Thống kê thời gian thực**: Tự động tính toán tổng tài khoản, số lượng khách hàng, số lượng nhân sự nội bộ trực tiếp từ Database thông qua `userService.getStats()`.
- **Hệ thống Tabs điều hướng**:
  - Tab 1: **Danh sách khách hàng** (`CustomerManagement.jsx`).
  - Tab 2: **Danh sách nhân sự nội bộ** (`StaffManagement.jsx`).
  - Tab 3: **Nhật ký phân quyền & bảo mật**.
- **Nút "Đồng bộ dữ liệu"**: Cho phép kích hoạt refresh API ngay lập tức mà không cần F5 trình duyệt.

### 3.2. Quản Lý Khách Hàng (`CustomerManagement.jsx`)
- **Nguồn dữ liệu**: Đồng bộ toàn bộ tài khoản có vai trò `CUSTOMER` từ `identity-service`.
- **Tìm kiếm thông minh**: Tìm kiếm theo họ tên, tên đăng nhập (tài khoản), email, số điện thoại không phân biệt dấu tiếng Việt.
- **Lọc theo trạng thái**: Lọc tài khoản "Đang hoạt động" hoặc "Đã khóa".
- **Hành động Khóa / Mở khóa**: Gọi trực tiếp API `/auth/users/{id}/toggle-status`. Khi tài khoản bị khóa, khách hàng sẽ không thể đăng nhập vào website mua hàng.

### 3.3. Quản Lý Nhân Sự & Phân Quyền (`StaffManagement.jsx`)
- **Nguồn dữ liệu**: Lọc các tài khoản nội bộ có vai trò `ADMIN`, `THUKHO`, `NVKHO`.
- **Huy hiệu phân quyền (Badge)**: Hiển thị biểu tượng và màu sắc riêng biệt cho từng vai trò:
  - 🛡️ **Quản trị viên (`ADMIN`)**: Toàn quyền cấu hình và báo cáo.
  - 📦 **Thủ kho trưởng (`THUKHO`)**: Quản lý xuất/nhập/tồn tại kho.
  - 📦 **Nhân viên kho (`NVKHO`)**: Vận hành kiểm đếm và đóng gói.
- **Thêm nhân viên mới (`AddStaffForm.jsx`)**: Biểu mẫu tạo tài khoản nội bộ, kiểm tra ràng buộc độ dài số điện thoại (VARCHAR 15), mã hóa mật khẩu qua BCrypt và lưu vào Database.
- **Sửa thông tin nhân viên (`EditStaffForm.jsx`)**: Cập nhật họ tên, số điện thoại, email và cấp lại vai trò nhân viên.
- **Khóa tài khoản nhân viên**: Tạm dừng quyền đăng nhập khi nhân sự nghỉ phép hoặc chuyển công tác.

---

## 4. BẢNG MÃ HÓA CÁC ENDPOINT BACKEND IDENTITY (`identity-service`)

Tất cả các API được gọi qua **API Gateway (Port 8080)** với tiền tố `/auth/...`:

| Phương Thức | Endpoint Gateway | Controller Backend | Mô Tả Chức Năng |
| :---: | :--- | :--- | :--- |
| `POST` | `/auth/login` | `AuthController` | Đăng nhập tài khoản & cấp mã JWT Token |
| `POST` | `/auth/register` | `AuthController` | Đăng ký tài khoản (Khách hàng hoặc Nhân viên) |
| `GET` | `/auth/users` | `AuthController` | Lấy toàn bộ danh sách người dùng trong hệ thống |
| `GET` | `/auth/profile/{taiKhoan}` | `AuthController` | Xem thông tin hồ sơ chi tiết của tài khoản |
| `PUT` | `/auth/users/{id}` | `AuthController` | Cập nhật thông tin họ tên, email, SĐT, phân quyền |
| `PUT` | `/auth/users/{id}/toggle-status` | `AuthController` | Khóa hoặc Mở khóa tài khoản người dùng |
| `PUT` | `/auth/change-password/{taiKhoan}` | `AuthController` | Thay đổi mật khẩu người dùng |
| `DELETE` | `/auth/delete/{taiKhoan}` | `AuthController` | Xóa tài khoản khỏi CSDL |
| `GET` | `/auth/validate` | `AuthController` | Xác minh tính hợp lệ của Token JWT |

---

## 5. CƠ CHẾ QUẢN LÝ VÀ TẠO TÀI KHOẢN NGƯỜI DÙNG

Hệ thống **không tự động tạo bất kỳ tài khoản mẫu nào trong mã nguồn**. Tài khoản chỉ được sinh ra khi:
1. **Quản trị viên tạo trên Web**: Vào trang Admin (`http://localhost:5174`), chọn tab **"Danh sách nhân viên"** ➔ bấm nút **"Thêm nhân viên mới"** để điền thông tin và cấp vai trò (`ADMIN`, `THUKHO`, `NVKHO`).
2. **Khách hàng tự đăng ký**: Thực hiện đăng ký tài khoản qua form đăng ký của hệ thống (gọi API `/auth/register`).
3. **Quản trị viên tạo trực tiếp**: Chèn thủ công vào Database qua pgAdmin/SQL nếu cần thiết.

*Lưu ý: Hệ thống chỉ tự động nạp sẵn 4 danh mục quyền chuẩn (`ADMIN`, `THUKHO`, `NVKHO`, `CUSTOMER`) vào bảng `vai_tro` để phục vụ cho việc liên kết quyền khi bạn tạo người dùng mới.*

