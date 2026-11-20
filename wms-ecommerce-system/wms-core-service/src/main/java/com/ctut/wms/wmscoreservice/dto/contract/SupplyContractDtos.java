package com.ctut.wms.wmscoreservice.dto.contract;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Các DTO của Hợp đồng cung ứng. Cấu trúc response giữ nguyên dạng lồng nhau mà giao diện đang dùng
 * (adminDuyetVong1, chuKyShop, adminDuyetVong2, thongTinXuatKho).
 */
public final class SupplyContractDtos {

    private SupplyContractDtos() {
    }

    // ===================== REQUEST =====================

    @Data
    public static class ItemRequest {
        private Long sanPhamId;
        private Integer soLuong;
    }

    @Data
    public static class CreateRequest {
        private Long storeId;
        private Long khoTongId;
        private String nguoiYeuCau;
        private String chucVuYeuCau;
        private List<ItemRequest> danhSachHang;
    }

    @Data
    public static class NoteRequest {
        private String note;
    }

    @Data
    public static class SignRequest {
        private String signerName;
        private String signerRole;
        private String signaturePin;
        private Boolean agreedTerms;
    }

    @Data
    public static class DispatchRequest {
        private String shippingProvider;
    }

    @Data
    public static class RejectRequest {
        private String reason;
    }

    // ===================== RESPONSE =====================

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ItemResponse {
        private Long sanPhamId;
        private String sku;
        private String tenHangHoa;
        private String donViTinh;
        private String danhMuc;
        private String hinhAnh;
        private Integer soLuong;
        private BigDecimal donGiaSi;
        private BigDecimal thanhTien;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Approval {
        private boolean daDuyet;
        private String nguoiDuyet;
        private LocalDateTime ngayDuyet;
        private String ghiChu;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Signature {
        private boolean daKy;
        private String nguoiKy;
        private String chucVu;
        private String maChuKySo;
        private LocalDateTime ngayKy;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Dispatch {
        private boolean daLenDon;
        private Long phieuXuatId;
        private String maPhieuXuat;
        private String nguoiXuat;
        private LocalDateTime ngayXuat;
        private String donViVanChuyen;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ContractResponse {
        private Long id;
        private String maHopDong;
        private String trangThai;
        private LocalDateTime ngayTao;

        private Long storeId;
        private String tenKhoCuaHang;
        private String maKhoCuaHang;

        private Long khoTongId;
        private String khoCungUng;
        private String diaChiKhoCungUng;
        private String soDienThoaiKhoCungUng;

        private BigDecimal tongTien;
        private Integer soLuongMatHang;
        private Integer tongSoLuongHang;
        private String nguoiYeuCau;
        private String chucVuYeuCau;
        private List<ItemResponse> danhSachHang;

        private Approval adminDuyetVong1;
        private Signature chuKyShop;
        private Approval adminDuyetVong2;
        private Approval thuKhoDuyet;
        private Dispatch thongTinXuatKho;

        private LocalDateTime ngayHoanThanh;
        private String nguoiNhanHang;
        private String lyDoTuChoi;
        private String nguoiTuChoi;
        private LocalDateTime ngayTuChoi;
    }
}
