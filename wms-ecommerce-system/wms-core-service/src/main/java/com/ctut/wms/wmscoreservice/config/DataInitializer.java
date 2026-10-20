package com.ctut.wms.wmscoreservice.config;

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

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    // Vẫn giữ lại các kho chứa để kiểm tra trạng thái (nếu cần thiết sau này)
    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;
    private final WarehouseRepository warehouseRepository;
    private final InventoryRepository inventoryRepository;
    private final ShippingProviderRepository shippingProviderRepository;
    private final SupplierRepository supplierRepository;

    @Override
    public void run(String... args) {
        log.info("====== WMS CORE SERVICE ĐÃ KHỞI ĐỘNG ======");

        // In ra số lượng bản ghi hiện có trong database để quản trị viên dễ theo dõi
        log.info("Trạng thái Cơ sở dữ liệu hiện tại:");
        log.info("- Tổng số Danh mục: {}", categoryRepository.count());
        log.info("- Tổng số Kho hàng: {}", warehouseRepository.count());
        log.info("- Tổng số Nhà cung cấp: {}", supplierRepository.count());
        log.info("- Tổng số Đơn vị vận chuyển: {}", shippingProviderRepository.count());
        log.info("- Tổng số Sản phẩm: {}", productRepository.count());
        log.info("- Tổng số Bản ghi Tồn kho: {}", inventoryRepository.count());

        log.info("Hệ thống đã sẵn sàng tiếp nhận dữ liệu từ Frontend!");
        log.info("===========================================");
    }
}