package com.ctut.wms.wmscoreservice.config;

import com.ctut.wms.wmscoreservice.entity.category.Category;
import com.ctut.wms.wmscoreservice.entity.inventory.Inventory;
import com.ctut.wms.wmscoreservice.entity.product.Product;
import com.ctut.wms.wmscoreservice.entity.shipping.ShippingProvider;
import com.ctut.wms.wmscoreservice.entity.supplier.Supplier;
import com.ctut.wms.wmscoreservice.entity.warehouse.Warehouse;
import com.ctut.wms.wmscoreservice.repository.category.CategoryRepository;
import com.ctut.wms.wmscoreservice.repository.inventory.InventoryRepository;
import com.ctut.wms.wmscoreservice.repository.product.ProductRepository;
import com.ctut.wms.wmscoreservice.repository.shipping.ShippingProviderRepository;
import com.ctut.wms.wmscoreservice.repository.supplier.SupplierRepository;
import com.ctut.wms.wmscoreservice.repository.warehouse.WarehouseRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.Arrays;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;
    private final WarehouseRepository warehouseRepository;
    private final InventoryRepository inventoryRepository;
    private final ShippingProviderRepository shippingProviderRepository;
    private final SupplierRepository supplierRepository;

    @Override
    public void run(String... args) {
        log.info("====== WMS CORE SERVICE: KHỞI TẠO DỮ LIỆU BAN ĐẦU V2.0 ======");

        // 1. Kho bãi 2 Tầng (Kho Tổng & Các Gian hàng / Kho Cửa hàng)
        Warehouse khoTong = null;
        Warehouse storeApple = null;
        Warehouse storeGear = null;
        if (warehouseRepository.count() == 0) {
            khoTong = new Warehouse();
            khoTong.setMaKho("KHO-TONG-HCM");
            khoTong.setTenKho("Kho Tổng Phân Phối Trung Tâm (KHO-TONG)");
            khoTong.setDiaChi("Lô A2, KCN Tân Bình, Tây Thạnh, Tân Phú, TP.HCM");
            khoTong.setSucChuaToiDa(100000);
            khoTong.setLoaiHinh("KHO_TONG");
            khoTong.setQuanLyId(2L); // Thủ kho quản lý
            khoTong.setTrangThai("HOAT_DONG");

            storeApple = new Warehouse();
            storeApple.setMaKho("STORE-APPLE");
            storeApple.setTenKho("Apple Store Chính Hãng CTUT");
            storeApple.setDiaChi("256 Đường 30/4, Quận Ninh Kiều, Cần Thơ");
            storeApple.setSucChuaToiDa(5000);
            storeApple.setLoaiHinh("KHO_CUA_HANG");
            storeApple.setMoTaGianHang("Gian hàng ủy quyền chính hãng Apple tại Cần Thơ, bảo hành 12 tháng 1 đổi 1");
            storeApple.setQuanLyId(3L); // Chủ cửa hàng 1
            storeApple.setTrangThai("HOAT_DONG");

            storeGear = new Warehouse();
            storeGear.setMaKho("STORE-GEAR");
            storeGear.setTenKho("CTUT Gaming & Gear Hub");
            storeGear.setDiaChi("88 Nguyễn Văn Cừ, Quận Ninh Kiều, Cần Thơ");
            storeGear.setSucChuaToiDa(8000);
            storeGear.setLoaiHinh("KHO_CUA_HANG");
            storeGear.setMoTaGianHang("Thiên đường gaming gear, bàn phím cơ, chuột không dây & phụ kiện gaming cao cấp");
            storeGear.setQuanLyId(4L); // Chủ cửa hàng 2
            storeGear.setTrangThai("HOAT_DONG");

            warehouseRepository.saveAll(Arrays.asList(khoTong, storeApple, storeGear));
            log.info("-> Đã khởi tạo 1 Kho Tổng và 2 Gian hàng Sàn TMĐT.");
        } else {
            khoTong = warehouseRepository.findAll().get(0);
            if (warehouseRepository.count() > 1) {
                storeApple = warehouseRepository.findAll().get(1);
            }
        }

        // 2. Danh mục
        Category catPhone = null;
        Category catLaptop = null;
        Category catPhuKien = null;
        if (categoryRepository.count() == 0) {
            catPhone = new Category();
            catPhone.setTenDanhMuc("Điện Thoại & Tablet");
            catPhone.setMoTa("Thiết bị di động thông minh chính hãng");

            catLaptop = new Category();
            catLaptop.setTenDanhMuc("Laptop & Máy Tính");
            catLaptop.setMoTa("Máy tính xách tay và máy trạm văn phòng");

            catPhuKien = new Category();
            catPhuKien.setTenDanhMuc("Phụ Kiện Gaming & Văn Phòng");
            catPhuKien.setMoTa("Chuột, bàn phím, tai nghe chất lượng cao");

            categoryRepository.saveAll(Arrays.asList(catPhone, catLaptop, catPhuKien));
            log.info("-> Đã khởi tạo 3 Danh mục hàng hóa.");
        } else {
            catPhone = categoryRepository.findAll().get(0);
            if (categoryRepository.count() > 2) {
                catPhuKien = categoryRepository.findAll().get(2);
            }
        }

        // 3. Nhà cung cấp gốc (Kho Tổng làm việc)
        if (supplierRepository.count() == 0) {
            Supplier nccApple = new Supplier();
            nccApple.setMaNhaCungCap("NCC-APPLE");
            nccApple.setTenNhaCungCap("Công ty TNHH Apple Việt Nam");
            nccApple.setNguoiLienHe("Trần Minh Quân");
            nccApple.setSoDienThoai("0901234567");
            nccApple.setEmail("contact@apple.vn");
            nccApple.setDiaChi("Tầng 5, Tòa nhà Bitexco, Q.1, TP.HCM");
            nccApple.setTrangThai("HOAT_DONG");

            Supplier nccLogitech = new Supplier();
            nccLogitech.setMaNhaCungCap("NCC-LOGI");
            nccLogitech.setTenNhaCungCap("Công ty TNHH Logitech Việt Nam");
            nccLogitech.setNguoiLienHe("Lê Hoàng Phong");
            nccLogitech.setSoDienThoai("0912345678");
            nccLogitech.setEmail("b2b@logitech.vn");
            nccLogitech.setDiaChi("Tòa nhà Vincom Center, Lê Thánh Tôn, TP.HCM");
            nccLogitech.setTrangThai("HOAT_DONG");

            supplierRepository.saveAll(Arrays.asList(nccApple, nccLogitech));
            log.info("-> Đã khởi tạo 2 Nhà cung cấp gốc.");
        }

        // 4. Đơn vị vận chuyển
        if (shippingProviderRepository.count() == 0) {
            ShippingProvider ghtk = new ShippingProvider();
            ghtk.setMaDonVi("DV-GHTK");
            ghtk.setTenDonVi("Giao Hàng Tiết Kiệm (GHTK)");
            ghtk.setThongTinLienHe("1900 6092");
            ghtk.setWebsite("https://ghtk.vn");
            ghtk.setTrangThai("HOAT_DONG");

            ShippingProvider ghn = new ShippingProvider();
            ghn.setMaDonVi("DV-GHN");
            ghn.setTenDonVi("Giao Hàng Nhanh (GHN)");
            ghn.setThongTinLienHe("1900 636677");
            ghn.setWebsite("https://ghn.vn");
            ghn.setTrangThai("HOAT_DONG");

            ShippingProvider viettelPost = new ShippingProvider();
            viettelPost.setMaDonVi("DV-VTPOST");
            viettelPost.setTenDonVi("Tổng Công Ty Viettel Post");
            viettelPost.setThongTinLienHe("1900 8095");
            viettelPost.setWebsite("https://viettelpost.com.vn");
            viettelPost.setTrangThai("HOAT_DONG");

            shippingProviderRepository.saveAll(Arrays.asList(ghtk, ghn, viettelPost));
            log.info("-> Đã khởi tạo 3 Đơn vị vận chuyển.");
        }

        // 5. Master Catalog & Tồn kho 2 Tầng (Kho Tổng & Đăng bán tại Gian hàng)
        if (productRepository.count() == 0 && catPhone != null && khoTong != null) {
            Product sp1 = new Product();
            sp1.setSku("SP001");
            sp1.setTenSanPham("iPhone 15 Pro Max 256GB Titan Tự Nhiên");
            sp1.setDonViTinh("Cái");
            sp1.setGiaBan(29990000.0);
            sp1.setGiaNhap(25500000.0);
            sp1.setKhoiLuong(0.22);
            sp1.setHinhAnh("https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=500&auto=format&fit=crop");
            sp1.setMoTa("iPhone 15 Pro Max với khung viền Titan chuẩn hàng không vũ trụ, chip A17 Pro mạnh mẽ hàng đầu.");
            sp1.setTrangThai("DANG_KINH_DOANH");
            sp1.setDanhMuc(catPhone);
            Product savedSp1 = productRepository.save(sp1);

            // Tồn kho tại Kho Tổng
            Inventory inv1Tong = new Inventory();
            inv1Tong.setSanPham(savedSp1);
            inv1Tong.setKhoHang(khoTong);
            inv1Tong.setSoLuongThucTe(100);
            inv1Tong.setSoLuongKhaDung(100);
            inv1Tong.setSoLuongToiThieu(20);
            inv1Tong.setSoLuongToiDa(1000);
            inv1Tong.setGiaBanHienTai(BigDecimal.valueOf(29990000));
            inv1Tong.setDangBan(false); // Kho tổng không trực tiếp bán lẻ B2C
            inventoryRepository.save(inv1Tong);

            // Tồn kho và mở bán tại Cửa Hàng Apple
            if (storeApple != null) {
                Inventory inv1Shop = new Inventory();
                inv1Shop.setSanPham(savedSp1);
                inv1Shop.setKhoHang(storeApple);
                inv1Shop.setSoLuongThucTe(25);
                inv1Shop.setSoLuongKhaDung(25);
                inv1Shop.setSoLuongToiThieu(5);
                inv1Shop.setSoLuongToiDa(100);
                inv1Shop.setGiaBanHienTai(BigDecimal.valueOf(29490000)); // Giá khuyến mãi riêng của shop
                inv1Shop.setSoLuongDaBan(18);
                inv1Shop.setDangBan(true); // Đăng bán lên Sàn TMĐT tập trung
                inventoryRepository.save(inv1Shop);
            }

            Product sp2 = new Product();
            sp2.setSku("SP002");
            sp2.setTenSanPham("Chuột không dây Logitech MX Master 3S");
            sp2.setDonViTinh("Cái");
            sp2.setGiaBan(2490000.0);
            sp2.setGiaNhap(1800000.0);
            sp2.setKhoiLuong(0.14);
            sp2.setHinhAnh("https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=500&auto=format&fit=crop");
            sp2.setMoTa("Chuột công thái học hàng đầu cho dân văn phòng và lập trình viên, cuộn MagSpeed siêu êm ái.");
            sp2.setTrangThai("DANG_KINH_DOANH");
            sp2.setDanhMuc(catPhuKien != null ? catPhuKien : catPhone);
            Product savedSp2 = productRepository.save(sp2);

            // Tồn kho tại Kho Tổng
            Inventory inv2Tong = new Inventory();
            inv2Tong.setSanPham(savedSp2);
            inv2Tong.setKhoHang(khoTong);
            inv2Tong.setSoLuongThucTe(200);
            inv2Tong.setSoLuongKhaDung(200);
            inv2Tong.setSoLuongToiThieu(30);
            inv2Tong.setSoLuongToiDa(2000);
            inv2Tong.setGiaBanHienTai(BigDecimal.valueOf(2490000));
            inv2Tong.setDangBan(false);
            inventoryRepository.save(inv2Tong);

            // Tồn kho và mở bán tại Cửa Hàng Gear Hub
            if (storeGear != null) {
                Inventory inv2Shop = new Inventory();
                inv2Shop.setSanPham(savedSp2);
                inv2Shop.setKhoHang(storeGear);
                inv2Shop.setSoLuongThucTe(40);
                inv2Shop.setSoLuongKhaDung(40);
                inv2Shop.setSoLuongToiThieu(8);
                inv2Shop.setSoLuongToiDa(200);
                inv2Shop.setGiaBanHienTai(BigDecimal.valueOf(2390000)); // Giá shop
                inv2Shop.setSoLuongDaBan(32);
                inv2Shop.setDangBan(true); // Đăng bán lên Sàn
                inventoryRepository.save(inv2Shop);
            }

            log.info("-> Đã khởi tạo Master Catalog & Tồn kho phân phối 2 tầng (Kho Tổng & Đăng bán Gian hàng).");
        }

        log.info("- Tổng số Danh mục: {}", categoryRepository.count());
        log.info("- Tổng số Kho & Gian hàng: {}", warehouseRepository.count());
        log.info("- Tổng số Nhà cung cấp: {}", supplierRepository.count());
        log.info("- Tổng số Đơn vị vận chuyển: {}", shippingProviderRepository.count());
        log.info("- Tổng số Sản phẩm Master: {}", productRepository.count());
        log.info("- Tổng số Bản ghi Tồn kho 2 cấp: {}", inventoryRepository.count());
        log.info("====== WMS CORE SERVICE SẴN SÀNG CHO MÔ HÌNH V2.0 ======");
    }
}
