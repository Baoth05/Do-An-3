package com.ctut.wms.wmscoreservice.support;

import com.ctut.wms.wmscoreservice.entity.Inventory;
import com.ctut.wms.wmscoreservice.entity.Product;
import com.ctut.wms.wmscoreservice.entity.Warehouse;
import com.ctut.wms.wmscoreservice.repository.InventoryRepository;
import com.ctut.wms.wmscoreservice.repository.ProductRepository;
import com.ctut.wms.wmscoreservice.repository.WarehouseRepository;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.when;

/**
 * Dữ liệu & "kho trong bộ nhớ" dùng chung cho các test của wms-core-service.
 * Tồn kho được lưu trong Map nên test kiểm tra được chính xác số lượng sau mỗi nghiệp vụ.
 */
public final class TestFixtures {

    public final Map<Long, Warehouse> warehouses = new HashMap<>();
    public final Map<Long, Product> products = new HashMap<>();
    public final Map<String, Inventory> stock = new HashMap<>();

    /** Nối các repository mock vào dữ liệu trong bộ nhớ. */
    public TestFixtures(WarehouseRepository warehouseRepo, ProductRepository productRepo, InventoryRepository inventoryRepo) {
        when(warehouseRepo.findById(anyLong())).thenAnswer(i -> Optional.ofNullable(warehouses.get(i.<Long>getArgument(0))));
        when(warehouseRepo.findAll()).thenAnswer(i -> new java.util.ArrayList<>(warehouses.values()));
        when(productRepo.findById(anyLong())).thenAnswer(i -> Optional.ofNullable(products.get(i.<Long>getArgument(0))));
        when(inventoryRepo.findBySanPhamAndKhoHang(any(Product.class), any(Warehouse.class))).thenAnswer(i -> {
            Product p = i.getArgument(0);
            Warehouse w = i.getArgument(1);
            return Optional.ofNullable(stock.get(key(p.getId(), w.getId())));
        });
        when(inventoryRepo.save(any(Inventory.class))).thenAnswer(i -> {
            Inventory inv = i.getArgument(0);
            stock.put(key(inv.getSanPham().getId(), inv.getKhoHang().getId()), inv);
            return inv;
        });
    }

    private static String key(Long productId, Long warehouseId) {
        return productId + "@" + warehouseId;
    }

    public Warehouse warehouse(long id, String loaiHinh, Long quanLyId) {
        Warehouse w = Warehouse.builder().id(id).maKho("KHO-" + id).tenKho("Kho " + id)
                .loaiHinh(loaiHinh).quanLyId(quanLyId).diaChi("Cần Thơ").build();
        warehouses.put(id, w);
        return w;
    }

    public Product product(long id, double giaBan, Double giaNhap) {
        Product p = Product.builder().id(id).sku("SKU-" + id).tenSanPham("Sản phẩm " + id)
                .donViTinh("Cái").giaBan(giaBan).giaNhap(giaNhap).build();
        products.put(id, p);
        return p;
    }

    public Inventory stock(Product p, Warehouse w, int thucTe, int khaDung) {
        Inventory inv = new Inventory();
        inv.setId((long) (stock.size() + 1)); // bản ghi đã tồn tại trong CSDL thì luôn có id
        inv.setSanPham(p);
        inv.setKhoHang(w);
        inv.setSoLuongThucTe(thucTe);
        inv.setSoLuongKhaDung(khaDung);
        inv.setSoLuongDaBan(0);
        inv.setGiaBanHienTai(BigDecimal.valueOf(p.getGiaBan()));
        stock.put(key(p.getId(), w.getId()), inv);
        return inv;
    }

    public Inventory stockOf(Product p, Warehouse w) {
        return stock.get(key(p.getId(), w.getId()));
    }

    // ===================== Người dùng hiện tại (header từ Gateway) =====================

    public static void as(String role, Long userId) {
        MockHttpServletRequest req = new MockHttpServletRequest();
        req.addHeader("X-User-Role", role);
        req.addHeader("X-User-Account", role.toLowerCase() + (userId != null ? userId : ""));
        if (userId != null) req.addHeader("X-User-Id", String.valueOf(userId));
        RequestContextHolder.setRequestAttributes(new ServletRequestAttributes(req));
    }

    public static void clearUser() {
        RequestContextHolder.resetRequestAttributes();
    }
}
