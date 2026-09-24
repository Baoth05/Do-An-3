package com.ctut.wms.wmscoreservice.repository.transfer;

import com.ctut.wms.wmscoreservice.entity.transfer.InventoryTransfer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface InventoryTransferRepository extends JpaRepository<InventoryTransfer, Long> {
}