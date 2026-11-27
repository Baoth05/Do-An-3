package com.ctut.wms.wmscoreservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InventoryRequest {
    private Long sanPhamId;
    private Long khoHangId;
    private Integer soLuong;
    private BigDecimal giaBanHienTai;
    private Integer soLuongCanhBao;
    private Boolean dangBan;

    /**
     * Loại điều chỉnh kiểm kê nội bộ:
     * - KIEM_KE_THUA: Điều chỉnh tăng sau kiểm kê thực tế (chênh lệch thừa so với sổ sách)
     * - HOAN_TRA_NGUYEN_VEN: Nhập lại hàng hoàn trả nguyên vẹn vào kho
     */
    private String loaiDieuChinh;
    private String maChungTu;
    private String ghiChu;
}

