package com.ctut.wms.wmscoreservice.service;

import com.ctut.wms.wmscoreservice.dto.exportnote.ExportNoteDetailRequest;
import com.ctut.wms.wmscoreservice.dto.exportnote.ExportNoteDetailResponse;
import com.ctut.wms.wmscoreservice.dto.exportnote.ExportNoteRequest;
import com.ctut.wms.wmscoreservice.dto.exportnote.ExportNoteResponse;
import com.ctut.wms.wmscoreservice.entity.*;
import com.ctut.wms.wmscoreservice.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ExportNoteService {

    private final ExportNoteRepository exportNoteRepository;
    private final ExportNoteDetailRepository exportNoteDetailRepository;
    private final ShippingProviderRepository shippingProviderRepository;
    private final WarehouseRepository warehouseRepository;
    private final ProductRepository productRepository;
    private final InventoryRepository inventoryRepository;

    // 🌟 ĐÃ BỔ SUNG: Repository để ghi nhận Thẻ kho
    private final TheKhoRepository theKhoRepository;

    @Transactional
    public ExportNoteResponse createExportNote(ExportNoteRequest request) {
        Warehouse warehouse = warehouseRepository.findById(request.getKhoHangId())
                .orElseThrow(() -> new RuntimeException("Lỗi: Không tìm thấy kho hàng!"));

        ShippingProvider shippingProvider = shippingProviderRepository.findById(request.getDonViVanChuyenId())
                .orElseThrow(() -> new RuntimeException("Lỗi: Không tìm thấy đơn vị vận chuyển!"));

        ExportNote exportNote = new ExportNote();
        exportNote.setMaPhieuXuat("PX-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        exportNote.setDonHangId(request.getDonHangId() != null ? request.getDonHangId() : "DH-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase());
        exportNote.setKhoHang(warehouse);
        exportNote.setDonViVanChuyen(shippingProvider);
        exportNote.setNguoiTao(request.getNguoiTao() != null ? request.getNguoiTao() : "Thủ kho");
        exportNote.setNgayXuat(LocalDateTime.now());

        // 🌟 SỬA Ở ĐÂY: Trạng thái ban đầu chỉ là CHỜ DUYỆT
        exportNote.setTrangThai("CHỜ DUYỆT");


        // Ưu tiên truy vấn trực tiếp từ bảng kho_va_cua_hang để dữ liệu chính xác 100%
        if (request.getCuaHangNhanId() != null) {
            warehouseRepository.findById(request.getCuaHangNhanId()).ifPresent(shop -> {
                exportNote.setTenShop(shop.getTenKho());
                exportNote.setDiaChiNhan(shop.getDiaChi());
            });
        } else {
            // Dự phòng: Lấy dữ liệu Frontend gửi xuống nếu không có ID
            exportNote.setTenShop(request.getTenShop());
            exportNote.setDiaChiNhan(request.getDiaChiNhan());
        }

        ExportNote savedExportNote = exportNoteRepository.save(exportNote);
        List<ExportNoteDetailResponse> detailResponses = new ArrayList<>();
        double tongTien = 0.0;

        if (request.getDanhSachHangHoa() != null) {
            for (ExportNoteDetailRequest detailRequest : request.getDanhSachHangHoa()) {
                Product product = productRepository.findById(detailRequest.getSanPhamId())
                        .orElseThrow(() -> new RuntimeException("Lỗi: Không tìm thấy sản phẩm ID " + detailRequest.getSanPhamId()));

                ExportNoteDetail detail = new ExportNoteDetail();
                detail.setPhieuXuat(savedExportNote);
                detail.setSanPham(product);
                detail.setSoLuong(detailRequest.getSoLuong());
                ExportNoteDetail savedDetail = exportNoteDetailRepository.save(detail);

                double donGia = product.getGiaBan() != null ? product.getGiaBan() : 0.0;
                double thanhTien = donGia * detailRequest.getSoLuong();
                tongTien += thanhTien;

                detailResponses.add(ExportNoteDetailResponse.builder()
                        .id(savedDetail.getId())
                        .sanPhamId(product.getId())
                        .sku(product.getSku())
                        .tenSanPham(product.getTenSanPham())
                        .donViTinh(product.getDonViTinh())
                        .soLuong(detailRequest.getSoLuong())
                        .donGia(donGia)
                        .thanhTien(thanhTien)
                        .build());
            }
        }

        return mapToResponse(savedExportNote, detailResponses, tongTien);
    }


    // 1. SỬA HÀM LẤY TẤT CẢ PHIẾU XUẤT
    public List<ExportNoteResponse> getAllExportNotes() {
        // Lấy tất cả phiếu xuất từ DB
        List<ExportNote> exportNotes = exportNoteRepository.findAll();

        return exportNotes.stream().map(note -> {
            // Nạp danh sách chi tiết cho từng phiếu xuất
            List<ExportNoteDetail> details = exportNoteDetailRepository.findByPhieuXuat(note);

            List<ExportNoteDetailResponse> detailResponses = new ArrayList<>();
            double tongTien = 0.0;

            // Xử lý map chi tiết và tính tổng tiền
            for (ExportNoteDetail d : details) {
                Product p = d.getSanPham();
                double gia = p != null && p.getGiaBan() != null ? p.getGiaBan() : 0.0;
                int sl = d.getSoLuong() != null ? d.getSoLuong() : 0;
                double tt = gia * sl;
                tongTien += tt;

                detailResponses.add(ExportNoteDetailResponse.builder()
                        .id(d.getId())
                        .sanPhamId(p != null ? p.getId() : null)
                        .sku(p != null ? p.getSku() : "")
                        .tenSanPham(p != null ? p.getTenSanPham() : "")
                        .donViTinh(p != null ? p.getDonViTinh() : "")
                        .soLuong(sl)
                        .donGia(gia)
                        .thanhTien(tt)
                        .build());
            }

            // Truyền detailResponses đã có dữ liệu vào hàm map
            return mapToResponse(note, detailResponses, tongTien);

        }).collect(Collectors.toList());
    }


    public ExportNoteResponse getExportNoteById(Long id) {
        ExportNote note = exportNoteRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Lỗi: Không tìm thấy phiếu xuất có ID = " + id));
        List<ExportNoteDetail> details = exportNoteDetailRepository.findByPhieuXuat(note);
        double tongTien = 0.0;
        List<ExportNoteDetailResponse> detailResponses = new ArrayList<>();
        for (ExportNoteDetail d : details) {
            Product p = d.getSanPham();
            double gia = p != null && p.getGiaBan() != null ? p.getGiaBan() : 0.0;
            int sl = d.getSoLuong() != null ? d.getSoLuong() : 0;
            double tt = gia * sl;
            tongTien += tt;
            detailResponses.add(ExportNoteDetailResponse.builder()
                    .id(d.getId())
                    .sanPhamId(p != null ? p.getId() : null)
                    .sku(p != null ? p.getSku() : "")
                    .tenSanPham(p != null ? p.getTenSanPham() : "")
                    .donViTinh(p != null ? p.getDonViTinh() : "")
                    .soLuong(sl)
                    .donGia(gia)
                    .thanhTien(tt)
                    .build());
        }

        return mapToResponse(note, detailResponses, tongTien);
    }

    @Transactional
    public ExportNoteResponse updateStatus(Long id, String status) {
        ExportNote note = exportNoteRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Lỗi: Không tìm thấy phiếu xuất!"));
        note.setTrangThai(status);
        return mapToResponse(exportNoteRepository.save(note), null, 0.0);
    }
    private ExportNoteResponse mapToResponse(ExportNote note, List<ExportNoteDetailResponse> details, double total) {
        Warehouse w = note.getKhoHang();
        ShippingProvider sp = note.getDonViVanChuyen();

        return ExportNoteResponse.builder()
                .id(note.getId())
                .maPhieuXuat(note.getMaPhieuXuat())
                .donHangId(note.getDonHangId())
                .khoHangId(w != null ? w.getId() : null)
                .tenKhoHang(w != null ? w.getTenKho() : "Chưa xác định")
                .donViVanChuyenId(sp != null ? sp.getId() : null)
                .tenDonViVanChuyen(sp != null ? sp.getTenDonVi() : "Chưa xác định")
                .nguoiTao(note.getNguoiTao())
                .ngayXuat(note.getNgayXuat())
                .trangThai(note.getTrangThai())
                .tongGiaTri(total)
                // 🌟 BỔ SUNG: Trả đúng dữ liệu đã được lưu trong DB lên Frontend
                .tenShop(note.getTenShop())
                .diaChiNhan(note.getDiaChiNhan())
                .danhSachHangHoa(details != null ? details : new ArrayList<>())
                .build();
    }
    @Transactional
    public ExportNoteResponse approveExportNote(Long id) {
        ExportNote exportNote = exportNoteRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Lỗi: Không tìm thấy phiếu xuất có ID = " + id));

        if (!"CHỜ DUYỆT".equalsIgnoreCase(exportNote.getTrangThai())) {
            throw new RuntimeException("Lỗi: Chỉ có thể duyệt phiếu đang ở trạng thái CHỜ DUYỆT!");
        }

        // Chỉ đổi trạng thái để chuyển sang bộ phận kho nhặt hàng
        exportNote.setTrangThai("CHỜ XUẤT KHO");
        exportNoteRepository.save(exportNote);

        return getExportNoteById(id);
    }
    @Transactional
    public ExportNoteResponse confirmActualExport(Long id) {
        ExportNote exportNote = exportNoteRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Lỗi: Không tìm thấy phiếu xuất có ID = " + id));

        if (!"CHỜ XUẤT KHO".equalsIgnoreCase(exportNote.getTrangThai())) {
            throw new RuntimeException("Lỗi: Phiếu phải được duyệt (CHỜ XUẤT KHO) mới có thể xuất thực tế!");
        }

        Warehouse warehouse = exportNote.getKhoHang();
        List<ExportNoteDetail> details = exportNoteDetailRepository.findByPhieuXuat(exportNote);

        for (ExportNoteDetail detail : details) {
            Product product = detail.getSanPham();

            // Kiểm tra tồn kho
            Inventory inventory = inventoryRepository.findBySanPhamAndKhoHang(product, warehouse)
                    .orElseThrow(() -> new RuntimeException("Lỗi: Sản phẩm " + product.getTenSanPham() + " không có trong kho này!"));

            if (inventory.getSoLuongKhaDung() < detail.getSoLuong()) {
                throw new RuntimeException("Lỗi: Không đủ tồn kho! Sản phẩm " + product.getTenSanPham() + " chỉ còn khả dụng: " + inventory.getSoLuongKhaDung());
            }

            int soLuongCu = inventory.getSoLuongThucTe();

            // Trừ tồn kho
            inventory.setSoLuongThucTe(inventory.getSoLuongThucTe() - detail.getSoLuong());
            inventory.setSoLuongKhaDung(inventory.getSoLuongKhaDung() - detail.getSoLuong());
            inventoryRepository.save(inventory);

            // Ghi nhận Thẻ kho
            TheKho theKho = new TheKho();
            theKho.setHangHoa(product);
            theKho.setKhoCuaHang(warehouse);
            theKho.setLoaiGiaoDich("XUẤT KHO");
            theKho.setMaChungTu(exportNote.getMaPhieuXuat());
            theKho.setPhieuXuatId(exportNote.getId());
            theKho.setSoLuongTruocBienDong(soLuongCu);
            theKho.setSoLuongBienDong(detail.getSoLuong());
            theKho.setSoLuongSauBienDong(inventory.getSoLuongThucTe());
            theKho.setNgayTao(LocalDateTime.now());
            theKhoRepository.save(theKho);
        }

        // Hoàn thành phiếu xuất
        exportNote.setTrangThai("HOÀN THÀNH");
        exportNoteRepository.save(exportNote);

        return getExportNoteById(id);
    }


}