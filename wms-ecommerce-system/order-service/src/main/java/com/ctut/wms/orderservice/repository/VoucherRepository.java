package com.ctut.wms.orderservice.repository;

import com.ctut.wms.orderservice.entity.Voucher;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface VoucherRepository extends JpaRepository<Voucher, Long> {
    // Hàm hỗ trợ tìm Voucher bằng mã chữ (Ví dụ: "SALE50")
    Optional<Voucher> findByMaVoucher(String maVoucher);
}