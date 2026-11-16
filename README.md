# CTUT GEAR — Hệ thống Kho vận 2 tầng & Sàn TMĐT tập trung (B2B2C)

Đồ án 3 — Mã đề tài **DA-TMDT-04**: Xây dựng hệ thống WMS và E-commerce đa gian hàng.

- **Backend:** 7 module Spring Boot 4 (Java 21) theo kiến trúc microservices: API Gateway, Eureka, identity, wms-core, order, payment, interaction.
- **Frontend:** 3 ứng dụng React + Vite: Sàn TMĐT & Kênh Người Bán, Quản trị, Kho vận WMS.
- **CSDL:** PostgreSQL, mỗi service một database riêng.

Toàn bộ logic nghiệp vụ, phân quyền, luồng trạng thái và danh mục API được mô tả trong **[LOGIC_HE_THONG_DO_AN_3.md](LOGIC_HE_THONG_DO_AN_3.md)**.

---

## 1. Chạy nhanh bằng Docker (khuyên dùng)

Yêu cầu: Docker Desktop (có Docker Compose v2).

```bash
cp .env.example .env          # Windows PowerShell: copy .env.example .env
docker compose up -d --build  # lần đầu mất vài phút để build
```

| Ứng dụng | Địa chỉ |
|---|---|
| Sàn TMĐT & Kênh Người Bán | http://localhost:5173 (Kênh người bán: `/seller/login`) |
| Quản trị (Admin) | http://localhost:5174 |
| Kho vận (WMS) | http://localhost:5175 |
| API Gateway | http://localhost:8080 |
| Eureka Dashboard | http://localhost:8761 |
| PostgreSQL (xem dữ liệu) | `localhost:5433`, user/pass trong `.env` |

Các lệnh hay dùng:

```bash
docker compose ps                         # trạng thái các service
docker compose logs -f order-service      # xem log 1 service
docker compose up -d --build wms-core-service   # build lại 1 service sau khi sửa code
docker compose down                       # dừng (giữ dữ liệu)
docker compose down -v                    # dừng và XÓA toàn bộ dữ liệu
```

> Sau khi khởi động, các service cần khoảng 30–60 giây để đăng ký với Eureka. Nếu gọi API bị lỗi 503 ngay lúc đầu, chờ thêm rồi thử lại.

---

## 2. Chạy thủ công để phát triển

Yêu cầu: JDK 21, Node.js ≥ 20.19, PostgreSQL đang chạy ở `localhost:5432` với 5 database: `identity_db`, `wms_core_db`, `order_db`, `payment_db`, `inter_db` (script tạo DB: [docker/postgres/init-databases.sql](docker/postgres/init-databases.sql)).

**Backend:** khởi động theo thứ tự; mỗi service một cửa sổ terminal, trong thư mục `wms-ecommerce-system/<service>`:

```bash
./mvnw spring-boot:run      # Windows: mvnw.cmd spring-boot:run
```

| Thứ tự | Service | Cổng |
|:---:|---|:---:|
| 1 | `discovery-server` | 8761 |
| 2 | `identity-service` | 8084 |
| 2 | `wms-core-service` | 8081 |
| 2 | `order-service` | 8082 |
| 2 | `payment-service` | 8085 |
| 2 | `interaction-service` | 8083 |
| 3 | `api-gateway` | 8080 |

> ⚠️ Gateway và **cả 5 service phải dùng cùng `INTERNAL_SECRET` và `JWT_SECRET`** (mặc định đã giống nhau). Khi đổi khóa, phải khởi động lại tất cả.

**Frontend:** mỗi app một terminal:

```bash
cd ecommerce-frontend && npm install && npm run dev   # :5173
cd admin-frontend     && npm install && npm run dev   # :5174
cd wms-frontend       && npm install && npm run dev   # :5175
```

Địa chỉ Gateway mà frontend gọi tới được cấu hình bằng `VITE_API_GATEWAY_URL` trong file `.env` của từng app.

---

## 3. Tài khoản mẫu

| Tài khoản | Mật khẩu | Vai trò | Đăng nhập tại |
|---|---|---|---|
| `admin` | `admin` | Quản trị viên | Admin :5174 (hoặc `/seller/login`) |
| `thukho` | `123456` | Thủ kho | WMS :5175 |
| `nvkho` | `123456` | Nhân viên kho | WMS :5175 |
| `seller_minhquan`, `shop_apple` | `123456` | Chủ cửa hàng | Sàn :5173 → `/seller/login` |
| `baomap05`, `khachhang`, `hungbakkka` | `123456` | Khách hàng | Sàn :5173 → `/login` |

- **Mã PIN ký hợp đồng cung ứng:** `123456`
- **Voucher mẫu:** `CTUT50K`, `CTUTNEW50`, `FREESHIP`, `TECHPRO10` (toàn sàn); `SHOP1OFF10`, `SHOP2OFF10`, `SHOP3OFF10`… (theo shop).

