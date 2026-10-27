# TÀI LIỆU CẤU TRÚC PHÂN HỆ QUẢN LÝ KHO (CTUT WMS CORE)

> **Mã đề tài đồ án:** DA-TMDT-04  
> **Phân hệ:** Quản lý Kho bãi vật lý & Master Data  
> **Cổng dịch vụ Backend (wms-core-service):** `8081`  
> **Cổng API Gateway:** `8080`  
> **Cổng chạy Giao diện (wms-frontend):** `http://localhost:5173` (hoặc cổng Vite cấp phát)  
> **Cơ sở dữ liệu:** PostgreSQL - `wms_core_db`

---

## 1. TỔNG QUAN KIẾN TRÚC PHÂN HỆ KHO

Hệ thống WMS Kho được thiết kế tuân thủ nguyên tắc **Microservices**, chịu trách nhiệm quản trị kho vật lý, lưu trữ Master Data và xử lý vòng đời của hàng hóa từ khâu nhập kho, lưu kho, điều chuyển cho đến xuất kho giao hàng.

```
       [ Trình Duyệt Web: wms-frontend ]
                     │  (HTTP / JWT Auth)
                     ▼
         [ API Gateway : 8080 ]
                     │  (lb://wms-core-service)
                     ▼
     [ wms-core-service : 8081 (Spring Boot) ]
        ├── PostgreSQL : wms_core_db (Dữ liệu thực tế)
        └── RabbitMQ / Redis (Tối ưu tải & đồng bộ dữ liệu)
```

---

## 2. CẤU TRÚC THƯ MỤC SOURCE CODE (`wms-frontend`)

```
wms-frontend/
├── public/                     # Tài nguyên tĩnh công khai
├── src/
│   ├── assets/                 # Hình ảnh, biểu tượng giao diện
│   ├── components/             # Các Component dùng chung
│   │   ├── Common/
│   │   │   ├── Button.jsx & .css    # Nút bấm chuẩn hóa
│   │   │   └── Modal.jsx & .css     # Hộp thoại pop-up (Cộng tồn kho, Thẻ kho)
│   │   └── Layout/
│   │       ├── WmsLayout.jsx        # Khung giao diện chính (Sidebar + Topbar)
│   │       └── WmsLayout.css        # Kiểu dáng Sidebar và Body
│   ├── context/
│   │   └── AuthContext.jsx          # Quản lý phiên đăng nhập & lưu Token thực tế
│   ├── pages/                  # Các trang nghiệp vụ chức năng (CRUD)
│   │   ├── Auth/
│   │   │   └── Login.jsx & .css     # Màn hình đăng nhập tài khoản thủ kho
│   │   ├── Dashboard/
│   │   │   └── WmsDashboard.jsx     # Bảng điều khiển thống kê vận hành thời gian thực
│   │   ├── Inventory/
│   │   │   └── InventoryStock.jsx   # Quản lý tồn kho kệ & thẻ kho vật lý
│   │   ├── ImportNote/
│   │   │   ├── ImportNoteList.jsx   # Danh sách chứng từ nhập kho
│   │   │   ├── ImportNoteCreate.jsx # Lập phiếu nhập kho từ nhà cung cấp
│   │   │   └── ImportNoteDetail.jsx # Chi tiết phiếu nhập & in ấn chứng từ A4
│   │   ├── ExportNote/
│   │   │   ├── ExportNoteList.jsx   # Danh sách chứng từ xuất kho
│   │   │   ├── ExportNoteCreate.jsx # Lập phiếu xuất kho giao bưu tá
│   │   │   └── ExportNoteDetail.jsx # Chi tiết phiếu xuất & in ấn chứng từ A4
│   │   ├── Transfer/
│   │   │   ├── TransferList.jsx     # Lịch sử điều chuyển kho nội bộ
│   │   │   └── TransferCreate.jsx   # Lập lệnh điều chuyển hàng giữa các kho
│   │   ├── Product/
│   │   │   ├── ProductManagement.jsx # Quản lý hàng hóa (Master SKU)
│   │   │   └── ProductForm.jsx      # Thêm mới & Chỉnh sửa sản phẩm
│   │   ├── Category/
│   │   │   ├── CategoryManagement.jsx # Quản lý danh mục ngành hàng
│   │   │   └── CategoryForm.jsx     # Thêm mới & Sửa danh mục
│   │   ├── Warehouse/
│   │   │   ├── WarehouseManagement.jsx # Quản lý danh sách kho chi nhánh
│   │   │   └── WarehouseForm.jsx    # Thêm mới & Cập nhật kho bãi
│   │   ├── Supplier/
│   │   │   ├── SupplierManagement.jsx  # Quản lý nhà cung cấp B2B
│   │   │   └── SupplierForm.jsx     # Thêm mới & Sửa nhà cung cấp
│   │   └── Shipping/
│   │       ├── ShippingManagement.jsx  # Quản lý đơn vị vận chuyển (3PL)
│   │       └── ShippingForm.jsx     # Thêm mới & Sửa đơn vị vận chuyển
│   ├── services/               # Tầng kết nối API Backend
│   │   ├── api.js                   # Cấu hình Axios & Interceptor gắn JWT Token
│   │   ├── authService.js           # API đăng nhập/đăng ký qua identity-service
│   │   ├── wmsCoreService.js        # Toàn bộ API CRUD của wms-core-service
│   │   └── productService.js        # API chuyên biệt cho sản phẩm & phân loại
│   ├── utils/
│   │   ├── constants.js             # Base URL Gateway & các hằng số trạng thái
│   │   └── formatters.js            # Hàm định dạng tiền tệ (VNĐ), ngày tháng
│   ├── App.jsx                 # Định tuyến toàn bộ ứng dụng (React Router v6)
│   ├── main.jsx                # Điểm khởi chạy React DOM
│   └── index.css               # Reset CSS và Font chữ hệ thống
├── package.json
└── vite.config.js
```

