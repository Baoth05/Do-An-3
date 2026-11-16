package com.ctut.wms.orderservice.service;

import com.ctut.wms.orderservice.entity.Voucher;
import com.ctut.wms.orderservice.repository.VoucherRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class VoucherService {

    // Spring tự động tiêm (inject) VoucherRepository nhờ annotation @RequiredArgsConstructor
    private final VoucherRepository voucherRepository;

    /**
     * Lấy danh sách toàn bộ voucher của các cửa hàng.
     * @return Danh sách Voucher
     */
    public List<Voucher> findAllStoreVouchers() {
        return voucherRepository.findByCuaHangIdIsNotNull();
    }
}