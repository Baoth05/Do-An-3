package com.ctut.wms.wmscoreservice.controller;

import com.ctut.wms.wmscoreservice.service.FinanceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping({"/finance", "/wms/finance"})
@CrossOrigin("*")
@RequiredArgsConstructor
public class FinanceController {

    private final FinanceService financeService; // Dùng Service thay vì Repository

    // API lấy dữ liệu tổng quan thu chi lợi nhuận
    @GetMapping("/summary")
    public ResponseEntity<?> getSummary(@RequestParam(required = false) Integer month,
                                        @RequestParam(required = false) Integer year) {
        return ResponseEntity.ok(financeService.getFinancialSummary());
    }

    // API lấy dữ liệu biểu đồ tài chính 6 tháng
    @GetMapping("/chart")
    public ResponseEntity<?> getChartData() {
        return ResponseEntity.ok(financeService.getChartData());
    }

    // API lấy danh sách nhật ký giao dịch tài chính
    @GetMapping("/transactions")
    public ResponseEntity<?> getTransactions(@RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(financeService.getTransactions(limit));
    }

    // API lấy dữ liệu Báo cáo & Thống kê Chiến Lược
    @GetMapping("/strategic-report")
    public ResponseEntity<?> getStrategicReport() {
        return ResponseEntity.ok(financeService.getStrategicReport());
    }
}
