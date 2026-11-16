package com.ctut.wms.wmscoreservice.repository;

import com.ctut.wms.wmscoreservice.entity.SupplyContract;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SupplyContractRepository extends JpaRepository<SupplyContract, Long> {
    List<SupplyContract> findAllByOrderByNgayTaoDesc();
    List<SupplyContract> findByStoreIdOrderByNgayTaoDesc(Long storeId);
    boolean existsByMaHopDong(String maHopDong);
}
