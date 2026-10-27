package com.ctut.wms.paymentservice.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "giao_dich_crypto")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GiaoDichCrypto {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "don_hang_id")
    private Long donHangId; // Logical FK Nullable tham chiếu don_hang

    @Column(name = "ma_giao_dich_goc", length = 50)
    private String maGiaoDichGoc; // Thanh toán gộp 1 lần cho nhiều đơn tách từ giỏ hàng đa shop

    @Column(name = "tx_hash", length = 100, unique = true, nullable = false)
    private String txHash; // Mã băm giao dịch trên Blockchain

    @Column(name = "wallet_address", length = 100, nullable = false)
    private String walletAddress; // Địa chỉ ví người thanh toán

    @Column(name = "so_tien", nullable = false)
    private BigDecimal soTien; // Số lượng Token thanh toán (VD: USDT)

    @Column(name = "token_symbol", length = 10, nullable = false)
    private String tokenSymbol; // USDT, ETH, BNB...

    @Column(name = "chain_id", nullable = false)
    private Integer chainId; // 1 (Ethereum), 56 (BNB Smart Chain), 137 (Polygon)

    @Column(name = "trang_thai_giao_dich", length = 30, nullable = false)
    @Builder.Default
    private String trangThaiGiaoDich = "PENDING"; // PENDING, SUCCESS, REVERTED, INVALID

    @Column(name = "ngay_tao")
    @Builder.Default
    private LocalDateTime ngayTao = LocalDateTime.now();

    @Column(name = "ngay_cap_nhat")
    @Builder.Default
    private LocalDateTime ngayCapNhat = LocalDateTime.now();
}

