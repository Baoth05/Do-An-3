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
import java.time.LocalDateTime;
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
    private final TheKhoRepository theKhoRepository;

    @Transactional
    public ImportNoteResponse createImportNote(ImportNoteRequest request) {
        Supplier supplier = supplierRepository.findById(request.getNhaCungCapId())
                .orElseThrow(() -> new RuntimeException("Lỗi: Không tìm thấy nhà cung cấp!"));

        // 🌟 KIỂM SOÁT KHO TIẾP NHẬN: Phiếu nhập từ Nhà Cung Cấp gốc bắt buộc nhập vào KHO TỔNG TRUNG TÂM
        Warehouse warehouse = null;
        if (request.getKhoHangId() != null) {
            warehouse = warehouseRepository.findById(request.getKhoHangId()).orElse(null);
        }

        // Nếu client không truyền kho hoặc kho truyền lên là kho cửa hàng (KHO_CUA_HANG), tự động chuyển về Kho Tổng
        if (warehouse == null || "KHO_CUA_HANG".equalsIgnoreCase(warehouse.getLoaiHinh())) {
            List<Warehouse> all = warehouseRepository.findAll();
            warehouse = all.stream()
                    .filter(w -> "KHO_TONG".equalsIgnoreCase(w.getLoaiHinh()))
                    .findFirst()
                    .or(() -> all.stream().filter(w -> w.getMaKho() != null && w.getMaKho().startsWith("KHO-")).findFirst())
                    .orElse(warehouse);
        }

        if (warehouse == null) {
            throw new RuntimeException("Lỗi: Không tìm thấy Kho Tổng Trung Tâm để tiếp nhận hàng!");
        }

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
        importNote.setNgayNhap(LocalDateTime.now());

        // Phiếu mới luôn ở trạng thái CHỜ DUYỆT (không cho tạo phiếu ở trạng thái đã nhập kho)
        importNote.setTrangThai(NoteStatus.NHAP_CHO_DUYET);

        if (request.getDanhSachHangHoa() == null || request.getDanhSachHangHoa().isEmpty()) {
            throw new RuntimeException("Lỗi: Phiếu nhập phải có ít nhất 1 sản phẩm!");
        }
        for (ImportNoteDetailRequest d : request.getDanhSachHangHoa()) {
            if (d.getSoLuong() == null || d.getSoLuong() <= 0) {
                throw new RuntimeException("Lỗi: Số lượng nhập phải lớn hơn 0!");
            }
            if (d.getGiaNhap() == null || d.getGiaNhap().compareTo(BigDecimal.ZERO) < 0) {
                throw new RuntimeException("Lỗi: Giá nhập không hợp lệ!");
            }
        }

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

                // 🌟 LƯU Ý: KHÔNG CỘNG TỒN KHO VÀ KHÔNG GHI THẺ KHO Ở ĐÂY NỮA

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

    @Transactional(readOnly = true)
    public List<ImportNoteResponse> getAllImportNotes() {
        return importNoteRepository.findAll().stream()
                .map(note -> {
                    List<ImportNoteDetail> details = importNoteDetailRepository.findByPhieuNhap(note);
                    List<ImportNoteDetailResponse> detailResponses = details.stream().map(d -> {
                        Product p = d.getSanPham();
                        BigDecimal tt = (d.getGiaNhap() != null && d.getSoLuong() != null)
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
                })
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
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

    // 🌟 CHỈ CỘNG TỒN KHO & GHI THẺ KHO KHI CHUYỂN TRẠNG THÁI THÀNH DA_NHAP_KHO
    @Transactional
    public ImportNoteResponse updateStatus(Long id, String status) {
        ImportNote note = importNoteRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Lỗi: Không tìm thấy phiếu nhập!"));

        String oldStatus = note.getTrangThai();
        String newStatus = NoteStatus.normalizeImport(status);

        // Máy trạng thái: CHO_DUYET -> DA_DUYET | TU_CHOI ; DA_DUYET -> DA_NHAP_KHO | TU_CHOI.
        // DA_NHAP_KHO và TU_CHOI là trạng thái cuối => tồn kho chỉ được cộng ĐÚNG 1 LẦN.
        if (!NoteStatus.canImportTransition(oldStatus, newStatus)) {
            throw new RuntimeException("Lỗi: Không thể chuyển phiếu nhập từ [" + oldStatus + "] sang [" + status + "]!");
        }
        note.setTrangThai(newStatus);
        ImportNote updatedNote = importNoteRepository.save(note);

        if (NoteStatus.NHAP_DA_NHAP_KHO.equals(newStatus)) {
            List<ImportNoteDetail> details = importNoteDetailRepository.findByPhieuNhap(updatedNote);
            Warehouse warehouse = updatedNote.getKhoHang();

            for (ImportNoteDetail detail : details) {
                Product product = detail.getSanPham();
                Integer qty = detail.getSoLuong();

                if (product != null && warehouse != null && qty != null) {
                    Inventory inventory = inventoryRepository.findBySanPhamAndKhoHang(product, warehouse)
                            .orElse(new Inventory());

                    if (inventory.getId() == null) {
                        inventory.setSanPham(product);
                        inventory.setKhoHang(warehouse);
                        inventory.setSoLuongThucTe(0);
                        inventory.setSoLuongKhaDung(0);
                    }

                    int soLuongCu = inventory.getSoLuongThucTe();

                    // 1. Cập nhật số lượng tồn kho
                    inventory.setSoLuongThucTe(soLuongCu + qty);
                    inventory.setSoLuongKhaDung(inventory.getSoLuongKhaDung() + qty);
                    inventoryRepository.save(inventory);

                    // 2. Ghi bản ghi Lịch Sử Thẻ Kho
                    TheKho theKho = new TheKho();
                    theKho.setHangHoa(product);
                    theKho.setKhoCuaHang(warehouse);
                    theKho.setLoaiGiaoDich("NHẬP KHO THỰC TẾ");
                    theKho.setMaChungTu(updatedNote.getMaPhieuNhap());
                    theKho.setPhieuNhapId(updatedNote.getId());
                    theKho.setSoLuongTruocBienDong(soLuongCu);
                    theKho.setSoLuongBienDong(qty);
                    theKho.setSoLuongSauBienDong(inventory.getSoLuongThucTe());
                    theKho.setNgayTao(LocalDateTime.now());
                    theKhoRepository.save(theKho);
                }
            }
        }

        return mapToResponse(updatedNote, null);
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