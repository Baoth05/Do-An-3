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

        // 2. Tìm danh mục theo ID
        Category category = categoryRepository.findById(request.getDanhMucId())
                .orElseThrow(() -> new RuntimeException("Lỗi: Không tìm thấy danh mục!"));

        // 3. Chuyển đổi dữ liệu từ DTO sang Entity để lưu vào Database
        Product product = new Product();
        product.setSku(request.getSku());
        product.setTenSanPham(request.getTenSanPham());
        product.setDonViTinh(request.getDonViTinh());
        product.setDanhMuc(category);

        Product savedProduct = productRepository.save(product);

        // 4. Đóng gói kết quả trả về
        return mapToResponse(savedProduct);
    }

    // --- LẤY DANH SÁCH TOÀN BỘ SẢN PHẨM ---
    public List<ProductResponse> getAllProducts() {
        List<Product> products = productRepository.findAll();

        // Dùng Stream API để duyệt qua danh sách Entity và biến đổi thành danh sách DTO
        return products.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    // Hàm phụ trợ giúp chuyển đổi nhanh từ Entity sang DTO
    private ProductResponse mapToResponse(Product product) {
        return new ProductResponse(
                product.getId(),
                product.getSku(),
                product.getTenSanPham(),
                product.getDonViTinh(),
                product.getDanhMuc().getTenDanhMuc()
        );
    }
}