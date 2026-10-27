/**
 * ==============================================================================
 * Service: ImportNoteService
 * Phân hệ: WMS Core Service (Quản lý kho cốt lõi & Tồn kho 2 tầng - Port 8081)
 * Mô tả: Cung cấp logic nghiệp vụ, giao dịch cơ sở dữ liệu và xử lý dữ liệu cho ImportNoteService.
 * ==============================================================================
 */
package com.ctut.wms.wmscoreservice.service;

import com.ctut.wms.wmscoreservice.dto.importnote.ImportNoteDetailRequest;
import com.ctut.wms.wmscoreservice.dto.importnote.ImportNoteDetailResponse;
import com.ctut.wms.wmscoreservice.dto.importnote.ImportNoteRequest;
import com.ctut.wms.wmscoreservice.dto.importnote.ImportNoteResponse;
import com.ctut.wms.wmscoreservice.entity.*;
import com.ctut.wms.wmscoreservice.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ImportNoteService {

    private final ImportNoteRepository importNoteRepository;
    private final ImportNoteDetailRepository importNoteDetailRepository;
    private final SupplierRepository supplierRepository;
    private final WarehouseRepository warehouseRepository;
    private final ShippingProviderRepository shippingProviderRepository;
    private final ProductRepository productRepository;
    private final InventoryRepository inventoryRepository;

    @Transactional
    public ImportNoteResponse createImportNote(ImportNoteRequest request) {
        Supplier supplier = supplierRepository.findById(request.getNhaCungCapId())
                .orElseThrow(() -> new RuntimeException("Lỗi: Không tìm thấy nhà cung cấp!"));
        Warehouse warehouse = warehouseRepository.findById(request.getKhoHangId())
                .orElseThrow(() -> new RuntimeException("Lỗi: Không tìm thấy kho hàng!"));

        ShippingProvider shippingProvider = null;
        if (request.getDonViVanChuyenId() != null) {
            shippingProvider = shippingProviderRepository.findById(request.getDonViVanChuyenId()).orElse(null);
        }

        ImportNote importNote = new ImportNote();
        importNote.setMaPhieuNhap("PN-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        importNote.setNhaCungCap(supplier);
        importNote.setKhoHang(warehouse);
        importNote.setDonViVanChuyen(shippingProvider);
        importNote.setNguoiTao(request.getNguoiTao() != null ? request.getNguoiTao() : "Thủ kho");
        importNote.setTrangThai("ĐÃ NHẬP KHO");

        ImportNote savedImportNote = importNoteRepository.save(importNote);
        BigDecimal tongTien = BigDecimal.ZERO;
        List<ImportNoteDetailResponse> detailResponses = new ArrayList<>();

        if (request.getDanhSachHangHoa() != null) {
            for (ImportNoteDetailRequest detailRequest : request.getDanhSachHangHoa()) {
                Product product = productRepository.findById(detailRequest.getSanPhamId())
                        .orElseThrow(() -> new RuntimeException("Lỗi: Không tìm thấy sản phẩm có ID " + detailRequest.getSanPhamId()));

                ImportNoteDetail detail = new ImportNoteDetail();
                detail.setPhieuNhap(savedImportNote);
                detail.setSanPham(product);
                detail.setSoLuong(detailRequest.getSoLuong());
                detail.setGiaNhap(detailRequest.getGiaNhap());
                ImportNoteDetail savedDetail = importNoteDetailRepository.save(detail);

                BigDecimal thanhTien = detailRequest.getGiaNhap().multiply(BigDecimal.valueOf(detailRequest.getSoLuong()));
                tongTien = tongTien.add(thanhTien);

                Inventory inventory = inventoryRepository.findBySanPhamAndKhoHang(product, warehouse)
                        .orElse(new Inventory());

                if (inventory.getId() == null) {
                    inventory.setSanPham(product);
                    inventory.setKhoHang(warehouse);
                    inventory.setSoLuongThucTe(0);
                    inventory.setSoLuongKhaDung(0);
                }

                inventory.setSoLuongThucTe(inventory.getSoLuongThucTe() + detailRequest.getSoLuong());
                inventory.setSoLuongKhaDung(inventory.getSoLuongKhaDung() + detailRequest.getSoLuong());
                inventoryRepository.save(inventory);

                detailResponses.add(ImportNoteDetailResponse.builder()
                        .id(savedDetail.getId())
                        .sanPhamId(product.getId())
                        .sku(product.getSku())
                        .tenSanPham(product.getTenSanPham())
                        .donViTinh(product.getDonViTinh())
                        .soLuong(detailRequest.getSoLuong())
                        .giaNhap(detailRequest.getGiaNhap())
                        .thanhTien(thanhTien)
                        .build());
            }
        }

        savedImportNote.setTongTienNhap(tongTien);
        savedImportNote = importNoteRepository.save(savedImportNote);

        return mapToResponse(savedImportNote, detailResponses);
    }

    public List<ImportNoteResponse> getAllImportNotes() {
        return importNoteRepository.findAll().stream()
                .map(note -> mapToResponse(note, null))
                .collect(Collectors.toList());
    }

    public ImportNoteResponse getImportNoteById(Long id) {
        ImportNote note = importNoteRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Lỗi: Không tìm thấy phiếu nhập có ID = " + id));
        List<ImportNoteDetail> details = importNoteDetailRepository.findByPhieuNhap(note);
        List<ImportNoteDetailResponse> detailResponses = details.stream().map(d -> {
            Product p = d.getSanPham();
            BigDecimal tt = d.getGiaNhap() != null && d.getSoLuong() != null
                    ? d.getGiaNhap().multiply(BigDecimal.valueOf(d.getSoLuong()))
                    : BigDecimal.ZERO;
            return ImportNoteDetailResponse.builder()
                    .id(d.getId())
                    .sanPhamId(p != null ? p.getId() : null)
                    .sku(p != null ? p.getSku() : "")
                    .tenSanPham(p != null ? p.getTenSanPham() : "")
                    .donViTinh(p != null ? p.getDonViTinh() : "")
                    .soLuong(d.getSoLuong())
                    .giaNhap(d.getGiaNhap())
                    .thanhTien(tt)
                    .build();
        }).collect(Collectors.toList());

        return mapToResponse(note, detailResponses);
    }

    @Transactional
    public ImportNoteResponse updateStatus(Long id, String status) {
        ImportNote note = importNoteRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Lỗi: Không tìm thấy phiếu nhập!"));
        note.setTrangThai(status);
        return mapToResponse(importNoteRepository.save(note), null);
    }

    private ImportNoteResponse mapToResponse(ImportNote note, List<ImportNoteDetailResponse> details) {
        Supplier s = note.getNhaCungCap();
        Warehouse w = note.getKhoHang();
        ShippingProvider sp = note.getDonViVanChuyen();

        return ImportNoteResponse.builder()
                .id(note.getId())
                .maPhieuNhap(note.getMaPhieuNhap())
                .ngayNhap(note.getNgayNhap())
                .nhaCungCapId(s != null ? s.getId() : null)
                .tenNhaCungCap(s != null ? s.getTenNhaCungCap() : "Chưa xác định")
                .diaChiNhaCungCap(s != null ? s.getDiaChi() : "")
                .sdtNhaCungCap(s != null ? s.getSoDienThoai() : "")
                .khoHangId(w != null ? w.getId() : null)
                .tenKhoHang(w != null ? w.getTenKho() : "Chưa xác định")
                .diaChiKho(w != null ? w.getDiaChi() : "")
                .donViVanChuyenId(sp != null ? sp.getId() : null)
                .tenDonViVanChuyen(sp != null ? sp.getTenDonVi() : "")
                .nguoiTao(note.getNguoiTao())
                .trangThai(note.getTrangThai())
                .tongTienNhap(note.getTongTienNhap() != null ? note.getTongTienNhap() : BigDecimal.ZERO)
                .danhSachHangHoa(details != null ? details : new ArrayList<>())
                .build();
    }
}
