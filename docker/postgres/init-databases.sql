-- Tạo 5 cơ sở dữ liệu độc lập (Database-per-service) khi container PostgreSQL khởi tạo lần đầu.
-- Bảng do Hibernate tự tạo khi các service khởi động (ddl-auto: update).
CREATE DATABASE identity_db;
CREATE DATABASE wms_core_db;
CREATE DATABASE order_db;
CREATE DATABASE payment_db;
CREATE DATABASE inter_db;
