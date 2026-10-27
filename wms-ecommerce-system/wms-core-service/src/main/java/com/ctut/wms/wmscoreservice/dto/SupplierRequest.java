/**
 * ==============================================================================
 * DTO (Data Transfer Object): SupplierRequest
 * Phân hệ: WMS Core Service (Quản lý kho cốt lõi & Tồn kho 2 tầng - Port 8081)
 * Mô tả: Đối tượng truyền tải dữ liệu đóng gói thông tin đầu vào/đầu ra cho API SupplierRequest.
 * ==============================================================================
 */
package com.ctut.wms.wmscoreservice.dto;



import com.ctut.wms.wmscoreservice.dto.product.ProductRequest;
import lombok.Data;
import java.util.List;

@Data
public class SupplierRequest {
    private String maNhaCungCap;
    private String tenNhaCungCap;
    private String nguoiLienHe;
    private String soDienThoai;
    private String email;
    private String diaChi;

    // 🌟 QUAN TRỌNG: Danh sách sản phẩm ký hợp đồng
    private List<ProductRequest> danhSachSanPham;
}