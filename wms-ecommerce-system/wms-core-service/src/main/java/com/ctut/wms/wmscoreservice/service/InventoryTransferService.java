package com.ctut.wms.wmscoreservice.service;

import com.ctut.wms.wmscoreservice.dto.InventoryTransferRequest;
import com.ctut.wms.wmscoreservice.entity.Inventory;
import com.ctut.wms.wmscoreservice.entity.InventoryTransfer;
import com.ctut.wms.wmscoreservice.entity.Product;
import com.ctut.wms.wmscoreservice.entity.Warehouse;
import com.ctut.wms.wmscoreservice.repository.InventoryRepository;
import com.ctut.wms.wmscoreservice.repository.InventoryTransferRepository;
import com.ctut.wms.wmscoreservice.repository.ProductRepository;
import com.ctut.wms.wmscoreservice.repository.WarehouseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class InventoryTransferService {

    private final InventoryTransferRepository transferRepository; // Lưu lịch sử phiếu điều chuyển
    private final InventoryRepository inventoryRepository;         // Cập nhật số lượng tồn kho
    private final WarehouseRepository warehouseRepository;         // Thông tin kho nguồn & kho đích
    private final ProductRepository productRepository;             // Thông tin sản phẩm điều chuyển

    // Hàm thực hiện điều chuyển tồn kho giữa 2 kho bãi
    @Transactional
    public InventoryTransfer transferStock(InventoryTransferRequest request) {
        if (request.getKhoNguonId().equals(request.getKhoDichId())) {
            throw new RuntimeException("Lỗi: Kho nguồn và kho đích không được trùng nhau!");
        }

        Warehouse khoNguon = warehouseRepository.findById(request.getKhoNguonId())
                .orElseThrow(() -> new RuntimeException("Lỗi: Không tìm thấy Kho nguồn!"));
        Warehouse khoDich = warehouseRepository.findById(request.getKhoDichId())
                .orElseThrow(() -> new RuntimeException("Lỗi: Không tìm thấy Kho đích!"));
        Product sanPham = productRepository.findById(request.getSanPhamId())
                .orElseThrow(() -> new RuntimeException("Lỗi: Không tìm thấy Sản phẩm!"));

        // Trừ tồn kho ở Kho Nguồn
        Inventory tonKhoNguon = inventoryRepository.findBySanPhamAndKhoHang(sanPham, khoNguon)
                .orElseThrow(() -> new RuntimeException("Lỗi: Sản phẩm không tồn tại trong Kho nguồn!"));

        if (tonKhoNguon.getSoLuongKhaDung() < request.getSoLuong()) {
            throw new RuntimeException("Lỗi: Kho nguồn không đủ hàng để điều chuyển!");
        }

        tonKhoNguon.setSoLuongThucTe(tonKhoNguon.getSoLuongThucTe() - request.getSoLuong());
        tonKhoNguon.setSoLuongKhaDung(tonKhoNguon.getSoLuongKhaDung() - request.getSoLuong());
        inventoryRepository.save(tonKhoNguon);

        // Cộng tồn kho vào Kho Đích
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

        // Tạo chứng từ phiếu điều chuyển
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

    // Hàm lấy danh sách tất cả các phiếu điều chuyển kho
    public List<InventoryTransfer> getAllTransfers() {
        return transferRepository.findAllByOrderByNgayDieuChuyenDesc();
    }
}

