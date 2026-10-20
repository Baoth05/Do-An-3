package com.ctut.wms.wmscoreservice.service.product;

import com.ctut.wms.wmscoreservice.dto.product.ProductRequest;
import com.ctut.wms.wmscoreservice.dto.product.ProductResponse;
import com.ctut.wms.wmscoreservice.entity.category.Category;
import com.ctut.wms.wmscoreservice.entity.product.Product;
import com.ctut.wms.wmscoreservice.repository.category.CategoryRepository;
import com.ctut.wms.wmscoreservice.repository.product.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;

    // --- TẠO SẢN PHẨM MỚI ---
    @Transactional
    public ProductResponse createProduct(ProductRequest request) {
        // 1. Kiểm tra mã SKU có bị trùng không
        if (productRepository.findBySku(request.getSku()).isPresent()) {
            throw new RuntimeException("Lỗi: Mã SKU đã tồn tại trong hệ thống!");
        }

        // 2. Tìm danh mục theo ID (nếu có)
        Category category = null;
        if (request.getDanhMucId() != null) {
            category = categoryRepository.findById(request.getDanhMucId()).orElse(null);
        }

        // 3. Chuyển đổi dữ liệu từ DTO sang Entity để lưu vào Database
        Product product = new Product();
        product.setSku(request.getSku());
        product.setTenSanPham(request.getTenSanPham());
        product.setDonViTinh(request.getDonViTinh());
        product.setGiaBan(request.getGiaBan());
        product.setGiaNhap(request.getGiaNhap());
        product.setMoTa(request.getMoTa());
        product.setHinhAnh(request.getHinhAnh());
        product.setKhoiLuong(request.getKhoiLuong());
        if (request.getTrangThai() != null) {
            product.setTrangThai(request.getTrangThai());
        }
        product.setDanhMuc(category);

        Product savedProduct = productRepository.save(product);

        // 4. Đóng gói kết quả trả về
        return mapToResponse(savedProduct);
    }

    // --- LẤY DANH SÁCH TOÀN BỘ SẢN PHẨM ---
    public List<ProductResponse> getAllProducts() {
        List<Product> products = productRepository.findAll();

        return products.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    // --- LẤY CHI TIẾT SẢN PHẨM THEO ID ---
    public ProductResponse getProductById(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Lỗi: Không tìm thấy sản phẩm có ID = " + id));
        return mapToResponse(product);
    }

    // --- CẬP NHẬT SẢN PHẨM ---
    @Transactional
    public ProductResponse updateProduct(Long id, ProductRequest request) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Lỗi: Không tìm thấy sản phẩm có ID = " + id));

        if (request.getTenSanPham() != null) product.setTenSanPham(request.getTenSanPham());
        if (request.getSku() != null) product.setSku(request.getSku());
        if (request.getDonViTinh() != null) product.setDonViTinh(request.getDonViTinh());
        if (request.getGiaBan() != null) product.setGiaBan(request.getGiaBan());
        if (request.getGiaNhap() != null) product.setGiaNhap(request.getGiaNhap());
        if (request.getMoTa() != null) product.setMoTa(request.getMoTa());
        if (request.getHinhAnh() != null) product.setHinhAnh(request.getHinhAnh());
        if (request.getKhoiLuong() != null) product.setKhoiLuong(request.getKhoiLuong());
        if (request.getTrangThai() != null) product.setTrangThai(request.getTrangThai());

        if (request.getDanhMucId() != null) {
            Category category = categoryRepository.findById(request.getDanhMucId()).orElse(null);
            product.setDanhMuc(category);
        }

        return mapToResponse(productRepository.save(product));
    }

    // --- XÓA SẢN PHẨM ---
    @Transactional
    public void deleteProduct(Long id) {
        if (!productRepository.existsById(id)) {
            throw new RuntimeException("Lỗi: Không tìm thấy sản phẩm có ID = " + id);
        }
        productRepository.deleteById(id);
    }

    // Hàm phụ trợ giúp chuyển đổi nhanh từ Entity sang DTO
    private ProductResponse mapToResponse(Product product) {
        return ProductResponse.builder()
                .id(product.getId())
                .sku(product.getSku())
                .tenSanPham(product.getTenSanPham())
                .donViTinh(product.getDonViTinh())
                .tenDanhMuc(product.getDanhMuc() != null ? product.getDanhMuc().getTenDanhMuc() : null)
                .danhMucId(product.getDanhMuc() != null ? product.getDanhMuc().getId() : null)
                .giaBan(product.getGiaBan())
                .giaNhap(product.getGiaNhap())
                .moTa(product.getMoTa())
                .hinhAnh(product.getHinhAnh())
                .khoiLuong(product.getKhoiLuong())
                .trangThai(product.getTrangThai())
                .build();
    }
}