Kịch bản demo đầy đủ: xem mục 15 của [LOGIC_HE_THONG_DO_AN_3.md](LOGIC_HE_THONG_DO_AN_3.md#15-kịch-bản-kiểm-thử--tài-khoản-mẫu).

---

## 4. Kiểm thử tự động

Mỗi service có bộ unit test (JUnit 5 + Mockito, **không cần CSDL**) cho các nghiệp vụ cốt lõi:

| Service | Nội dung kiểm thử |
|---|---|
| `api-gateway` | Ma trận phân quyền RBAC, chống giả mạo header `X-User-*`, token giả/cửa sau, đường dẫn bất thường |
| `identity-service` | Chống tự đăng ký/tự nâng quyền ADMIN, chỉ chính chủ sửa tài khoản, đổi mật khẩu cần mật khẩu cũ |
| `order-service` | Giá lấy từ WMS, voucher 2 tầng & phân bổ giảm giá, hủy đơn nhả tồn/hoàn voucher, máy trạng thái, rollback thanh toán |
| `wms-core-service` | Giữ chỗ tồn kho khi lập phiếu xuất, không nhập kho 2 lần, hợp đồng cung ứng 6 bước chuyển tồn kho thật |
| `payment-service` | Số tiền do server tính, IPN MoMo bắt buộc chữ ký, Crypto chờ Admin xác minh |

```bash
cd wms-ecommerce-system/order-service && ./mvnw test
```

Báo cáo kết quả nằm ở `target/surefire-reports/`.

Test tích hợp `*ApplicationTests` (khởi động toàn bộ Spring context) cần PostgreSQL nên **mặc định được bỏ qua**. Để chạy:

```bash
RUN_INTEGRATION_TESTS=true ./mvnw test        # PowerShell: $env:RUN_INTEGRATION_TESTS="true"; ./mvnw test
```

---

## 5. Cấu trúc thư mục

```
Do-An-3/
├── wms-ecommerce-system/        # Backend (Maven multi-module)
│   ├── api-gateway/             # Cổng vào duy nhất, JWT, RBAC
│   ├── discovery-server/        # Eureka
│   ├── identity-service/        # Tài khoản, đăng nhập, vai trò
│   ├── wms-core-service/        # Kho, tồn kho, phiếu nhập/xuất, hợp đồng cung ứng, tài chính
│   ├── order-service/           # Đặt hàng, tách đơn, voucher, giao vận
│   ├── payment-service/         # MoMo, Crypto
│   ├── interaction-service/     # Bình luận, đánh giá
│   └── Dockerfile               # Dockerfile dùng chung cho các service
├── ecommerce-frontend/          # Sàn TMĐT + Kênh Người Bán (/seller)
├── admin-frontend/              # Trang quản trị
├── wms-frontend/                # Trang kho vận
├── docker/                      # Dockerfile frontend, script khởi tạo PostgreSQL
├── docker-compose.yml
├── .env.example                 # Mẫu biến môi trường (sao chép thành .env)
└── LOGIC_HE_THONG_DO_AN_3.md    # Tài liệu logic hệ thống
```

---

## 6. Xử lý sự cố thường gặp

| Hiện tượng | Nguyên nhân & cách xử lý |
|---|---|
| Gọi API trả **403 "Vui lòng truy cập qua API Gateway!"** | Đang gọi thẳng cổng service (8081–8085) hoặc `INTERNAL_SECRET` giữa Gateway và service không khớp. Luôn gọi qua `:8080`. |
| Gọi API trả **401** dù đã đăng nhập | Token hết hạn (24 giờ) hoặc `JWT_SECRET` của Gateway và identity-service khác nhau. Đăng nhập lại. |
| Gateway trả **503** | Service chưa đăng ký xong với Eureka, chờ 30–60 giây. |
| Lỗi **CORS** khi demo qua mạng LAN | Gateway chỉ cho phép origin `localhost`/`127.0.0.1` cổng 5173–5176 & 3000–3001. Thêm IP máy demo vào `globalcors.allowedOrigins` trong `api-gateway/src/main/resources/application.yaml`. |
| Đơn MoMo/Crypto tự chuyển **CANCELLED_PAYMENT_FAILED** | Quá hạn thanh toán (mặc định 30 phút). Tăng `ORDER_PAYMENT_TIMEOUT_MINUTES` khi demo. |
| Chủ shop không **xác nhận** được đơn MoMo | Đơn thanh toán online phải được thanh toán trước. Demo bằng COD hoặc để Admin xác nhận thanh toán. |
| `wms-frontend` báo thiếu `recharts` | Chạy `npm install` trong `wms-frontend`. |
