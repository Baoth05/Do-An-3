/**
 * ==============================================================================
 * Service: WarehouseService
 * Phân hệ: WMS Core Service (Quản lý kho cốt lõi & Tồn kho 2 tầng - Port 8081)
 * Mô tả: Cung cấp logic nghiệp vụ, giao dịch cơ sở dữ liệu và xử lý dữ liệu cho WarehouseService.
 * ==============================================================================
 */
package com.ctut.wms.wmscoreservice.service;

import com.ctut.wms.wmscoreservice.entity.Warehouse;
import com.ctut.wms.wmscoreservice.repository.WarehouseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class WarehouseService {
    private final WarehouseRepository warehouseRepository;

    public Warehouse createWarehouse(Warehouse warehouse) {
        if (warehouseRepository.findByMaKho(warehouse.getMaKho()).isPresent()) {
            throw new RuntimeException("Lỗi: Mã kho / mã gian hàng đã tồn tại!");
        }
        if (warehouse.getLoaiHinh() == null) {
            warehouse.setLoaiHinh("KHO_CUA_HANG");
        }
        return warehouseRepository.save(warehouse);
    }

    public List<Warehouse> getAllWarehouses() {
        return warehouseRepository.findAll();
    }

    public List<Warehouse> getStores() {
        return warehouseRepository.findByLoaiHinh("KHO_CUA_HANG");
    }

    public Warehouse getCentralWarehouse() {
        List<Warehouse> all = warehouseRepository.findAll();
        return all.stream()
                .filter(w -> "KHO_TONG".equalsIgnoreCase(w.getLoaiHinh()))
                .findFirst()
                .or(() -> all.stream().filter(w -> w.getMaKho() != null && w.getMaKho().startsWith("KHO-")).findFirst())
                .or(() -> all.stream().findFirst())
                .orElseThrow(() -> new RuntimeException("Lỗi: Không tìm thấy Kho Tổng trong hệ thống!"));
    }

    public Optional<Warehouse> getStoreByManager(Long quanLyId) {
        return warehouseRepository.findByQuanLyId(quanLyId);
    }

    public Warehouse getWarehouseById(Long id) {
        return warehouseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Lỗi: Không tìm thấy kho/gian hàng có ID = " + id));
    }

    @Transactional
    public Warehouse updateWarehouse(Long id, Warehouse warehouse) {
        Warehouse existing = getWarehouseById(id);
        if (warehouse.getTenKho() != null) {
            existing.setTenKho(warehouse.getTenKho());
        }
        if (warehouse.getDiaChi() != null) {
            existing.setDiaChi(warehouse.getDiaChi());
        }
        if (warehouse.getSoDienThoai() != null) {
            existing.setSoDienThoai(warehouse.getSoDienThoai());
        }
        if (warehouse.getEmail() != null) {
            existing.setEmail(warehouse.getEmail());
        }
        if (warehouse.getSucChuaToiDa() != null) {
            existing.setSucChuaToiDa(warehouse.getSucChuaToiDa());
        }
        if (warehouse.getTrangThai() != null) {
            existing.setTrangThai(warehouse.getTrangThai());
        }
        if (warehouse.getMoTaGianHang() != null) {
            existing.setMoTaGianHang(warehouse.getMoTaGianHang());
        }
        if (warehouse.getAnhDaiDienShop() != null) {
            existing.setAnhDaiDienShop(warehouse.getAnhDaiDienShop());
        }
        if (warehouse.getAnhBiaShop() != null) {
            existing.setAnhBiaShop(warehouse.getAnhBiaShop());
        }
        if (warehouse.getGioMoCua() != null) {
            existing.setGioMoCua(warehouse.getGioMoCua());
        }
        if (warehouse.getWebsiteHoacMangXaHoi() != null) {
            existing.setWebsiteHoacMangXaHoi(warehouse.getWebsiteHoacMangXaHoi());
        }
        if (warehouse.getChinhSachBaoHanh() != null) {
            existing.setChinhSachBaoHanh(warehouse.getChinhSachBaoHanh());
        }
        if (warehouse.getChinhSachGiaoHang() != null) {
            existing.setChinhSachGiaoHang(warehouse.getChinhSachGiaoHang());
        }
        if (warehouse.getHinhAnhCuaHang() != null) {
            existing.setHinhAnhCuaHang(warehouse.getHinhAnhCuaHang());
        }
        if (warehouse.getLoaiHinh() != null) {
            existing.setLoaiHinh(warehouse.getLoaiHinh());
        }
        if (warehouse.getQuanLyId() != null) {
            existing.setQuanLyId(warehouse.getQuanLyId());
        }
        return warehouseRepository.save(existing);
    }

    @Transactional
    public void deleteWarehouse(Long id) {
        Warehouse existing = getWarehouseById(id);
        warehouseRepository.delete(existing);
    }
}
