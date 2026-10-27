package com.ctut.wms.paymentservice.repository;

import com.ctut.wms.paymentservice.entity.GiaoDichCrypto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GiaoDichCryptoRepository extends JpaRepository<GiaoDichCrypto, Long> {
    Optional<GiaoDichCrypto> findByTxHash(String txHash);
    List<GiaoDichCrypto> findByDonHangId(Long donHangId);
    List<GiaoDichCrypto> findByMaGiaoDichGoc(String maGiaoDichGoc);
}

