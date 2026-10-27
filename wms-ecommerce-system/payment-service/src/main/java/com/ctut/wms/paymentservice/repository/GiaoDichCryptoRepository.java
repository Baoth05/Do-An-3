/**
 * ==============================================================================
 * Repository: GiaoDichCryptoRepository
 * Phân hệ: Payment Service (Cổng thanh toán MoMo VietQR & Web3 Crypto - Port 8085)
 * Mô tả: Giao diện truy vấn dữ liệu Spring Data JPA thao tác với cơ sở dữ liệu cho GiaoDichCryptoRepository.
 * ==============================================================================
 */
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

