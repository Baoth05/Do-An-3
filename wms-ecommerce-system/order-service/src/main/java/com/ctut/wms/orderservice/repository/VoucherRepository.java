package com.ctut.wms.orderservice.repository;

import com.ctut.wms.orderservice.entity.Voucher;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VoucherRepository extends JpaRepository<Voucher, Long> {
    Optional<Voucher> findByMaVoucher(String maVoucher);
    List<Voucher> findByCuaHangId(Long cuaHangId);
    List<Voucher> findByCuaHangIdIsNull();
}
