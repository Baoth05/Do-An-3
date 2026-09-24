package com.ctut.wms.wmscoreservice.service.transfer;

import com.ctut.wms.wmscoreservice.dto.transfer.InventoryTransferRequest;
import com.ctut.wms.wmscoreservice.entity.product.Product;
import com.ctut.wms.wmscoreservice.entity.warehouse.Warehouse;
import com.ctut.wms.wmscoreservice.entity.inventory.Inventory;
import com.ctut.wms.wmscoreservice.entity.transfer.InventoryTransfer;
import com.ctut.wms.wmscoreservice.repository.product.ProductRepository;
import com.ctut.wms.wmscoreservice.repository.warehouse.WarehouseRepository;
import com.ctut.wms.wmscoreservice.repository.inventory.InventoryRepository;
import com.ctut.wms.wmscoreservice.repository.transfer.InventoryTransferRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class InventoryTransferService {

    private final InventoryTransferRepository transferRepository;
    private final InventoryRepository inventoryRepository;
    private final WarehouseRepository warehouseRepository;
    private final ProductRepository productRepository;

    @Transactional // Nếu có lỗi xảy ra ở bất kỳ dòng nào, toàn bộ dữ liệu sẽ được hoàn tác
    public InventoryTransfer transferStock(InventoryTransferRequest request) {
        // 1. Kiểm tra hai kho không được trùng nhau
        if (request.getKhoNguonId().equals(request.getKhoDichId())) {
            throw new RuntimeException("Lỗi: Kho nguồn và kho đích không được trùng nhau!");
        }

        // 2. Tìm kiếm thực thể từ Database
        Warehouse khoNguon = warehouseRepository.findById(request.getKhoNguonId())
                .orElseThrow(() -> new RuntimeException("Lỗi: Không tìm thấy Kho nguồn!"));
        Warehouse khoDich = warehouseRepository.findById(request.getKhoDichId())
                .orElseThrow(() -> new RuntimeException("Lỗi: Không tìm thấy Kho đích!"));
        Product sanPham = productRepository.findById(request.getSanPhamId())
                .orElseThrow(() -> new RuntimeException("Lỗi: Không tìm thấy Sản phẩm!"));

        // 3. Xử lý trừ hàng ở Kho Nguồn
        Inventory tonKhoNguon = inventoryRepository.findBySanPhamAndKhoHang(sanPham, khoNguon)
                .orElseThrow(() -> new RuntimeException("Lỗi: Sản phẩm không tồn tại trong Kho nguồn!"));

        if (tonKhoNguon.getSoLuongKhaDung() < request.getSoLuong()) {
            throw new RuntimeException("Lỗi: Kho nguồn không đủ hàng để điều chuyển!");
        }

        tonKhoNguon.setSoLuongThucTe(tonKhoNguon.getSoLuongThucTe() - request.getSoLuong());
        tonKhoNguon.setSoLuongKhaDung(tonKhoNguon.getSoLuongKhaDung() - request.getSoLuong());
        inventoryRepository.save(tonKhoNguon);

        // 4. Xử lý cộng hàng vào Kho Đích
        Inventory tonKhoDich = inventoryRepository.findBySanPhamAndKhoHang(sanPham, khoDich)
                .orElse(new Inventory());

        if (tonKhoDich.getId() == null) {
            tonKhoDich.setSanPham(sanPham);
            tonKhoDich.setKhoHang(khoDich);
            tonKhoDich.setSoLuongThucTe(0);
            tonKhoDich.setSoLuongKhaDung(0);
        }

        tonKhoDich.setSoLuongThucTe(tonKhoDich.getSoLuongThucTe() + request.getSoLuong());
        tonKhoDich.setSoLuongKhaDung(tonKhoDich.getSoLuongKhaDung() + request.getSoLuong());
        inventoryRepository.save(tonKhoDich);

        // 5. Lưu lại lịch sử phiếu điều chuyển
        InventoryTransfer transfer = new InventoryTransfer();
        transfer.setMaDieuChuyen("DC-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        transfer.setKhoNguon(khoNguon);
        transfer.setKhoDich(khoDich);
        transfer.setSanPham(sanPham);
        transfer.setSoLuong(request.getSoLuong());
        transfer.setNgayDieuChuyen(LocalDateTime.now());
        transfer.setTrangThai("HOÀN THÀNH");

        return transferRepository.save(transfer);
    }
}