package com.ctut.wms.wmscoreservice.service;

import com.ctut.wms.wmscoreservice.dto.InventoryRequest;
import com.ctut.wms.wmscoreservice.dto.InventoryResponse;
import com.ctut.wms.wmscoreservice.entity.Inventory;
import com.ctut.wms.wmscoreservice.entity.Product;
import com.ctut.wms.wmscoreservice.entity.TheKho;
import com.ctut.wms.wmscoreservice.entity.Warehouse;
import com.ctut.wms.wmscoreservice.repository.InventoryRepository;
import com.ctut.wms.wmscoreservice.repository.ProductRepository;
import com.ctut.wms.wmscoreservice.repository.TheKhoRepository;
import com.ctut.wms.wmscoreservice.repository.WarehouseRepository;
import com.ctut.wms.wmscoreservice.security.StoreAccess;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class InventoryService {

    public static final String ADJ_KIEM_KE_THUA = "KIEM_KE_THUA";
    public static final String ADJ_HOAN_TRA_NGUYEN_VEN = "HOAN_TRA_NGUYEN_VEN";
    private static final Set<String> VALID_ADJUSTMENT_TYPES = Set.of(ADJ_KIEM_KE_THUA, ADJ_HOAN_TRA_NGUYEN_VEN);

    private final InventoryRepository inventoryRepository; // Quản lý dữ liệu bảng tồn kho
    private final ProductRepository productRepository;     // Quản lý dữ liệu sản phẩm
    private final WarehouseRepository warehouseRepository; // Quản lý dữ liệu kho bãi
    private final TheKhoRepository theKhoRepository;       // Quản lý lịch sử thẻ kho vật lý

    /**
     * Điều chỉnh tăng tồn kho nội bộ (NHẬP BỔ SUNG):
     * Chỉ dùng cho nghiệp vụ kiểm kê thực tế thừa so với sổ sách hoặc nhập hàng hoàn trả nguyên vẹn vào kho.
     * Tách biệt hoàn toàn với luồng nhập thương mại từ Nhà cung cấp (ImportNote) và luồng cấp hàng B2B sang Cửa hàng (SupplyContract).
     */
    @Transactional
    public InventoryResponse addStock(InventoryRequest request) {
        Product product = productRepository.findById(request.getSanPhamId())
                .orElseThrow(() -> new RuntimeException("Lỗi: Không tìm thấy sản phẩm!"));

        Warehouse warehouse = warehouseRepository.findById(request.getKhoHangId())
                .orElseThrow(() -> new RuntimeException("Lỗi: Không tìm thấy kho hàng!"));
        StoreAccess.requireCanManage(warehouse);

        if (request.getSoLuong() == null || request.getSoLuong() <= 0) {
            throw new RuntimeException("Lỗi: Số lượng điều chỉnh phải lớn hơn 0!");
        }

        String adjType = request.getLoaiDieuChinh() != null && !request.getLoaiDieuChinh().isBlank()
                ? request.getLoaiDieuChinh().trim().toUpperCase()
                : ADJ_KIEM_KE_THUA;
        if (!VALID_ADJUSTMENT_TYPES.contains(adjType)) {
            throw new RuntimeException(
                "Lỗi nghiệp vụ: Endpoint /inventory/add (NHẬP BỔ SUNG) chỉ dùng cho điều chỉnh tăng kiểm kê (KIEM_KE_THUA) " +
                "hoặc hàng hoàn trả nguyên vẹn (HOAN_TRA_NGUYEN_VEN). Nhập hàng từ Nhà cung cấp phải qua Phiếu Nhập Kho!"
            );
        }

        Optional<Inventory> existingOpt = inventoryRepository.findBySanPhamAndKhoHang(product, warehouse);
        if ("KHO_CUA_HANG".equalsIgnoreCase(warehouse.getLoaiHinh()) && existingOpt.isEmpty()) {
            throw new RuntimeException(
                "Lỗi nghiệp vụ: Kho cửa hàng chỉ tiếp nhận hàng hóa mới thông qua Hợp đồng cung ứng B2B từ Kho Tổng! " +
                "Không thể thêm mặt hàng mới qua điều chỉnh kiểm kê (POST /inventory/add)."
            );
        }

        Inventory inventory = existingOpt.orElse(new Inventory());
        if (inventory.getId() == null) {
            inventory.setSanPham(product);
            inventory.setKhoHang(warehouse);
            inventory.setSoLuongThucTe(0);
            inventory.setSoLuongKhaDung(0);
            if (product.getGiaBan() != null) {
                inventory.setGiaBanHienTai(BigDecimal.valueOf(product.getGiaBan()));
            }
        }

        int soLuongCu = inventory.getSoLuongThucTe();
        int addQty = request.getSoLuong();
        inventory.setSoLuongThucTe(soLuongCu + addQty);
        inventory.setSoLuongKhaDung(inventory.getSoLuongKhaDung() + addQty);
        Inventory saved = inventoryRepository.save(inventory);

        String voucherPrefix = ADJ_HOAN_TRA_NGUYEN_VEN.equals(adjType) ? "HT-" : "KK-";
        String maChungTu = request.getMaChungTu() != null && !request.getMaChungTu().isBlank()
                ? request.getMaChungTu().trim()
                : voucherPrefix + (System.currentTimeMillis() % 1000000);
        if (maChungTu.length() > 50) {
            maChungTu = maChungTu.substring(0, 50);
        }

        // Ghi nhận biến động thẻ kho
        TheKho theKho = new TheKho();
        theKho.setHangHoa(product);
        theKho.setKhoCuaHang(warehouse);
        theKho.setLoaiGiaoDich("NHẬP BỔ SUNG");
        theKho.setMaChungTu(maChungTu);
        theKho.setSoLuongTruocBienDong(soLuongCu);
        theKho.setSoLuongBienDong(addQty);
        theKho.setSoLuongSauBienDong(saved.getSoLuongThucTe());
        theKho.setNgayTao(LocalDateTime.now());
        theKhoRepository.save(theKho);

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
        return inventoryRepository.findByDangBanTrueAndSoLuongKhaDungGreaterThan(0).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    // Tra cứu 1 mặt hàng của 1 gian hàng (order-service dùng để lấy GIÁ BÁN THẬT khi đặt hàng)
    public InventoryResponse getItem(Long sanPhamId, Long khoHangId) {
        Inventory inv = inventoryRepository.findBySanPhamIdAndKhoHangId(sanPhamId, khoHangId)
                .orElseThrow(() -> new RuntimeException("Lỗi: Gian hàng không bán sản phẩm ID = " + sanPhamId));
        return mapToResponse(inv);
    }

    // Hàm cập nhật ngưỡng an toàn tối thiểu và tối đa
    @Transactional
    public InventoryResponse updateThresholds(Long id, Integer min, Integer max) {
        Inventory inv = inventoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Lỗi: Không tìm thấy bản ghi tồn kho!"));
        StoreAccess.requireCanManage(inv.getKhoHang());
        if (min != null) inv.setSoLuongToiThieu(min);
        if (max != null) inv.setSoLuongToiDa(max);
        return mapToResponse(inventoryRepository.save(inv));
    }

    // Hàm cho phép Seller bật/tắt bán lên sàn và định giá bán lẻ
    @Transactional
    public InventoryResponse publishToMarketplace(Long id, Boolean dangBan, BigDecimal giaBanHienTai, Integer soLuongCanhBao) {
        Inventory inv = inventoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Lỗi: Không tìm thấy bản ghi tồn kho có ID = " + id));
        StoreAccess.requireCanManage(inv.getKhoHang());
        if (giaBanHienTai != null && giaBanHienTai.compareTo(BigDecimal.ZERO) <= 0) {
            throw new RuntimeException("Lỗi: Giá bán phải lớn hơn 0!");
        }
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
