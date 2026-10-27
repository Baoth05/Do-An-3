/**
 * ==============================================================================
 * Service: SupplierService
 * Phân hệ: WMS Core Service (Quản lý kho cốt lõi & Tồn kho 2 tầng - Port 8081)
 * Mô tả: Cung cấp logic nghiệp vụ, giao dịch cơ sở dữ liệu và xử lý dữ liệu cho SupplierService.
 * ==============================================================================
 */
package com.ctut.wms.wmscoreservice.service;

import com.ctut.wms.wmscoreservice.dto.SupplierRequest;
import com.ctut.wms.wmscoreservice.dto.product.ProductRequest;

import com.ctut.wms.wmscoreservice.entity.Product;
import com.ctut.wms.wmscoreservice.entity.Supplier;
import com.ctut.wms.wmscoreservice.repository.SupplierRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SupplierService {

    private final SupplierRepository supplierRepository;

    @Transactional // Đảm bảo nếu lỗi thì hoàn tác toàn bộ (cả Nhà cung cấp lẫn Sản phẩm)
    public Supplier createSupplier(SupplierRequest request) {
        Supplier supplier = new Supplier();
        supplier.setMaNhaCungCap(request.getMaNhaCungCap());
        supplier.setTenNhaCungCap(request.getTenNhaCungCap());
        supplier.setNguoiLienHe(request.getNguoiLienHe());
        supplier.setSoDienThoai(request.getSoDienThoai());
        supplier.setEmail(request.getEmail());
        supplier.setDiaChi(request.getDiaChi());
        supplier.setTrangThai("HOAT_DONG");

        // Gắn danh sách sản phẩm hợp đồng vào Nhà cung cấp này
        if (request.getDanhSachSanPham() != null) {
            for (ProductRequest prodReq : request.getDanhSachSanPham()) {
                Product product = new Product();
                product.setSku(prodReq.getSku());
                product.setTenSanPham(prodReq.getTenSanPham());
                product.setGiaBan(prodReq.getGiaBan());
                product.setGiaNhap(prodReq.getGiaNhap());
                // Gắn "chủ nhân" cho sản phẩm là Nhà cung cấp này
                product.setNhaCungCap(supplier);

                supplier.getDanhSachSanPham().add(product);
            }
        }

        // Nhờ cơ chế Cascade, khi lưu Supplier nó sẽ tự động lưu luôn các Product bên trong
        return supplierRepository.save(supplier);
    }

    public List<Supplier> getAllSuppliers() {
        return supplierRepository.findAll();
    }

    @Transactional
    public void deleteSupplier(Long id) {
        Supplier supplier = supplierRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Nhà cung cấp!"));

        // Nhờ cơ chế orphanRemoval = true, khi xóa Supplier,
        // các Product thuộc về Supplier này cũng sẽ tự động bị xóa theo.
        supplierRepository.delete(supplier);
    }
}