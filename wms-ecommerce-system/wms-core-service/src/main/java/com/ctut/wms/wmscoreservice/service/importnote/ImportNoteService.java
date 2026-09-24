package com.ctut.wms.wmscoreservice.service.importnote;

import com.ctut.wms.wmscoreservice.dto.importnote.ImportNoteDetailRequest;
import com.ctut.wms.wmscoreservice.dto.importnote.ImportNoteRequest;
import com.ctut.wms.wmscoreservice.entity.importnote.ImportNote;
import com.ctut.wms.wmscoreservice.entity.importnote.ImportNoteDetail;
import com.ctut.wms.wmscoreservice.entity.inventory.Inventory;
import com.ctut.wms.wmscoreservice.entity.product.Product;
import com.ctut.wms.wmscoreservice.entity.supplier.Supplier;
import com.ctut.wms.wmscoreservice.entity.warehouse.Warehouse;
import com.ctut.wms.wmscoreservice.repository.importnote.ImportNoteDetailRepository;
import com.ctut.wms.wmscoreservice.repository.importnote.ImportNoteRepository;
import com.ctut.wms.wmscoreservice.repository.inventory.InventoryRepository;
import com.ctut.wms.wmscoreservice.repository.product.ProductRepository;
import com.ctut.wms.wmscoreservice.repository.supplier.SupplierRepository;
import com.ctut.wms.wmscoreservice.repository.warehouse.WarehouseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ImportNoteService {

    private final ImportNoteRepository importNoteRepository;
    private final ImportNoteDetailRepository importNoteDetailRepository;
    private final SupplierRepository supplierRepository;
    private final WarehouseRepository warehouseRepository;
    private final ProductRepository productRepository;
    private final InventoryRepository inventoryRepository;

    @Transactional // Đảm bảo nếu lỗi ở bất kỳ bước nào, toàn bộ quá trình sẽ bị hủy để bảo vệ dữ liệu
    public ImportNote createImportNote(ImportNoteRequest request) {
        // 1. Kiểm tra đối tác và kho hàng
        Supplier supplier = supplierRepository.findById(request.getNhaCungCapId())
                .orElseThrow(() -> new RuntimeException("Lỗi: Không tìm thấy nhà cung cấp!"));
        Warehouse warehouse = warehouseRepository.findById(request.getKhoHangId())
                .orElseThrow(() -> new RuntimeException("Lỗi: Không tìm thấy kho hàng!"));

        // 2. Tạo khung Phiếu nhập
        ImportNote importNote = new ImportNote();
        importNote.setMaPhieuNhap("PN-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase()); // Tạo mã phiếu ngẫu nhiên
        importNote.setNhaCungCap(supplier);
        importNote.setKhoHang(warehouse);
        importNote.setNguoiTao(request.getNguoiTao());
        importNote.setTrangThai("ĐÃ NHẬP");

        // Lưu phiếu nhập trước để lấy ID
        ImportNote savedImportNote = importNoteRepository.save(importNote);
        BigDecimal tongTien = BigDecimal.ZERO;

        // 3. Xử lý từng món hàng trong danh sách gửi lên
        for (ImportNoteDetailRequest detailRequest : request.getDanhSachHangHoa()) {
            Product product = productRepository.findById(detailRequest.getSanPhamId())
                    .orElseThrow(() -> new RuntimeException("Lỗi: Không tìm thấy sản phẩm có ID " + detailRequest.getSanPhamId()));

            // A. Lưu chi tiết phiếu nhập
            ImportNoteDetail detail = new ImportNoteDetail();
            detail.setPhieuNhap(savedImportNote);
            detail.setSanPham(product);
            detail.setSoLuong(detailRequest.getSoLuong());
            detail.setGiaNhap(detailRequest.getGiaNhap());
            importNoteDetailRepository.save(detail);

            // B. Cộng tiền vào tổng tiền phiếu nhập
            BigDecimal thanhTien = detailRequest.getGiaNhap().multiply(BigDecimal.valueOf(detailRequest.getSoLuong()));
            tongTien = tongTien.add(thanhTien);

            // C. Tự động cộng dồn Tồn kho
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
        }

        // 4. Cập nhật lại tổng tiền cho phiếu nhập và lưu lần cuối
        savedImportNote.setTongTienNhap(tongTien);
        return importNoteRepository.save(savedImportNote);
    }
}