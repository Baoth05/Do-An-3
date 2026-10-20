package com.ctut.wms.paymentservice.repository;

import com.ctut.wms.paymentservice.entity.GiaoDichMoMo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface GiaoDichMoMoRepository extends JpaRepository<GiaoDichMoMo, Long> {
    Optional<GiaoDichMoMo> findByMomoOrderId(String momoOrderId);
    Optional<GiaoDichMoMo> findByDonHangId(String donHangId);
}