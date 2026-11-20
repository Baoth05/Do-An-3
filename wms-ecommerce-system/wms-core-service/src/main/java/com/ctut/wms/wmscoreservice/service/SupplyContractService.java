package com.ctut.wms.wmscoreservice.service;

import com.ctut.wms.wmscoreservice.dto.contract.SupplyContractDtos.*;
import com.ctut.wms.wmscoreservice.entity.*;
import com.ctut.wms.wmscoreservice.repository.*;
import com.ctut.wms.wmscoreservice.security.CurrentUser;
import com.ctut.wms.wmscoreservice.security.ForbiddenException;
import com.ctut.wms.wmscoreservice.security.StoreAccess;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Hợp đồng cung ứng nội bộ Kho Tổng -> Kho Cửa Hàng (6 bước, lưu trên CSDL wms_core_db).
 * Toàn bộ biến động tồn kho được ghi Thẻ Kho ở cả 2 đầu và Phiếu Xuất Kho cung ứng ở Kho Tổng.
 */
@Service
@RequiredArgsConstructor
public class SupplyContractService {

    public static final String CHO_ADMIN_DUYET = "CHO_ADMIN_DUYET";
    public static final String CHO_SHOP_KY = "CHO_SHOP_KY";
    public static final String DA_KY_CHO_DUYET_KHO = "DA_KY_CHO_DUYET_KHO";
    public static final String CHUYEN_QUA_KHO = "CHUYEN_QUA_KHO";
    public static final String THU_KHO_DA_DUYET = "THU_KHO_DA_DUYET";
    public static final String DANG_GIAO_HANG = "DANG_GIAO_HANG";
    public static final String HOAN_THANH = "HOAN_THANH";
    public static final String TU_CHOI = "TU_CHOI";

    public static final String TK_XUAT_CUNG_UNG = "XUẤT CUNG ỨNG";
    public static final String TK_NHAP_TU_KHO_TONG = "NHẬP TỪ KHO TỔNG";

    private final SupplyContractRepository contractRepository;
    private final WarehouseRepository warehouseRepository;
    private final ProductRepository productRepository;
    private final InventoryRepository inventoryRepository;
    private final TheKhoRepository theKhoRepository;
    private final ExportNoteRepository exportNoteRepository;
    private final ExportNoteDetailRepository exportNoteDetailRepository;
    private final ShippingProviderRepository shippingProviderRepository;

    @Value("${app.contract.sign-pin:123456}")
    private String signPin;

    // ===================== TRA CỨU =====================

