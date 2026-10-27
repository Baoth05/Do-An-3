package com.ctut.wms.wmscoreservice.service.transfer;

import com.ctut.wms.wmscoreservice.dto.transfer.InventoryTransferRequest;
import com.ctut.wms.wmscoreservice.dto.transfer.InventoryTransferResponse;
import com.ctut.wms.wmscoreservice.entity.inventory.Inventory;
import com.ctut.wms.wmscoreservice.entity.product.Product;
import com.ctut.wms.wmscoreservice.entity.transfer.InventoryTransfer;
import com.ctut.wms.wmscoreservice.entity.warehouse.Warehouse;
import com.ctut.wms.wmscoreservice.repository.inventory.InventoryRepository;
import com.ctut.wms.wmscoreservice.repository.product.ProductRepository;
import com.ctut.wms.wmscoreservice.repository.transfer.InventoryTransferRepository;
import com.ctut.wms.wmscoreservice.repository.warehouse.WarehouseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class InventoryTransferService {

    private final InventoryTransferRepository transferRepository;
    private final InventoryRepository inventoryRepository;
    private final WarehouseRepository warehouseRepository;
    private final ProductRepository productRepository;

    @Transactional
    public InventoryTransferResponse transferStock(InventoryTransferRequest request) {
        if (request.getKhoNguonId().equals(request.getKhoDichId())) {
            throw new RuntimeException("Lỗi: Kho nguồn và kho đích không được trùng nhau!");
        }

        Warehouse khoNguon = warehouseRepository.findById(request.getKhoNguonId())
                .orElseThrow(() -> new RuntimeException("Lỗi: Không tìm thấy Kho nguồn!"));
        Warehouse khoDich = warehouseRepository.findById(request.getKhoDichId())
                .orElseThrow(() -> new RuntimeException("Lỗi: Không tìm thấy Kho đích!"));
        Product sanPham = productRepository.findById(request.getSanPhamId())
                .orElseThrow(() -> new RuntimeException("Lỗi: Không tìm thấy Sản phẩm!"));

        Inventory tonKhoNguon = inventoryRepository.findBySanPhamAndKhoHang(sanPham, khoNguon)
                .orElseThrow(() -> new RuntimeException("Lỗi: Sản phẩm không tồn tại trong Kho nguồn!"));

        if (tonKhoNguon.getSoLuongKhaDung() < request.getSoLuong()) {
            throw new RuntimeException("Lỗi: Kho nguồn không đủ hàng để điều chuyển! Khả dụng: " + tonKhoNguon.getSoLuongKhaDung());
        }

        tonKhoNguon.setSoLuongThucTe(tonKhoNguon.getSoLuongThucTe() - request.getSoLuong());
        tonKhoNguon.setSoLuongKhaDung(tonKhoNguon.getSoLuongKhaDung() - request.getSoLuong());
        inventoryRepository.save(tonKhoNguon);

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

        InventoryTransfer transfer = new InventoryTransfer();
        transfer.setMaDieuChuyen("DC-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        transfer.setKhoNguon(khoNguon);
        transfer.setKhoDich(khoDich);
        transfer.setSanPham(sanPham);
        transfer.setSoLuong(request.getSoLuong());
        transfer.setNgayDieuChuyen(LocalDateTime.now());
        transfer.setTrangThai("HOÀN THÀNH");

        return mapToResponse(transferRepository.save(transfer));
    }

    public List<InventoryTransferResponse> getAllTransfers() {
        return transferRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public InventoryTransferResponse getTransferById(Long id) {
        InventoryTransfer transfer = transferRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Lỗi: Không tìm thấy phiếu chuyển kho có ID = " + id));
        return mapToResponse(transfer);
    }

    private InventoryTransferResponse mapToResponse(InventoryTransfer t) {
        Warehouse kn = t.getKhoNguon();
        Warehouse kd = t.getKhoDich();
        Product sp = t.getSanPham();

        return InventoryTransferResponse.builder()
                .id(t.getId())
                .maDieuChuyen(t.getMaDieuChuyen())
                .khoNguonId(kn != null ? kn.getId() : null)
                .tenKhoNguon(kn != null ? kn.getTenKho() : "Chưa xác định")
                .khoDichId(kd != null ? kd.getId() : null)
                .tenKhoDich(kd != null ? kd.getTenKho() : "Chưa xác định")
                .sanPhamId(sp != null ? sp.getId() : null)
                .sku(sp != null ? sp.getSku() : "")
                .tenSanPham(sp != null ? sp.getTenSanPham() : "")
                .donViTinh(sp != null ? sp.getDonViTinh() : "")
                .soLuong(t.getSoLuong())
                .ngayDieuChuyen(t.getNgayDieuChuyen())
                .trangThai(t.getTrangThai())
                .build();
    }
}
