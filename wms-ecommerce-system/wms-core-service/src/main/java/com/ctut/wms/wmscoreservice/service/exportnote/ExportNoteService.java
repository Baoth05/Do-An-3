package com.ctut.wms.wmscoreservice.service.exportnote;


import com.ctut.wms.wmscoreservice.dto.exportnote.ExportNoteDetailRequest;
import com.ctut.wms.wmscoreservice.dto.exportnote.ExportNoteRequest;
import com.ctut.wms.wmscoreservice.entity.exportnote.ExportNote;
import com.ctut.wms.wmscoreservice.entity.exportnote.ExportNoteDetail;
import com.ctut.wms.wmscoreservice.entity.inventory.Inventory;
import com.ctut.wms.wmscoreservice.entity.product.Product;
import com.ctut.wms.wmscoreservice.entity.shipping.ShippingProvider;
import com.ctut.wms.wmscoreservice.entity.warehouse.Warehouse;
import com.ctut.wms.wmscoreservice.repository.exportnote.ExportNoteDetailRepository;
import com.ctut.wms.wmscoreservice.repository.exportnote.ExportNoteRepository;
import com.ctut.wms.wmscoreservice.repository.inventory.InventoryRepository;
import com.ctut.wms.wmscoreservice.repository.product.ProductRepository;
import com.ctut.wms.wmscoreservice.repository.shipping.ShippingProviderRepository;
import com.ctut.wms.wmscoreservice.repository.warehouse.WarehouseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

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
    public ExportNote createExportNote(ExportNoteRequest request) {
        // 1. Kiểm tra Kho hàng và Đơn vị vận chuyển
        Warehouse warehouse = warehouseRepository.findById(request.getKhoHangId())
                .orElseThrow(() -> new RuntimeException("Lỗi: Không tìm thấy kho hàng!"));

        ShippingProvider shippingProvider = shippingProviderRepository.findById(request.getDonViVanChuyenId())
                .orElseThrow(() -> new RuntimeException("Lỗi: Không tìm thấy đơn vị vận chuyển!"));

        // 2. Khởi tạo Phiếu xuất
        ExportNote exportNote = new ExportNote();
        exportNote.setMaPhieuXuat("PX-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        exportNote.setDonHangId(request.getDonHangId());
        exportNote.setKhoHang(warehouse);
        exportNote.setDonViVanChuyen(shippingProvider);
        exportNote.setNguoiTao(request.getNguoiTao());
        exportNote.setNgayXuat(LocalDateTime.now());
        exportNote.setTrangThai("ĐÃ XUẤT");

        ExportNote savedExportNote = exportNoteRepository.save(exportNote);

        // 3. Xử lý trừ kho cho từng mặt hàng
        for (ExportNoteDetailRequest detailRequest : request.getDanhSachHangHoa()) {
            Product product = productRepository.findById(detailRequest.getSanPhamId())
                    .orElseThrow(() -> new RuntimeException("Lỗi: Không tìm thấy sản phẩm ID " + detailRequest.getSanPhamId()));

            // A. Kiểm tra tồn kho xem còn đủ hàng không
            Inventory inventory = inventoryRepository.findBySanPhamAndKhoHang(product, warehouse)
                    .orElseThrow(() -> new RuntimeException("Lỗi: Sản phẩm " + product.getTenSanPham() + " không có trong kho này!"));

            if (inventory.getSoLuongKhaDung() < detailRequest.getSoLuong()) {
                throw new RuntimeException("Lỗi: Không đủ hàng! Sản phẩm " + product.getTenSanPham() + " chỉ còn " + inventory.getSoLuongKhaDung());
            }

            // B. Trừ tồn kho
            inventory.setSoLuongThucTe(inventory.getSoLuongThucTe() - detailRequest.getSoLuong());
            inventory.setSoLuongKhaDung(inventory.getSoLuongKhaDung() - detailRequest.getSoLuong());
            inventoryRepository.save(inventory);

            // C. Lưu chi tiết phiếu xuất
            ExportNoteDetail detail = new ExportNoteDetail();
            detail.setPhieuXuat(savedExportNote);
            detail.setSanPham(product);
            detail.setSoLuong(detailRequest.getSoLuong());
            exportNoteDetailRepository.save(detail);
        }

        return savedExportNote;
    }
}