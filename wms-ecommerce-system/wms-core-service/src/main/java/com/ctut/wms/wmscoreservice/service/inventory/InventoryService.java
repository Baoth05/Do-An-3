package com.ctut.wms.wmscoreservice.service.inventory;

import com.ctut.wms.wmscoreservice.dto.inventory.InventoryRequest;
import com.ctut.wms.wmscoreservice.dto.inventory.InventoryResponse;
import com.ctut.wms.wmscoreservice.entity.inventory.Inventory;
import com.ctut.wms.wmscoreservice.entity.product.Product;
import com.ctut.wms.wmscoreservice.entity.warehouse.Warehouse;
import com.ctut.wms.wmscoreservice.repository.inventory.InventoryRepository;
import com.ctut.wms.wmscoreservice.repository.product.ProductRepository;
import com.ctut.wms.wmscoreservice.repository.warehouse.WarehouseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class InventoryService {
    private final InventoryRepository inventoryRepository;
    private final ProductRepository productRepository;
    private final WarehouseRepository warehouseRepository;

    @Transactional
    public InventoryResponse addStock(InventoryRequest request) {
        Product product = productRepository.findById(request.getSanPhamId())
                .orElseThrow(() -> new RuntimeException("Lỗi: Không tìm thấy sản phẩm!"));

        Warehouse warehouse = warehouseRepository.findById(request.getKhoHangId())
                .orElseThrow(() -> new RuntimeException("Lỗi: Không tìm thấy kho hàng!"));

        Inventory inventory = inventoryRepository.findBySanPhamAndKhoHang(product, warehouse)
                .orElse(new Inventory());

        if (inventory.getId() == null) {
            inventory.setSanPham(product);
            inventory.setKhoHang(warehouse);
            inventory.setSoLuongThucTe(0);
            inventory.setSoLuongKhaDung(0);
            if (product.getGiaBan() != null) {
                inventory.setGiaBanHienTai(BigDecimal.valueOf(product.getGiaBan()));
            }
        }

        inventory.setSoLuongThucTe(inventory.getSoLuongThucTe() + request.getSoLuong());
        inventory.setSoLuongKhaDung(inventory.getSoLuongKhaDung() + request.getSoLuong());
        Inventory saved = inventoryRepository.save(inventory);

        return mapToResponse(saved);
    }

    public List<InventoryResponse> getAllInventory() {
        return inventoryRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<InventoryResponse> getInventoryByWarehouse(Long khoHangId) {
        return inventoryRepository.findByKhoHangId(khoHangId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<InventoryResponse> getMarketplaceProducts() {
        return inventoryRepository.findByDangBanTrueAndSoLuongThucTeGreaterThan(0).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public InventoryResponse updateThresholds(Long id, Integer min, Integer max) {
        Inventory inv = inventoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Lỗi: Không tìm thấy bản ghi tồn kho!"));
        if (min != null) inv.setSoLuongToiThieu(min);
        if (max != null) inv.setSoLuongToiDa(max);
        return mapToResponse(inventoryRepository.save(inv));
    }

    @Transactional
    public InventoryResponse publishToMarketplace(Long id, Boolean dangBan, BigDecimal giaBanHienTai, Integer soLuongCanhBao) {
        Inventory inv = inventoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Lỗi: Không tìm thấy bản ghi tồn kho có ID = " + id));
        if (dangBan != null) {
            inv.setDangBan(dangBan);
        }
        if (giaBanHienTai != null) {
            inv.setGiaBanHienTai(giaBanHienTai);
        }
        if (soLuongCanhBao != null) {
            inv.setSoLuongCanhBao(soLuongCanhBao);
        }
        return mapToResponse(inventoryRepository.save(inv));
    }

    private InventoryResponse mapToResponse(Inventory inv) {
        Product p = inv.getSanPham();
        Warehouse w = inv.getKhoHang();

        return InventoryResponse.builder()
                .id(inv.getId())
                .sanPhamId(p != null ? p.getId() : null)
                .sku(p != null ? p.getSku() : "")
                .tenSanPham(p != null ? p.getTenSanPham() : "")
                .donViTinh(p != null ? p.getDonViTinh() : "")
                .giaBan(p != null ? p.getGiaBan() : null)
                .khoHangId(w != null ? w.getId() : null)
                .tenKho(w != null ? w.getTenKho() : "")
                .maKho(w != null ? w.getMaKho() : "")
                .tenShop(w != null ? w.getTenKho() : "")
                .moTaShop(w != null ? w.getMoTaGianHang() : "")
                .logoShop(w != null ? w.getAnhDaiDienShop() : "")
                .soLuongThucTe(inv.getSoLuongThucTe())
                .soLuongKhaDung(inv.getSoLuongKhaDung())
                .soLuongToiThieu(inv.getSoLuongToiThieu())
                .soLuongToiDa(inv.getSoLuongToiDa())
                .giaBanHienTai(inv.getGiaBanHienTai() != null ? inv.getGiaBanHienTai() : (p != null && p.getGiaBan() != null ? BigDecimal.valueOf(p.getGiaBan()) : BigDecimal.ZERO))
                .soLuongDaBan(inv.getSoLuongDaBan() != null ? inv.getSoLuongDaBan() : 0)
                .dangBan(Boolean.TRUE.equals(inv.getDangBan()))
                .hinhAnh(p != null ? p.getHinhAnh() : "")
                .moTa(p != null ? p.getMoTa() : "")
                .danhMuc(p != null && p.getDanhMuc() != null ? p.getDanhMuc().getTenDanhMuc() : "")
                .build();
    }
}
