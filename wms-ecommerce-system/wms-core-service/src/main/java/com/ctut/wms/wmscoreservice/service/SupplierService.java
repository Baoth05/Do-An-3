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
import com.ctut.wms.wmscoreservice.repository.ProductRepository; // Thêm thư viện này
import com.ctut.wms.wmscoreservice.repository.SupplierRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional; // Thêm thư viện này để dùng Optional
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SupplierService {

    private final SupplierRepository supplierRepository;

    // 🌟 BỔ SUNG: Gọi Repository của sản phẩm để tra cứu SKU
    private final ProductRepository productRepository;

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

                // 🌟 BẢO VỆ DỮ LIỆU: Kiểm tra SKU đã tồn tại chưa trước khi tạo
                if (productRepository.findBySku(prodReq.getSku()).isPresent()) {
                    throw new RuntimeException("Lỗi: Mã SKU '" + prodReq.getSku() + "' đã tồn tại trong hệ thống!");
                }

                Product product = new Product();
                // Giữ lại logic gán đơn vị tính tuyệt vời của cậu
                product.setDonViTinh(prodReq.getDonViTinh() != null ? prodReq.getDonViTinh() : "CAI");
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

    public Supplier getSupplierById(Long id) {
        return supplierRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Lỗi: Không tìm thấy Nhà cung cấp!"));
    }

    @Transactional
    public void deleteSupplier(Long id) {
        Supplier supplier = supplierRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Nhà cung cấp!"));

        // Nhờ cơ chế orphanRemoval = true, khi xóa Supplier,
        // các Product thuộc về Supplier này cũng sẽ tự động bị xóa theo.
        supplierRepository.delete(supplier);
    }

    @Transactional
    public Supplier updateSupplier(Long id, SupplierRequest request) {
        // 1. Tìm nhà cung cấp cũ trong CSDL
        Supplier supplier = supplierRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Lỗi: Không tìm thấy Nhà cung cấp!"));

        // 2. Cập nhật thông tin cơ bản

        supplier.setChucVuNguoiLienHe(request.getChucVuNguoiLienHe());
        supplier.setMaNhaCungCap(request.getMaNhaCungCap());
        supplier.setTenNhaCungCap(request.getTenNhaCungCap());
        supplier.setNguoiLienHe(request.getNguoiLienHe());
        supplier.setSoDienThoai(request.getSoDienThoai());
        supplier.setEmail(request.getEmail());
        supplier.setDiaChi(request.getDiaChi());

        // 3. Xử lý danh sách sản phẩm hợp đồng
        if (request.getDanhSachSanPham() != null) {

            // Xóa các sản phẩm cũ không còn nằm trong danh sách cập nhật mới
            List<Long> requestedIds = request.getDanhSachSanPham().stream()
                    .map(ProductRequest::getId)
                    .filter(prodId -> prodId != null) // Đổi tên biến tránh nhầm lẫn 'id'
                    .collect(Collectors.toList());

            supplier.getDanhSachSanPham().removeIf(p -> p.getId() != null && !requestedIds.contains(p.getId()));

            for (ProductRequest prodReq : request.getDanhSachSanPham()) {
                if (prodReq.getId() != null) {
                    // Nếu có ID -> Đây là sản phẩm cũ, cập nhật lại thông tin
                    Product existingProd = supplier.getDanhSachSanPham().stream()
                            .filter(p -> p.getId().equals(prodReq.getId()))
                            .findFirst()
                            .orElse(null);

                    if (existingProd != null) {

                        // 🌟 BẢO VỆ DỮ LIỆU: Đảm bảo khi sửa SKU không bị trùng với mã của sản phẩm khác
                        Optional<Product> existBySku = productRepository.findBySku(prodReq.getSku());
                        if (existBySku.isPresent() && !existBySku.get().getId().equals(prodReq.getId())) {
                            throw new RuntimeException("Lỗi: Mã SKU '" + prodReq.getSku() + "' đã bị trùng với một sản phẩm khác!");
                        }

                        existingProd.setSku(prodReq.getSku());
                        existingProd.setTenSanPham(prodReq.getTenSanPham());
                        existingProd.setGiaBan(prodReq.getGiaBan());
                        existingProd.setGiaNhap(prodReq.getGiaNhap());
                    }
                } else {
                    // Nếu không có ID -> Đây là sản phẩm mới hợp tác, tạo mới

                    // 🌟 BẢO VỆ DỮ LIỆU: Kiểm tra SKU trước khi thêm mới vào hợp đồng
                    if (productRepository.findBySku(prodReq.getSku()).isPresent()) {
                        throw new RuntimeException("Lỗi: Mã SKU '" + prodReq.getSku() + "' đã tồn tại trong hệ thống!");
                    }

                    Product newProduct = new Product();

                    newProduct.setDonViTinh(prodReq.getDonViTinh() != null ? prodReq.getDonViTinh() : "CAI");
                    newProduct.setSku(prodReq.getSku());
                    newProduct.setTenSanPham(prodReq.getTenSanPham());
                    newProduct.setGiaBan(prodReq.getGiaBan());
                    newProduct.setGiaNhap(prodReq.getGiaNhap());
                    newProduct.setNhaCungCap(supplier);

                    supplier.getDanhSachSanPham().add(newProduct);
                }
            }
        }

        // Lưu toàn bộ thay đổi xuống CSDL
        return supplierRepository.save(supplier);
    }
}