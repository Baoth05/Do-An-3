package com.ctut.wms.wmscoreservice.service.warehouse;

import com.ctut.wms.wmscoreservice.entity.warehouse.Warehouse;
import com.ctut.wms.wmscoreservice.repository.warehouse.WarehouseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class WarehouseService {
    private final WarehouseRepository warehouseRepository;

    public Warehouse createWarehouse(Warehouse warehouse) {
        // Kiểm tra xem mã kho đã tồn tại chưa
        if (warehouseRepository.findByMaKho(warehouse.getMaKho()).isPresent()) {
            throw new RuntimeException("Lỗi: Mã kho này đã tồn tại!");
        }
        return warehouseRepository.save(warehouse);
    }

    public List<Warehouse> getAllWarehouses() {
        return warehouseRepository.findAll();
    }
}
