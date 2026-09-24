package com.ctut.wms.wmscoreservice.service.inventory;

import com.ctut.wms.wmscoreservice.dto.inventory.InventoryRequest;
import com.ctut.wms.wmscoreservice.entity.inventory.Inventory;
import com.ctut.wms.wmscoreservice.entity.product.Product;
import com.ctut.wms.wmscoreservice.entity.warehouse.Warehouse;
import com.ctut.wms.wmscoreservice.repository.inventory.InventoryRepository;
import com.ctut.wms.wmscoreservice.repository.product.ProductRepository;
import com.ctut.wms.wmscoreservice.repository.warehouse.WarehouseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class InventoryService {
    private final InventoryRepository inventoryRepository;
    private final ProductRepository productRepository;
    private final WarehouseRepository warehouseRepository;

    @Transactional
    public Inventory addStock(InventoryRequest request) {
        // 1. Tìm Sản phẩm và Kho hàng xem có tồn tại không
        Product product = productRepository.findById(request.getSanPhamId())
                .orElseThrow(() -> new RuntimeException("Lỗi: Không tìm thấy sản phẩm!"));

        Warehouse warehouse = warehouseRepository.findById(request.getKhoHangId())
                .orElseThrow(() -> new RuntimeException("Lỗi: Không tìm thấy kho hàng!"));

        // 2. Tìm xem sản phẩm này đã có trong kho này chưa
        Inventory inventory = inventoryRepository.findBySanPhamAndKhoHang(product, warehouse)
                .orElse(new Inventory());

        // 3. Nếu là lần đầu nhập (chưa có ID), thiết lập các liên kết
        if (inventory.getId() == null) {
            inventory.setSanPham(product);
            inventory.setKhoHang(warehouse);
            inventory.setSoLuongThucTe(0);
            inventory.setSoLuongKhaDung(0); // Khởi tạo mốc 0
        }

        // 4. Cộng dồn số lượng mới vào số lượng hiện tại
        inventory.setSoLuongThucTe(inventory.getSoLuongThucTe() + request.getSoLuong());
        inventory.setSoLuongKhaDung(inventory.getSoLuongKhaDung() + request.getSoLuong());
        // 5. Lưu xuống cơ sở dữ liệu
        return inventoryRepository.save(inventory);
    }
}
