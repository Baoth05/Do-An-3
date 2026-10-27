package com.ctut.wms.wmscoreservice.dto.importnote;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ImportNoteResponse {
    private Long id;
    private String maPhieuNhap;
    private LocalDateTime ngayNhap;
    private Long nhaCungCapId;
    private String tenNhaCungCap;
    private String diaChiNhaCungCap;
    private String sdtNhaCungCap;
    private Long khoHangId;
    private String tenKhoHang;
    private String diaChiKho;
    private Long donViVanChuyenId;
    private String tenDonViVanChuyen;
    private String nguoiTao;
    private String trangThai;
    private BigDecimal tongTienNhap;
    private List<ImportNoteDetailResponse> danhSachHangHoa;
}

