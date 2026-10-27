package com.ctut.wms.wmscoreservice.service;

import com.ctut.wms.wmscoreservice.dto.InventoryRequest;
import com.ctut.wms.wmscoreservice.dto.InventoryResponse;
import com.ctut.wms.wmscoreservice.entity.Inventory;
import com.ctut.wms.wmscoreservice.entity.Product;
import com.ctut.wms.wmscoreservice.entity.Warehouse;
import com.ctut.wms.wmscoreservice.repository.InventoryRepository;
import com.ctut.wms.wmscoreservice.repository.ProductRepository;
import com.ctut.wms.wmscoreservice.repository.WarehouseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class InventoryService {

    private final InventoryRepository inventoryRepository; // Quản lý dữ liệu bảng tồn kho
    private final ProductRepository productRepository;     // Quản lý dữ liệu sản phẩm
    private final WarehouseRepository warehouseRepository; // Quản lý dữ liệu kho bãi

    // Hàm thêm/cộng số lượng hàng vào kho
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

        int addQty = request.getSoLuong() != null ? request.getSoLuong() : 0;
        inventory.setSoLuongThucTe(inventory.getSoLuongThucTe() + addQty);
        inventory.setSoLuongKhaDung(inventory.getSoLuongKhaDung() + addQty);
        Inventory saved = inventoryRepository.save(inventory);

        return mapToResponse(saved);
    }

    // Hàm lấy danh sách tất cả tồn kho
    public List<InventoryResponse> getAllInventory() {
        return inventoryRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    // Hàm lấy tồn kho theo kho bãi hoặc gian hàng cụ thể
    public List<InventoryResponse> getInventoryByWarehouse(Long khoHangId) {
        return inventoryRepository.findByKhoHangId(khoHangId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    // Hàm lấy danh sách sản phẩm đang mở bán trên sàn TMĐT tập trung
    public List<InventoryResponse> getMarketplaceProducts() {
        return inventoryRepository.findByDangBanTrueAndSoLuongThucTeGreaterThan(0).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    // Hàm cập nhật ngưỡng an toàn tối thiểu và tối đa
    @Transactional
    public InventoryResponse updateThresholds(Long id, Integer min, Integer max) {
        Inventory inv = inventoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Lỗi: Không tìm thấy bản ghi tồn kho!"));
        if (min != null) inv.setSoLuongToiThieu(min);
        if (max != null) inv.setSoLuongToiDa(max);
        return mapToResponse(inventoryRepository.save(inv));
    }

    // Hàm cho phép Seller bật/tắt bán lên sàn và định giá bán lẻ
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
            inv.setSoLuongToiThieu(soLuongCanhBao);
        }
        return mapToResponse(inventoryRepository.save(inv));
    }

    // Chuyển đổi Entity Inventory sang DTO Response
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

