/**
 * ==============================================================================
 * Service: ExportNoteService
 * Phân hệ: WMS Core Service (Quản lý kho cốt lõi & Tồn kho 2 tầng - Port 8081)
 * Mô tả: Cung cấp logic nghiệp vụ, giao dịch cơ sở dữ liệu và xử lý dữ liệu cho ExportNoteService.
 * ==============================================================================
 */
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
        exportNote.setTrangThai("HOÀN THÀNH");

        ExportNote savedExportNote = exportNoteRepository.save(exportNote);
        List<ExportNoteDetailResponse> detailResponses = new ArrayList<>();
        double tongTien = 0.0;

        if (request.getDanhSachHangHoa() != null) {
            for (ExportNoteDetailRequest detailRequest : request.getDanhSachHangHoa()) {
                Product product = productRepository.findById(detailRequest.getSanPhamId())
                        .orElseThrow(() -> new RuntimeException("Lỗi: Không tìm thấy sản phẩm ID " + detailRequest.getSanPhamId()));

                Inventory inventory = inventoryRepository.findBySanPhamAndKhoHang(product, warehouse)
                        .orElseThrow(() -> new RuntimeException("Lỗi: Sản phẩm " + product.getTenSanPham() + " không có trong kho này!"));

                if (inventory.getSoLuongKhaDung() < detailRequest.getSoLuong()) {
                    throw new RuntimeException("Lỗi: Không đủ tồn kho! Sản phẩm " + product.getTenSanPham() + " chỉ còn khả dụng: " + inventory.getSoLuongKhaDung());
                }

                inventory.setSoLuongThucTe(inventory.getSoLuongThucTe() - detailRequest.getSoLuong());
                inventory.setSoLuongKhaDung(inventory.getSoLuongKhaDung() - detailRequest.getSoLuong());
                inventoryRepository.save(inventory);

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

    public List<ExportNoteResponse> getAllExportNotes() {
        return exportNoteRepository.findAll().stream()
                .map(note -> mapToResponse(note, null, 0.0))
                .collect(Collectors.toList());
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
                .danhSachHangHoa(details != null ? details : new ArrayList<>())
                .build();
    }
}