---

## 3. CHI TIẾT CÁC MODULE CHỨC NĂNG & ĐƯỜNG DẪN ROUTER

| Nhóm Chức Năng | Tên Màn Hình | Đường Dẫn URL (Route) | File Giao Diện | Chức Năng CRUD |
| :--- | :--- | :--- | :--- | :--- |
| **Xác thực** | Đăng nhập Thủ kho | `/login` | `pages/Auth/Login.jsx` | Đăng nhập lấy Token |
| **Vận hành kho** | Bảng điều khiển | `/dashboard` | `pages/Dashboard/WmsDashboard.jsx` | Thống kê số lượng thực tế từ DB |
| | Tồn kho & Thẻ kho | `/inventory` | `pages/Inventory/InventoryStock.jsx` | Xem tồn kệ, lọc cảnh báo cạn kho, cộng tồn kho |
| | Phiếu Nhập Kho | `/import-notes` | `pages/ImportNote/ImportNoteList.jsx` | Danh sách phiếu nhập thực tế |
| | Lập Phiếu Nhập | `/import-notes/create` | `pages/ImportNote/ImportNoteCreate.jsx` | Chọn NCC, chọn hàng hóa, cộng tồn kho tự động |
| | Chi Tiết Phiếu Nhập | `/import-notes/:id` | `pages/ImportNote/ImportNoteDetail.jsx` | Xem chứng từ, in ấn mẫu A4 |
| | Phiếu Xuất Kho | `/export-notes` | `pages/ExportNote/ExportNoteList.jsx` | Danh sách phiếu xuất thực tế |
| | Lập Phiếu Xuất | `/export-notes/create` | `pages/ExportNote/ExportNoteCreate.jsx` | Xuất kho, trừ tồn kho khả dụng tự động |
| | Chi Tiết Phiếu Xuất | `/export-notes/:id` | `pages/ExportNote/ExportNoteDetail.jsx` | Xem chứng từ xuất bưu tá, in ấn mẫu A4 |
| | Điều Chuyển Kho | `/transfers` | `pages/Transfer/TransferList.jsx` | Lịch sử chuyển hàng giữa 2 kho |
| | Lập Lệnh Chuyển Kho| `/transfers/create` | `pages/Transfer/TransferCreate.jsx` | Trừ kho nguồn, cộng kho đích |
| **Danh mục Master** | Quản lý Sản phẩm | `/products` | `pages/Product/ProductManagement.jsx` | Danh sách sản phẩm Master SKU, tìm kiếm, xóa |
| | Thêm/Sửa Sản phẩm | `/products/create`, `/products/edit/:id` | `pages/Product/ProductForm.jsx` | Thêm SKU mới, định giá bán/nhập |
| | Danh Mục Hàng Hóa | `/categories` | `pages/Category/CategoryManagement.jsx` | Danh sách phân loại ngành hàng |
| | Thêm/Sửa Danh Mục | `/categories/create`, `/categories/edit/:id` | `pages/Category/CategoryForm.jsx` | Thêm/Sửa phân loại |
| | Kho Bãi Chi Nhánh | `/warehouses` | `pages/Warehouse/WarehouseManagement.jsx` | Mạng lưới kho vật lý, địa chỉ, sức chứa |
| | Thêm/Sửa Kho | `/warehouses/create`, `/warehouses/edit/:id` | `pages/Warehouse/WarehouseForm.jsx` | Thêm/Sửa thông tin kho |
| | Nhà Cung Cấp B2B | `/suppliers` | `pages/Supplier/SupplierManagement.jsx` | Danh sách đối tác, liên hệ, địa chỉ |
| | Thêm/Sửa NCC | `/suppliers/create`, `/suppliers/edit/:id` | `pages/Supplier/SupplierForm.jsx` | Thêm/Sửa hồ sơ nhà cung cấp |
| | Đơn Vị Vận Chuyển | `/shipping` | `pages/Shipping/ShippingManagement.jsx` | Danh sách đối tác 3PL (GHTK, GHN, Viettel Post) |
| | Thêm/Sửa ĐVVC | `/shipping/create`, `/shipping/edit/:id` | `pages/Shipping/ShippingForm.jsx` | Thêm/Sửa cổng tra cứu & hotline |

---

