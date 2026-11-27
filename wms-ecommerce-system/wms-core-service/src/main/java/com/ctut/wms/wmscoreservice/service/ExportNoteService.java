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
import java.util.*;
import java.util.stream.Collectors;

/**
 * Nghiệp vụ Phiếu Xuất Kho.
 * Vòng đời: CHỜ DUYỆT --approve--> CHỜ XUẤT KHO --confirm--> HOÀN THÀNH (--> trạng thái giao vận)
 *           CHỜ DUYỆT / CHỜ XUẤT KHO --> TỪ CHỐI / ĐÃ HỦY
 * Tồn kho:
 *   - Lập phiếu: GIỮ CHỖ (trừ soLuongKhaDung) để không bán vượt số hàng đang có.
 *   - Xuất thực tế: trừ soLuongThucTe, cộng soLuongDaBan (nếu là đơn bán), ghi Thẻ kho.
 *   - Hủy / Từ chối trước khi xuất: trả lại soLuongKhaDung.
 */
@Service
@RequiredArgsConstructor
public class ExportNoteService {

    private final ExportNoteRepository exportNoteRepository;
    private final ExportNoteDetailRepository exportNoteDetailRepository;
    private final ShippingProviderRepository shippingProviderRepository;
    private final WarehouseRepository warehouseRepository;
    private final ProductRepository productRepository;
    private final InventoryRepository inventoryRepository;
    private final TheKhoRepository theKhoRepository;

