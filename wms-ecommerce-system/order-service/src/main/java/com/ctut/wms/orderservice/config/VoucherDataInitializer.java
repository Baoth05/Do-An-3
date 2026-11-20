package com.ctut.wms.orderservice.config;

import com.ctut.wms.orderservice.entity.Voucher;
import com.ctut.wms.orderservice.repository.VoucherRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class VoucherDataInitializer implements CommandLineRunner {

    private final VoucherRepository voucherRepository;

    @org.springframework.beans.factory.annotation.Value("${app.seed.demo-vouchers:false}")
    private boolean seedDemoVouchers;

    @Override
    public void run(String... args) {
        // Mặc định KHÔNG nạp voucher mẫu; bật SEED_DEMO_VOUCHERS=true khi cần dữ liệu demo
        if (!seedDemoVouchers) {
            return;
        }
        initDefaultVouchers();
    }

    private void initDefaultVouchers() {
        createIfNotExists("CTUT50K", null, 10, BigDecimal.valueOf(50000), BigDecimal.valueOf(150000), 500);
        createIfNotExists("CTUTNEW50", null, 15, BigDecimal.valueOf(50000), BigDecimal.valueOf(150000), 500);
        createIfNotExists("FREESHIP", null, 100, BigDecimal.valueOf(30000), BigDecimal.valueOf(200000), 1000);
        createIfNotExists("TECHPRO10", null, 10, BigDecimal.valueOf(200000), BigDecimal.valueOf(1000000), 200);

        // Shop Vouchers (Store 1: Apple Store, Store 2: Gaming Hub, Store 3: ROG)
        createIfNotExists("SHOP1OFF10", 1L, 10, BigDecimal.valueOf(100000), BigDecimal.valueOf(200000), 100);
        createIfNotExists("FREESHIP1", 1L, 100, BigDecimal.valueOf(30000), BigDecimal.valueOf(150000), 100);

        createIfNotExists("SHOP2OFF10", 2L, 10, BigDecimal.valueOf(100000), BigDecimal.valueOf(200000), 100);
        createIfNotExists("GAMING20K", 2L, 10, BigDecimal.valueOf(50000), BigDecimal.valueOf(300000), 100);

        createIfNotExists("SHOP3OFF10", 3L, 10, BigDecimal.valueOf(150000), BigDecimal.valueOf(500000), 100);
        createIfNotExists("ROGSALE50", 3L, 15, BigDecimal.valueOf(200000), BigDecimal.valueOf(1000000), 100);

        log.info("Khởi tạo dữ liệu Voucher mặc định cho Order Service hoàn tất!");
    }

    private void createIfNotExists(String code, Long cuaHangId, Integer pct, BigDecimal max, BigDecimal minOrder, Integer qty) {
        if (voucherRepository.findByMaVoucher(code).isEmpty()) {
            Voucher v = new Voucher();
            v.setMaVoucher(code);
            v.setCuaHangId(cuaHangId);
            v.setPhanTramGiam(pct);
            v.setGiamToiDa(max);
            v.setDonHangToiThieu(minOrder);
            v.setSoLuongConLai(qty);
            v.setNgayBatDau(LocalDateTime.now().minusDays(1));
            v.setNgayHetHan(LocalDateTime.now().plusMonths(12));
            voucherRepository.save(v);
            log.info("-> Đã nạp Voucher: {} (Cửa hàng: {})", code, cuaHangId != null ? cuaHangId : "Toàn sàn");
        }
    }
}
