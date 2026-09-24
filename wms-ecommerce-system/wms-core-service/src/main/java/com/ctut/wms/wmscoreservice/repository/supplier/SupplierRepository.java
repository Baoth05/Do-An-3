package com.ctut.wms.wmscoreservice.repository.supplier;

import com.ctut.wms.wmscoreservice.entity.supplier.Supplier;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SupplierRepository extends JpaRepository<Supplier, Long> {
}