    @Transactional
    public ExportNoteResponse createExportNote(ExportNoteRequest request) {
        Warehouse warehouse = warehouseRepository.findById(request.getKhoHangId())
                .orElseThrow(() -> new RuntimeException("Lỗi: Không tìm thấy kho hàng!"));

        ShippingProvider shippingProvider = shippingProviderRepository.findById(request.getDonViVanChuyenId())
                .orElseThrow(() -> new RuntimeException("Lỗi: Không tìm thấy đơn vị vận chuyển!"));

        if (request.getDanhSachHangHoa() == null || request.getDanhSachHangHoa().isEmpty()) {
            throw new RuntimeException("Lỗi: Phiếu xuất phải có ít nhất 1 sản phẩm!");
        }

        ExportNote exportNote = new ExportNote();
        exportNote.setMaPhieuXuat("PX-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        // Chỉ lưu mã đơn hàng thật (không tự sinh mã giả để không lẫn với đơn bán hàng)
        exportNote.setDonHangId(request.getDonHangId());
        boolean isRetail = request.getDonHangId() != null && !request.getDonHangId().isBlank();
        exportNote.setLoaiXuat(isRetail ? "XUAT_BAN_LE_SAN_TMDT" : "XUAT_CUNG_UNG_CUA_HANG");
        exportNote.setKhoHang(warehouse);
        exportNote.setDonViVanChuyen(shippingProvider);
        exportNote.setNguoiTao(request.getNguoiTao() != null ? request.getNguoiTao() : "Thủ kho");
        exportNote.setNgayXuat(LocalDateTime.now());
        exportNote.setTrangThai(NoteStatus.XUAT_CHO_DUYET);
        exportNote.setDaGiuCho(true);

        // Ưu tiên truy vấn trực tiếp từ bảng kho_va_cua_hang để dữ liệu chính xác 100%
        if (request.getCuaHangNhanId() != null) {
            warehouseRepository.findById(request.getCuaHangNhanId()).ifPresent(shop -> {
                exportNote.setTenShop(shop.getTenKho());
                exportNote.setDiaChiNhan(shop.getDiaChi());
            });
        } else {
            exportNote.setTenShop(request.getTenShop());
            exportNote.setDiaChiNhan(request.getDiaChiNhan());
        }

        ExportNote savedExportNote = exportNoteRepository.save(exportNote);
        List<ExportNoteDetailResponse> detailResponses = new ArrayList<>();
        double tongTien = 0.0;

        for (ExportNoteDetailRequest detailRequest : request.getDanhSachHangHoa()) {
            if (detailRequest.getSoLuong() == null || detailRequest.getSoLuong() <= 0) {
                throw new RuntimeException("Lỗi: Số lượng xuất phải lớn hơn 0!");
            }
            Product product = productRepository.findById(detailRequest.getSanPhamId())
                    .orElseThrow(() -> new RuntimeException("Lỗi: Không tìm thấy sản phẩm ID " + detailRequest.getSanPhamId()));

            // Giữ chỗ tồn khả dụng ngay khi lập phiếu (chống bán vượt tồn kho)
            Inventory inventory = inventoryRepository.findBySanPhamAndKhoHang(product, warehouse)
                    .orElseThrow(() -> new RuntimeException("Lỗi: Sản phẩm " + product.getTenSanPham() + " không có trong kho này!"));
            int khaDung = inventory.getSoLuongKhaDung() != null ? inventory.getSoLuongKhaDung() : 0;
            if (khaDung < detailRequest.getSoLuong()) {
                throw new RuntimeException("Lỗi: Không đủ tồn khả dụng! Sản phẩm " + product.getTenSanPham()
                        + " chỉ còn: " + khaDung);
            }
            inventory.setSoLuongKhaDung(khaDung - detailRequest.getSoLuong());
            inventoryRepository.save(inventory); // @Version chống tranh chấp khi nhiều đơn cùng lúc

            double donGia = resolveUnitPrice(detailRequest.getDonGia(), inventory, product);

            ExportNoteDetail detail = new ExportNoteDetail();
            detail.setPhieuXuat(savedExportNote);
            detail.setSanPham(product);
            detail.setSoLuong(detailRequest.getSoLuong());
            detail.setDonGia(donGia);
            ExportNoteDetail savedDetail = exportNoteDetailRepository.save(detail);

            double thanhTien = donGia * detailRequest.getSoLuong();
            tongTien += thanhTien;
            detailResponses.add(toDetailResponse(savedDetail, product, detailRequest.getSoLuong(), donGia));
        }

        return mapToResponse(savedExportNote, detailResponses, tongTien);
    }

    public List<ExportNoteResponse> getAllExportNotes() {
        return exportNoteRepository.findAll().stream()
                .map(this::buildFullResponse)
                .collect(Collectors.toList());
    }

    public ExportNoteResponse getExportNoteById(Long id) {
        ExportNote note = exportNoteRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Lỗi: Không tìm thấy phiếu xuất có ID = " + id));
        return buildFullResponse(note);
    }

    /**
     * Cập nhật trạng thái "tự do" của phiếu xuất. Chỉ cho phép:
     *  - Hủy / Từ chối khi phiếu CHƯA xuất thực tế (trả lại tồn khả dụng).
     *  - Các trạng thái giao vận (VD: DANG_GIAO, DA_GIAO) SAU KHI đã xuất kho.
     * Duyệt và xuất thực tế phải đi qua /approve và /confirm.
     */
    @Transactional
    public ExportNoteResponse updateStatus(Long id, String status) {
        ExportNote note = exportNoteRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Lỗi: Không tìm thấy phiếu xuất!"));
        String current = note.getTrangThai();
        String target = status != null ? status.trim() : "";

        if (target.isEmpty()) {
            throw new RuntimeException("Lỗi: Trạng thái mới không được để trống!");
        }
        if (NoteStatus.isExportPending(target) || NoteStatus.isExportApproved(target)
                || NoteStatus.XUAT_HOAN_THANH.equals(NoteStatus.norm(target))) {
            throw new RuntimeException("Lỗi: Hãy dùng chức năng Duyệt / Xác nhận xuất kho để chuyển sang trạng thái [" + target + "]!");
        }
        if (NoteStatus.isExportCancelled(current)) {
            throw new RuntimeException("Lỗi: Phiếu xuất đã bị hủy/từ chối, không thể thay đổi trạng thái!");
        }

        if (NoteStatus.isExportCancelled(target)) {
            if (NoteStatus.isExportShipped(current)) {
                throw new RuntimeException("Lỗi: Phiếu đã xuất kho thực tế, không thể hủy!");
            }
            releaseReservation(note);
        } else if (!NoteStatus.isExportShipped(current)) {
            throw new RuntimeException("Lỗi: Phiếu chưa xuất kho, không thể chuyển sang trạng thái giao vận [" + target + "]!");
        }

        note.setTrangThai(target);
        exportNoteRepository.save(note);
        return buildFullResponse(note);
    }

    @Transactional
    public ExportNoteResponse approveExportNote(Long id) {
        ExportNote exportNote = exportNoteRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Lỗi: Không tìm thấy phiếu xuất có ID = " + id));

        if (!NoteStatus.isExportPending(exportNote.getTrangThai())) {
            throw new RuntimeException("Lỗi: Chỉ có thể duyệt phiếu đang ở trạng thái CHỜ DUYỆT!");
        }

        // Chỉ đổi trạng thái để chuyển sang bộ phận kho nhặt hàng
        exportNote.setTrangThai(NoteStatus.XUAT_CHO_XUAT_KHO);
        exportNoteRepository.save(exportNote);
        return buildFullResponse(exportNote);
    }

    @Transactional
    public ExportNoteResponse confirmActualExport(Long id) {
        ExportNote exportNote = exportNoteRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Lỗi: Không tìm thấy phiếu xuất có ID = " + id));

        if (!NoteStatus.isExportApproved(exportNote.getTrangThai())) {
            throw new RuntimeException("Lỗi: Phiếu phải được duyệt (CHỜ XUẤT KHO) mới có thể xuất thực tế!");
        }

        Warehouse warehouse = exportNote.getKhoHang();
        boolean daGiuCho = Boolean.TRUE.equals(exportNote.getDaGiuCho());
        boolean laDonBan = exportNote.getDonHangId() != null && !exportNote.getDonHangId().isBlank();
        List<ExportNoteDetail> details = exportNoteDetailRepository.findByPhieuXuat(exportNote);

        for (ExportNoteDetail detail : details) {
            Product product = detail.getSanPham();
            int qty = detail.getSoLuong();

            Inventory inventory = inventoryRepository.findBySanPhamAndKhoHang(product, warehouse)
                    .orElseThrow(() -> new RuntimeException("Lỗi: Sản phẩm " + product.getTenSanPham() + " không có trong kho này!"));

            if (inventory.getSoLuongThucTe() < qty) {
                throw new RuntimeException("Lỗi: Không đủ hàng thực tế trên kệ! Sản phẩm " + product.getTenSanPham()
                        + " chỉ còn: " + inventory.getSoLuongThucTe());
            }
            // Phiếu cũ (lập trước khi có cơ chế giữ chỗ) thì trừ khả dụng tại đây
            if (!daGiuCho) {
                if (inventory.getSoLuongKhaDung() < qty) {
                    throw new RuntimeException("Lỗi: Không đủ tồn kho! Sản phẩm " + product.getTenSanPham()
                            + " chỉ còn khả dụng: " + inventory.getSoLuongKhaDung());
                }
                inventory.setSoLuongKhaDung(inventory.getSoLuongKhaDung() - qty);
            }

            int soLuongCu = inventory.getSoLuongThucTe();
            inventory.setSoLuongThucTe(soLuongCu - qty);
            if (laDonBan) {
                int daBan = inventory.getSoLuongDaBan() != null ? inventory.getSoLuongDaBan() : 0;
                inventory.setSoLuongDaBan(daBan + qty);
            }
            inventoryRepository.save(inventory);

            // Ghi nhận Thẻ kho
            TheKho theKho = new TheKho();
            theKho.setHangHoa(product);
            theKho.setKhoCuaHang(warehouse);
            theKho.setLoaiGiaoDich("XUẤT KHO");
            theKho.setMaChungTu(exportNote.getMaPhieuXuat());
            theKho.setPhieuXuatId(exportNote.getId());
            theKho.setSoLuongTruocBienDong(soLuongCu);
            theKho.setSoLuongBienDong(qty);
            theKho.setSoLuongSauBienDong(inventory.getSoLuongThucTe());
            theKho.setNgayTao(LocalDateTime.now());
            theKhoRepository.save(theKho);
        }

        exportNote.setTrangThai(NoteStatus.XUAT_HOAN_THANH);
        exportNote.setNgayXuat(LocalDateTime.now());
        exportNoteRepository.save(exportNote);
        return buildFullResponse(exportNote);
    }

    /**
     * Hủy các phiếu xuất CHƯA xuất thực tế của một đơn hàng (khi khách/shop hủy đơn) và trả lại tồn khả dụng.
     * Ném lỗi nếu đơn đã có phiếu xuất kho thực tế (hàng đã rời kho).
     */
    @Transactional
    public int cancelByOrder(String donHangId) {
        List<ExportNote> notes = exportNoteRepository.findByDonHangId(donHangId);
        for (ExportNote note : notes) {
            if (NoteStatus.isExportShipped(note.getTrangThai())) {
                throw new RuntimeException("Lỗi: Đơn hàng " + donHangId + " đã được xuất kho, không thể hủy!");
            }
        }
        int count = 0;
        for (ExportNote note : notes) {
            if (NoteStatus.isExportCancelled(note.getTrangThai())) continue;
            releaseReservation(note);
            note.setTrangThai(NoteStatus.XUAT_DA_HUY);
            exportNoteRepository.save(note);
            count++;
        }
        return count;
    }

    /**
     * Kiểm tra đồng bộ vận hành cho order-service:
     * Đơn hàng chỉ coi là đã xuất kho khi có ít nhất 1 phiếu xuất đạt trạng thái HOÀN THÀNH (hoặc giao vận sau đó).
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getOrderExportSyncStatus(String donHangId) {
        List<ExportNote> notes = exportNoteRepository.findByDonHangId(donHangId);
        Map<String, Object> res = new HashMap<>();
        if (notes == null || notes.isEmpty()) {
            res.put("shipped", false);
            res.put("status", "CHƯA_CÓ_PHIẾU_XUẤT");
            res.put("maPhieuXuat", null);
            res.put("message", "Chưa tìm thấy phiếu xuất kho cho đơn hàng " + donHangId + " trên phân hệ WMS!");
            return res;
        }
        Optional<ExportNote> shippedNote = notes.stream()
                .filter(n -> NoteStatus.isExportShipped(n.getTrangThai()))
                .findFirst();
        if (shippedNote.isPresent()) {
            ExportNote n = shippedNote.get();
            res.put("shipped", true);
            res.put("status", n.getTrangThai());
            res.put("maPhieuXuat", n.getMaPhieuXuat());
            res.put("message", "Thủ kho đã xác nhận duyệt và xuất kho thành công (" + n.getTrangThai() + ").");
            return res;
        }
        ExportNote latest = notes.get(notes.size() - 1);
        res.put("shipped", false);
        res.put("status", latest.getTrangThai());
        res.put("maPhieuXuat", latest.getMaPhieuXuat());
        res.put("message", "Phiếu xuất [" + latest.getMaPhieuXuat() + "] đang ở trạng thái [" + latest.getTrangThai()
                + "]. Thủ kho cần xác nhận duyệt và xuất kho (HOÀN THÀNH) trên WMS trước!");
        return res;
    }

    // ===================== HÀM HỖ TRỢ =====================

    /** Trả lại số lượng khả dụng đã giữ chỗ khi lập phiếu. */
    private void releaseReservation(ExportNote note) {
        if (!Boolean.TRUE.equals(note.getDaGiuCho())) return;
        for (ExportNoteDetail d : exportNoteDetailRepository.findByPhieuXuat(note)) {
            inventoryRepository.findBySanPhamAndKhoHang(d.getSanPham(), note.getKhoHang()).ifPresent(inv -> {
                inv.setSoLuongKhaDung(inv.getSoLuongKhaDung() + d.getSoLuong());
                inventoryRepository.save(inv);
            });
        }
        note.setDaGiuCho(false);
    }

    private double resolveUnitPrice(Double requested, Inventory inventory, Product product) {
        if (requested != null && requested >= 0) return requested;
        if (inventory.getGiaBanHienTai() != null) return inventory.getGiaBanHienTai().doubleValue();
        return product.getGiaBan() != null ? product.getGiaBan() : 0.0;
    }

    /** Đơn giá của dòng chi tiết: ưu tiên giá đã lưu khi xuất, sau đó tới giá niêm yết sản phẩm. */
    static double unitPriceOf(ExportNoteDetail d) {
        if (d.getDonGia() != null) return d.getDonGia();
        Product p = d.getSanPham();
        return p != null && p.getGiaBan() != null ? p.getGiaBan() : 0.0;
    }

    private ExportNoteResponse buildFullResponse(ExportNote note) {
        List<ExportNoteDetail> details = exportNoteDetailRepository.findByPhieuXuat(note);
        double tongTien = 0.0;
        List<ExportNoteDetailResponse> detailResponses = new ArrayList<>();
        for (ExportNoteDetail d : details) {
            double gia = unitPriceOf(d);
            int sl = d.getSoLuong() != null ? d.getSoLuong() : 0;
            tongTien += gia * sl;
            detailResponses.add(toDetailResponse(d, d.getSanPham(), sl, gia));
        }
        return mapToResponse(note, detailResponses, tongTien);
    }

    private ExportNoteDetailResponse toDetailResponse(ExportNoteDetail d, Product p, int sl, double gia) {
        return ExportNoteDetailResponse.builder()
                .id(d.getId())
                .sanPhamId(p != null ? p.getId() : null)
                .sku(p != null ? p.getSku() : "")
                .tenSanPham(p != null ? p.getTenSanPham() : "")
                .donViTinh(p != null ? p.getDonViTinh() : "")
                .soLuong(sl)
                .donGia(gia)
                .thanhTien(gia * sl)
                .build();
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
                .tenShop(note.getTenShop())
                .diaChiNhan(note.getDiaChiNhan())
                .danhSachHangHoa(details != null ? details : new ArrayList<>())
                .build();
    }
}
