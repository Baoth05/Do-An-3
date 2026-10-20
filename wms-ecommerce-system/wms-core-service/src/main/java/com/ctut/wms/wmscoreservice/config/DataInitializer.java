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
import org.springframework.context.annotation.Configuration;

import java.util.Arrays;
import java.util.List;

@Configuration
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final WarehouseRepository warehouseRepository;
    private final InventoryRepository inventoryRepository;
    private final ShippingProviderRepository shippingProviderRepository;
    private final SupplierRepository supplierRepository;

    @Override
    public void run(String... args) {
        if (categoryRepository.count() == 0) {
            log.info("Khởi tạo danh mục sản phẩm mẫu...");
            Category cDienThoai = new Category(null, "Điện thoại", "Các dòng smartphone cao cấp");
            Category cLaptop = new Category(null, "Laptop", "Máy tính xách tay & Ultrabook");
            Category cPhuKien = new Category(null, "Phụ kiện", "Tai nghe, chuột, bàn phím và phụ kiện số");
            categoryRepository.saveAll(Arrays.asList(cDienThoai, cLaptop, cPhuKien));
        }

        Warehouse defaultWarehouse = null;
        if (warehouseRepository.count() == 0) {
            log.info("Khởi tạo kho hàng mặc định...");
            defaultWarehouse = new Warehouse(null, "KHO-01", "Kho Tổng Trung Tâm", "Số 1 Đại Cồ Việt, Hai Bà Trưng, Hà Nội");
            defaultWarehouse = warehouseRepository.save(defaultWarehouse);
        } else {
            defaultWarehouse = warehouseRepository.findAll().get(0);
        }

        if (shippingProviderRepository.count() == 0) {
            log.info("Khởi tạo đơn vị vận chuyển mặc định...");
            ShippingProvider sp1 = new ShippingProvider(null, "Giao Hàng Tiết Kiệm (GHTK)", "1900 6092");
            ShippingProvider sp2 = new ShippingProvider(null, "Viettel Post", "1900 8095");
            shippingProviderRepository.saveAll(Arrays.asList(sp1, sp2));
        }

        if (supplierRepository.count() == 0) {
            log.info("Khởi tạo nhà cung cấp mẫu...");
            Supplier s1 = new Supplier(null, "Công ty TNHH Apple Việt Nam", "028 3822 5566", "Quận 1, TP. Hồ Chí Minh");
            Supplier s2 = new Supplier(null, "Công ty Cổ phần Digiworld", "028 3929 0059", "Quận 3, TP. Hồ Chí Minh");
            supplierRepository.saveAll(Arrays.asList(s1, s2));
        }

        if (productRepository.count() == 0) {
            log.info("Khởi tạo danh sách sản phẩm mẫu chuẩn WMS...");
            List<Category> categories = categoryRepository.findAll();
            Category cPhone = categories.size() > 0 ? categories.get(0) : null;
            Category cLaptop = categories.size() > 1 ? categories.get(1) : cPhone;
            Category cPhuKien = categories.size() > 2 ? categories.get(2) : cPhone;

            Product p1 = Product.builder().sku("SP001").tenSanPham("iPhone 15 Pro Max 256GB").donViTinh("Cái").danhMuc(cPhone).build();
            Product p2 = Product.builder().sku("SP002").tenSanPham("MacBook Pro 14 M3 Pro 18GB/512GB").donViTinh("Cái").danhMuc(cLaptop).build();
            Product p3 = Product.builder().sku("SP003").tenSanPham("Tai nghe chống ồn Sony WH-1000XM5").donViTinh("Cái").danhMuc(cPhuKien).build();
            Product p4 = Product.builder().sku("SP004").tenSanPham("Chuột không dây Logitech MX Master 3S").donViTinh("Cái").danhMuc(cPhuKien).build();
            Product p5 = Product.builder().sku("SP005").tenSanPham("Bàn phím cơ Keychron Q1 Pro Wireless").donViTinh("Cái").danhMuc(cPhuKien).build();

            List<Product> savedProducts = productRepository.saveAll(Arrays.asList(p1, p2, p3, p4, p5));

            // Nạp tồn kho ban đầu cho từng sản phẩm
            if (defaultWarehouse != null) {
                for (Product p : savedProducts) {
                    Inventory inv = new Inventory(null, p, defaultWarehouse, 100, 100, 10, 1000);
                    inventoryRepository.save(inv);
                }
            }
            log.info("Đã nạp thành công 5 sản phẩm mẫu và 100 tồn kho cho mỗi sản phẩm!");
        }
    }
}