    @Transactional(readOnly = true)
    public List<ContractResponse> list(Long storeId) {
        List<SupplyContract> contracts;
        if (storeId != null) {
            StoreAccess.requireCanManage(findWarehouse(storeId));
            // Spring Data JPA tự động hiểu findByStoreId nghĩa là lấy contract có thuộc tính store có id = storeId
            contracts = contractRepository.findByStoreIdOrderByNgayTaoDesc(storeId);
        } else {
            if (!CurrentUser.isAdmin() && !CurrentUser.isWarehouse()) {
                throw new ForbiddenException("Từ chối truy cập: Vui lòng chọn gian hàng của bạn!");
            }
            contracts = contractRepository.findAllByOrderByNgayTaoDesc();
        }
        return contracts.stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ContractResponse get(Long id) {
        SupplyContract c = findContract(id);
        StoreAccess.requireCanManage(c.getStore());
        return toResponse(c);
    }

    // ===================== BƯỚC 1: SHOP GỬI YÊU CẦU =====================

    @Transactional
    public ContractResponse create(CreateRequest req) {
        if (CurrentUser.isWarehouse() && !CurrentUser.isAdmin()) {
            throw new ForbiddenException("Từ chối: Nhân sự kho không lập yêu cầu hợp đồng thay cửa hàng!");
        }
        if (req.getStoreId() == null) {
            throw new RuntimeException("Lỗi: Thiếu thông tin gian hàng!");
        }
        Warehouse store = findWarehouse(req.getStoreId());
        if (!"KHO_CUA_HANG".equalsIgnoreCase(store.getLoaiHinh())) {
            throw new RuntimeException("Lỗi: Bên nhận hàng phải là Kho Cửa Hàng!");
        }
        StoreAccess.requireCanManage(store);
        Warehouse central = resolveCentralWarehouse(req.getKhoTongId());

        if (req.getDanhSachHang() == null || req.getDanhSachHang().isEmpty()) {
            throw new RuntimeException("Lỗi: Vui lòng chọn ít nhất 1 sản phẩm!");
        }

        SupplyContract c = new SupplyContract();
        c.setMaHopDong(generateCode(store));
        c.setTrangThai(CHO_ADMIN_DUYET);

        // 🌟 SỬA: Gán trực tiếp Object thay vì gán ID và chuỗi String
        c.setStore(store);
        c.setKhoTong(central);

        c.setNguoiYeuCauId(CurrentUser.id());
        c.setNguoiYeuCau(firstNonBlank(req.getNguoiYeuCau(), CurrentUser.account(), "Chủ Shop"));
        c.setChucVuYeuCau(firstNonBlank(req.getChucVuYeuCau(), "Chủ Cửa Hàng / Đại Diện Gian Hàng"));
        c.setNgayTao(LocalDateTime.now());

        Map<Long, Integer> qtyByProduct = new LinkedHashMap<>();
        for (ItemRequest it : req.getDanhSachHang()) {
            if (it.getSanPhamId() == null || it.getSoLuong() == null || it.getSoLuong() <= 0) {
                throw new RuntimeException("Lỗi: Mỗi sản phẩm phải có mã và số lượng lớn hơn 0!");
            }
            qtyByProduct.merge(it.getSanPhamId(), it.getSoLuong(), Integer::sum);
        }

        BigDecimal tong = BigDecimal.ZERO;
        int tongSoLuong = 0;
        for (Map.Entry<Long, Integer> e : qtyByProduct.entrySet()) {
            Product p = productRepository.findById(e.getKey())
                    .orElseThrow(() -> new RuntimeException("Lỗi: Không tìm thấy sản phẩm ID " + e.getKey()));
            Inventory centralInv = inventoryRepository.findBySanPhamAndKhoHang(p, central)
                    .orElseThrow(() -> new RuntimeException("Lỗi: Kho Tổng không có sản phẩm " + p.getTenSanPham() + "!"));
            if (centralInv.getSoLuongKhaDung() < e.getValue()) {
                throw new RuntimeException("Lỗi: Kho Tổng chỉ còn " + centralInv.getSoLuongKhaDung()
                        + " sản phẩm " + p.getTenSanPham() + "!");
            }

            BigDecimal donGiaSi = wholesalePrice(p);
            BigDecimal thanhTien = donGiaSi.multiply(BigDecimal.valueOf(e.getValue()));

            SupplyContractItem item = new SupplyContractItem();
            item.setHopDong(c);

            // 🌟 SỬA: Gán Object Product
            item.setSanPham(p);
            item.setSoLuong(e.getValue());
            item.setDonGiaSi(donGiaSi);
            item.setThanhTien(thanhTien);
            c.getDanhSachHang().add(item);

            tong = tong.add(thanhTien);
            tongSoLuong += e.getValue();
        }
        c.setTongTien(tong);
        c.setSoLuongMatHang(c.getDanhSachHang().size());
        c.setTongSoLuongHang(tongSoLuong);

        return toResponse(contractRepository.save(c));
    }

    // ===================== BƯỚC 2: ADMIN DUYỆT VÒNG 1 =====================

    @Transactional
    public ContractResponse approveRequest(Long id, String note) {
        SupplyContract c = findContract(id);
        if (!CurrentUser.isAdmin()) {
            StoreAccess.requireCanManage(c.getStore());
        }
        requireStatus(c, CHO_ADMIN_DUYET, "duyệt yêu cầu");
        c.setTrangThai(CHO_SHOP_KY);
        c.setDuyet1Nguoi(actorName());
        c.setDuyet1Ngay(LocalDateTime.now());
        c.setDuyet1GhiChu(firstNonBlank(note, "Đã thẩm định yêu cầu, cho phép chủ cửa hàng ký số hợp đồng."));
        return toResponse(c);
    }

    // ===================== BƯỚC 3: SHOP KÝ SỐ =====================

    @Transactional
    public ContractResponse sign(Long id, SignRequest req) {
        SupplyContract c = findContract(id);
        StoreAccess.requireCanManage(c.getStore());
        if (CurrentUser.isWarehouse() && !CurrentUser.isAdmin()) {
            throw new ForbiddenException("Từ chối: Chỉ đại diện cửa hàng mới được ký hợp đồng!");
        }
        requireStatus(c, CHO_SHOP_KY, "ký số");
        if (req == null || req.getSignerName() == null || req.getSignerName().isBlank()) {
            throw new RuntimeException("Lỗi: Vui lòng nhập họ tên người đại diện ký hợp đồng!");
        }
        if (!Boolean.TRUE.equals(req.getAgreedTerms())) {
            throw new RuntimeException("Lỗi: Vui lòng chấp thuận các điều khoản hợp đồng!");
        }
        if (req.getSignaturePin() == null || !MessageDigest.isEqual(
                req.getSignaturePin().getBytes(StandardCharsets.UTF_8), signPin.getBytes(StandardCharsets.UTF_8))) {
            throw new RuntimeException("Lỗi: Mã PIN ký số không chính xác!");
        }

        LocalDateTime now = LocalDateTime.now();
        c.setTrangThai(DA_KY_CHO_DUYET_KHO);
        c.setKyNguoi(req.getSignerName().trim());
        c.setKyChucVu(firstNonBlank(req.getSignerRole(), "Chủ Cửa Hàng / Đại Diện Pháp Luật"));
        c.setKyNgay(now);
        c.setKyMaChuKySo(signatureHash(c, now));
        return toResponse(c);
    }

    // ===================== BƯỚC 4: ADMIN DUYỆT VÒNG 2 =====================

    @Transactional
    public ContractResponse approveTransfer(Long id, String note) {
        SupplyContract c = findContract(id);
        if (!CurrentUser.isAdmin()) {
            StoreAccess.requireCanManage(c.getStore());
        }
        requireStatus(c, DA_KY_CHO_DUYET_KHO, "duyệt chuyển kho");
        c.setTrangThai(CHUYEN_QUA_KHO);
        c.setDuyet2Nguoi(actorName());
        c.setDuyet2Ngay(LocalDateTime.now());
        c.setDuyet2GhiChu(firstNonBlank(note, "Hợp đồng đã có chữ ký số hợp lệ. Chuyển lệnh xuất kho sang Kho Tổng."));
        return toResponse(c);
    }

    // ===================== BƯỚC 5: THỦ KHO DUYỆT LỆNH XUẤT =====================

    @Transactional
    public ContractResponse warehouseManagerApprove(Long id, String note) {
        SupplyContract c = findContract(id);
        if (!CurrentUser.isAdmin() && !CurrentUser.isWarehouse()) {
            StoreAccess.requireCanManage(c.getStore());
        }
        requireStatus(c, CHUYEN_QUA_KHO, "thủ kho duyệt xuất kho");
        c.setTrangThai(THU_KHO_DA_DUYET);
        c.setThuKhoDuyetNguoi(actorName());
        c.setThuKhoDuyetNgay(LocalDateTime.now());
        c.setThuKhoDuyetGhiChu(firstNonBlank(note, "Thủ kho đã duyệt yêu cầu xuất kho. Chuyển nhân viên soạn hàng và lên đơn xuất kho."));
        return toResponse(c);
    }

    // ===================== BƯỚC 6: NHÂN VIÊN LÊN ĐƠN & KHO TỔNG XUẤT HÀNG =====================

    @Transactional
    public ContractResponse dispatch(Long id, String shippingProvider) {
        SupplyContract c = findContract(id);
        if (!CurrentUser.isAdmin() && !CurrentUser.isWarehouse()) {
            StoreAccess.requireCanManage(c.getStore());
        }
        requireStatusAny(c, Set.of(THU_KHO_DA_DUYET, CHUYEN_QUA_KHO), "lên đơn và xuất kho");

        // 🌟 SỬA: Lấy trực tiếp từ object
        Warehouse central = c.getKhoTong();
        Warehouse store = c.getStore();

        ExportNote note = new ExportNote();
        note.setMaPhieuXuat("PX-HD-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        note.setLoaiXuat("XUAT_CUNG_UNG_CUA_HANG");
        note.setKhoHang(central);
        note.setKhoNhan(store);
        note.setTenShop(store.getTenKho());
        note.setDiaChiNhan(store.getDiaChi());
        note.setNguoiTao(actorName());
        note.setNgayXuat(LocalDateTime.now());
        note.setTrangThai(NoteStatus.XUAT_HOAN_THANH);
        note.setDaGiuCho(false);
        shippingProviderRepository.findAll().stream().findFirst().ifPresent(note::setDonViVanChuyen);
        note = exportNoteRepository.save(note);

        for (SupplyContractItem item : c.getDanhSachHang()) {
            // 🌟 SỬA: Lấy trực tiếp đối tượng từ khóa ngoại
            Product p = item.getSanPham();
            Inventory inv = inventoryRepository.findBySanPhamAndKhoHang(p, central)
                    .orElseThrow(() -> new RuntimeException("Lỗi: Kho Tổng không còn sản phẩm " + p.getTenSanPham() + "!"));
            int qty = item.getSoLuong();
            if (inv.getSoLuongKhaDung() < qty || inv.getSoLuongThucTe() < qty) {
                throw new RuntimeException("Lỗi: Kho Tổng không đủ hàng " + p.getTenSanPham()
                        + " (khả dụng " + inv.getSoLuongKhaDung() + ", cần " + qty + ")!");
            }
            int truoc = inv.getSoLuongThucTe();
            inv.setSoLuongThucTe(truoc - qty);
            inv.setSoLuongKhaDung(inv.getSoLuongKhaDung() - qty);
            inventoryRepository.save(inv);

            ExportNoteDetail d = new ExportNoteDetail();
            d.setPhieuXuat(note);
            d.setSanPham(p);
            d.setSoLuong(qty);
            d.setDonGia(item.getDonGiaSi().doubleValue());
            exportNoteDetailRepository.save(d);

            writeStockCard(central, p, TK_XUAT_CUNG_UNG, c.getMaHopDong(), null, note.getId(), truoc, qty, inv.getSoLuongThucTe());
        }

        c.setTrangThai(DANG_GIAO_HANG);
        c.setXuatPhieuId(note.getId());
        c.setXuatMaPhieu(note.getMaPhieuXuat());
        c.setXuatNguoi(actorName());
        c.setXuatNgay(LocalDateTime.now());
        c.setXuatDonViVanChuyen(firstNonBlank(shippingProvider, "CTUT Express Logistics"));
        return toResponse(c);
    }

    // ===================== BƯỚC 6: SHOP NHẬN HÀNG =====================

    @Transactional
    public ContractResponse complete(Long id) {
        SupplyContract c = findContract(id);

        // 🌟 SỬA: Lấy trực tiếp từ object
        Warehouse store = c.getStore();
        StoreAccess.requireCanManage(store);

        if (CurrentUser.isWarehouse() && !CurrentUser.isAdmin()) {
            throw new ForbiddenException("Từ chối: Chỉ cửa hàng nhận hàng mới được xác nhận!");
        }
        requireStatus(c, DANG_GIAO_HANG, "xác nhận nhận hàng");

        for (SupplyContractItem item : c.getDanhSachHang()) {
            // 🌟 SỬA: Lấy trực tiếp
            Product p = item.getSanPham();
            Inventory inv = inventoryRepository.findBySanPhamAndKhoHang(p, store).orElseGet(() -> {
                Inventory n = new Inventory();
                n.setSanPham(p);
                n.setKhoHang(store);
                n.setSoLuongThucTe(0);
                n.setSoLuongKhaDung(0);
                n.setGiaBanHienTai(p.getGiaBan() != null ? BigDecimal.valueOf(p.getGiaBan()) : null);
                n.setDangBan(false);
                return n;
            });
            int truoc = inv.getSoLuongThucTe();
            inv.setSoLuongThucTe(truoc + item.getSoLuong());
            inv.setSoLuongKhaDung(inv.getSoLuongKhaDung() + item.getSoLuong());
            inventoryRepository.save(inv);

            writeStockCard(store, p, TK_NHAP_TU_KHO_TONG, c.getMaHopDong(), null, c.getXuatPhieuId(),
                    truoc, item.getSoLuong(), inv.getSoLuongThucTe());
        }

        c.setTrangThai(HOAN_THANH);
        c.setNgayHoanThanh(LocalDateTime.now());
        c.setNguoiNhanHang(actorName());
        return toResponse(c);
    }

    // ===================== TỪ CHỐI =====================

    @Transactional
    public ContractResponse reject(Long id, String reason) {
        SupplyContract c = findContract(id);
        String st = c.getTrangThai();
        boolean allowed;
        if (CurrentUser.isAdmin()) {
            allowed = Set.of(CHO_ADMIN_DUYET, CHO_SHOP_KY, DA_KY_CHO_DUYET_KHO, CHUYEN_QUA_KHO, THU_KHO_DA_DUYET).contains(st);
        } else if (CurrentUser.isWarehouse()) {
            allowed = Set.of(CHUYEN_QUA_KHO, THU_KHO_DA_DUYET).contains(st);
        } else {
            StoreAccess.requireCanManage(c.getStore());
            allowed = Set.of(CHO_ADMIN_DUYET, CHO_SHOP_KY).contains(st);
        }
        if (!allowed) {
            throw new RuntimeException("Lỗi: Không thể từ chối hợp đồng ở trạng thái [" + st + "]!");
        }
        c.setTrangThai(TU_CHOI);
        c.setLyDoTuChoi(firstNonBlank(reason, "Không đủ điều kiện cung ứng"));
        c.setNguoiTuChoi(actorName());
        c.setNgayTuChoi(LocalDateTime.now());
        return toResponse(c);
    }

    // ===================== HÀM HỖ TRỢ =====================

    private SupplyContract findContract(Long id) {
        return contractRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Lỗi: Không tìm thấy hợp đồng ID = " + id));
    }

    private Warehouse findWarehouse(Long id) {
        return warehouseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Lỗi: Không tìm thấy kho/gian hàng ID = " + id));
    }

    private Warehouse resolveCentralWarehouse(Long requestedId) {
        if (requestedId != null) {
            try {
                Warehouse w = findWarehouse(requestedId);
                if (!"KHO_CUA_HANG".equalsIgnoreCase(w.getLoaiHinh())) {
                    return w;
                }
            } catch (Exception ignored) {
            }
        }
        List<Warehouse> all = warehouseRepository.findAll();
        return all.stream().filter(w -> "KHO_TONG".equalsIgnoreCase(w.getLoaiHinh())).findFirst()
                .or(() -> all.stream().filter(w -> !"KHO_CUA_HANG".equalsIgnoreCase(w.getLoaiHinh())).findFirst())
                .orElseThrow(() -> new RuntimeException("Lỗi: Hệ thống chưa có Kho Tổng!"));
    }

    private BigDecimal wholesalePrice(Product p) {
        if (p.getGiaNhap() != null && p.getGiaNhap() > 0) {
            return BigDecimal.valueOf(p.getGiaNhap()).setScale(0, RoundingMode.HALF_UP);
        }
        if (p.getGiaBan() != null && p.getGiaBan() > 0) {
            return BigDecimal.valueOf(p.getGiaBan() * 0.9).setScale(0, RoundingMode.HALF_UP);
        }
        throw new RuntimeException("Lỗi: Sản phẩm " + p.getTenSanPham() + " chưa có giá, không thể lập hợp đồng!");
    }

    private void requireStatus(SupplyContract c, String expected, String action) {
        if (!expected.equals(c.getTrangThai())) {
            throw new RuntimeException("Lỗi: Không thể " + action + " khi hợp đồng đang ở trạng thái [" + c.getTrangThai() + "]!");
        }
    }

    private void requireStatusAny(SupplyContract c, Set<String> expected, String action) {
        if (!expected.contains(c.getTrangThai())) {
            throw new RuntimeException("Lỗi: Không thể " + action + " khi hợp đồng đang ở trạng thái [" + c.getTrangThai() + "]!");
        }
    }

    private String generateCode(Warehouse store) {
        String base = "HDCU-" + LocalDateTime.now().getYear() + "/" + (store.getMaKho() != null ? store.getMaKho() : "STORE") + "-";
        String code;
        do {
            code = base + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        } while (contractRepository.existsByMaHopDong(code));
        return code;
    }

    private String signatureHash(SupplyContract c, LocalDateTime signedAt) {
        try {
            // 🌟 SỬA: Lấy dữ liệu qua các đối tượng Entity
            StringBuilder sb = new StringBuilder()
                    .append(c.getMaHopDong()).append('|').append(c.getStore().getId()).append('|')
                    .append(c.getKhoTong().getId()).append('|').append(c.getTongTien().toPlainString()).append('|')
                    .append(c.getKyNguoi()).append('|').append(signedAt);
            for (SupplyContractItem i : c.getDanhSachHang()) {
                sb.append('|').append(i.getSanPham().getId()).append('x').append(i.getSoLuong()).append('@').append(i.getDonGiaSi().toPlainString());
            }
            byte[] hash = MessageDigest.getInstance("SHA-256").digest(sb.toString().getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder();
            for (int k = 0; k < 8; k++) hex.append(String.format("%02X", hash[k]));
            return "DS-SHA256-" + hex;
        } catch (Exception e) {
            throw new RuntimeException("Lỗi tạo chữ ký số: " + e.getMessage(), e);
        }
    }

    private void writeStockCard(Warehouse kho, Product p, String loai, String maChungTu, Long phieuNhapId, Long phieuXuatId,
                                int truoc, int bienDong, int sau) {
        TheKho tk = new TheKho();
        tk.setKhoCuaHang(kho);
        tk.setHangHoa(p);
        tk.setLoaiGiaoDich(loai);
        tk.setMaChungTu(maChungTu);
        tk.setPhieuNhapId(phieuNhapId);
        tk.setPhieuXuatId(phieuXuatId);
        tk.setSoLuongTruocBienDong(truoc);
        tk.setSoLuongBienDong(bienDong);
        tk.setSoLuongSauBienDong(sau);
        tk.setNgayTao(LocalDateTime.now());
        theKhoRepository.save(tk);
    }

    private String actorName() {
        String acc = CurrentUser.account();
        return acc != null ? acc : "Hệ thống";
    }

    private static String firstNonBlank(String... values) {
        for (String v : values) {
            if (v != null && !v.isBlank()) return v.trim();
        }
        return null;
    }

    private ContractResponse toResponse(SupplyContract c) {
        // 🌟 SỬA: Lấy thông tin trích xuất thông qua đối tượng ngoại (Lazy loading)
        return ContractResponse.builder()
                .id(c.getId())
                .maHopDong(c.getMaHopDong())
                .trangThai(c.getTrangThai())
                .ngayTao(c.getNgayTao())

                // Trích xuất thông tin Store
                .storeId(c.getStore() != null ? c.getStore().getId() : null)
                .tenKhoCuaHang(c.getStore() != null ? c.getStore().getTenKho() : null)
                .maKhoCuaHang(c.getStore() != null ? c.getStore().getMaKho() : null)

                // Trích xuất thông tin Kho Tổng
                .khoTongId(c.getKhoTong() != null ? c.getKhoTong().getId() : null)
                .khoCungUng(c.getKhoTong() != null ? c.getKhoTong().getTenKho() : null)
                .diaChiKhoCungUng(c.getKhoTong() != null ? c.getKhoTong().getDiaChi() : null)
                .soDienThoaiKhoCungUng(c.getKhoTong() != null ? c.getKhoTong().getSoDienThoai() : null)

                .tongTien(c.getTongTien())
                .soLuongMatHang(c.getSoLuongMatHang())
                .tongSoLuongHang(c.getTongSoLuongHang())
                .nguoiYeuCau(c.getNguoiYeuCau())
                .chucVuYeuCau(c.getChucVuYeuCau())

                // Trích xuất thông tin Chi tiết mặt hàng
                .danhSachHang(c.getDanhSachHang().stream().map(i -> ItemResponse.builder()
                        .sanPhamId(i.getSanPham() != null ? i.getSanPham().getId() : null)
                        .sku(i.getSanPham() != null ? i.getSanPham().getSku() : null)
                        .tenHangHoa(i.getSanPham() != null ? i.getSanPham().getTenSanPham() : null)
                        .donViTinh(i.getSanPham() != null ? i.getSanPham().getDonViTinh() : null)
                        .danhMuc(i.getSanPham() != null && i.getSanPham().getDanhMuc() != null ? i.getSanPham().getDanhMuc().getTenDanhMuc() : null)
                        .hinhAnh(i.getSanPham() != null ? i.getSanPham().getHinhAnh() : null)
                        .soLuong(i.getSoLuong())
                        .donGiaSi(i.getDonGiaSi())
                        .thanhTien(i.getThanhTien())
                        .build()).collect(Collectors.toList()))

                .adminDuyetVong1(Approval.builder().daDuyet(c.getDuyet1Ngay() != null).nguoiDuyet(c.getDuyet1Nguoi())
                        .ngayDuyet(c.getDuyet1Ngay()).ghiChu(c.getDuyet1GhiChu()).build())
                .chuKyShop(Signature.builder().daKy(c.getKyNgay() != null).nguoiKy(c.getKyNguoi()).chucVu(c.getKyChucVu())
                        .maChuKySo(c.getKyMaChuKySo()).ngayKy(c.getKyNgay()).build())
                .adminDuyetVong2(Approval.builder().daDuyet(c.getDuyet2Ngay() != null).nguoiDuyet(c.getDuyet2Nguoi())
                        .ngayDuyet(c.getDuyet2Ngay()).ghiChu(c.getDuyet2GhiChu()).build())
                .thuKhoDuyet(Approval.builder().daDuyet(c.getThuKhoDuyetNgay() != null).nguoiDuyet(c.getThuKhoDuyetNguoi())
                        .ngayDuyet(c.getThuKhoDuyetNgay()).ghiChu(c.getThuKhoDuyetGhiChu()).build())
                .thongTinXuatKho(Dispatch.builder().daLenDon(c.getXuatNgay() != null).phieuXuatId(c.getXuatPhieuId())
                        .maPhieuXuat(c.getXuatMaPhieu()).nguoiXuat(c.getXuatNguoi()).ngayXuat(c.getXuatNgay())
                        .donViVanChuyen(c.getXuatDonViVanChuyen()).build())
                .ngayHoanThanh(c.getNgayHoanThanh())
                .nguoiNhanHang(c.getNguoiNhanHang())
                .lyDoTuChoi(c.getLyDoTuChoi())
                .nguoiTuChoi(c.getNguoiTuChoi())
                .ngayTuChoi(c.getNgayTuChoi())
                .build();
    }
}