## 4. BẢNG MÃ HÓA CÁC ENDPOINT BACKEND KHO BÃI (`wms-core-service`)

Tất cả các API được gọi qua **API Gateway (Port 8080)** với tiền tố `/wms/...`:

| Phương Thức | Endpoint Gateway | Controller Backend | Mô Tả Chức Năng |
| :---: | :--- | :--- | :--- |
| `GET` | `/wms/products` | `ProductController` | Lấy danh sách toàn bộ sản phẩm |
| `GET` | `/wms/products/{id}` | `ProductController` | Lấy chi tiết sản phẩm theo ID |
| `POST` | `/wms/products` | `ProductController` | Thêm sản phẩm mới vào Master Data |
| `PUT` | `/wms/products/{id}` | `ProductController` | Cập nhật thông số sản phẩm |
| `DELETE` | `/wms/products/{id}` | `ProductController` | Xóa sản phẩm khỏi kho |
| `GET` | `/wms/categories` | `CategoryController` | Lấy danh sách danh mục ngành hàng |
| `POST` | `/wms/categories` | `CategoryController` | Thêm danh mục mới |
| `PUT` | `/wms/categories/{id}` | `CategoryController` | Cập nhật danh mục |
| `DELETE` | `/wms/categories/{id}` | `CategoryController` | Xóa danh mục |
| `GET` | `/wms/warehouses` | `WarehouseController` | Lấy danh sách toàn bộ kho hàng |
| `POST` | `/wms/warehouses` | `WarehouseController` | Thêm kho hàng chi nhánh mới |
| `PUT` | `/wms/warehouses/{id}` | `WarehouseController` | Sửa thông tin & sức chứa kho |
| `DELETE` | `/wms/warehouses/{id}` | `WarehouseController` | Xóa kho hàng |
| `GET` | `/wms/inventory` | `InventoryController` | Lấy bảng tồn kho & ngưỡng an toàn (DTO) |
| `POST` | `/wms/inventory/add` | `InventoryController` | Cộng dồn tồn kho thực tế vào kệ |
| `GET` | `/wms/import-notes` | `ImportNoteController` | Lấy danh sách phiếu nhập kho |
| `GET` | `/wms/import-notes/{id}` | `ImportNoteController` | Lấy chi tiết phiếu nhập (kèm danh sách mặt hàng) |
| `POST` | `/wms/import-notes` | `ImportNoteController` | Lập phiếu nhập kho & tự động cộng dồn tồn kho |
| `GET` | `/wms/export-notes` | `ExportNoteController` | Lấy danh sách phiếu xuất kho |
| `GET` | `/wms/export-notes/{id}` | `ExportNoteController` | Lấy chi tiết phiếu xuất (kèm danh sách mặt hàng) |
| `POST` | `/wms/export-notes` | `ExportNoteController` | Lập phiếu xuất & tự động trừ tồn kho khả dụng |
| `GET` | `/wms/transfers` | `InventoryTransferController` | Lấy lịch sử điều chuyển giữa các kho |
| `POST` | `/wms/transfers` | `InventoryTransferController` | Thực hiện điều chuyển hàng giữa 2 kho |
| `GET` | `/wms/suppliers` | `SupplierController` | Lấy danh sách nhà cung cấp |
| `POST` | `/wms/suppliers` | `SupplierController` | Thêm mới nhà cung cấp |
| `PUT` | `/wms/suppliers/{id}` | `SupplierController` | Cập nhật nhà cung cấp |
| `DELETE` | `/wms/suppliers/{id}` | `SupplierController` | Xóa nhà cung cấp |
| `GET` | `/wms/shippers` | `ShippingProviderController` | Lấy danh sách đơn vị vận chuyển |
| `POST` | `/wms/shippers` | `ShippingProviderController` | Thêm mới đơn vị vận chuyển |
| `PUT` | `/wms/shippers/{id}` | `ShippingProviderController` | Cập nhật đơn vị vận chuyển |
| `DELETE` | `/wms/shippers/{id}` | `ShippingProviderController` | Xóa đơn vị vận chuyển |

---

## 5. CƠ CHẾ KHỞI TẠO TÀI KHOẢN ĐĂNG NHẬP

Hệ thống **không tự động sinh sẵn tài khoản ảo**. Tất cả tài khoản sử dụng đều được tạo thực tế:
* **Tạo qua giao diện Web**: Quản trị viên sử dụng màn hình **Quản Lý Nhân Sự** trên trang Admin (`http://localhost:5174`) bấm nút **"Thêm nhân viên mới"** để tạo tài khoản thủ kho (`THUKHO`) hoặc nhân viên kho (`NVKHO`).
* **Đăng ký tài khoản**: Người dùng có thể đăng ký trực tiếp qua màn hình đăng ký (`/auth/register`) hoặc thông qua API Gateway.
* **Quy chuẩn vai trò gán**: Hệ thống khởi tạo sẵn 4 vai trò danh mục trong CSDL (`ADMIN`, `THUKHO`, `NVKHO`, `CUSTOMER`) để sẵn sàng gán khi tạo tài khoản mới.

