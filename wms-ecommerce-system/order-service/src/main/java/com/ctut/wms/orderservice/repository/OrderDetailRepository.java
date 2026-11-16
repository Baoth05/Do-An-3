/**
 * ==============================================================================
 * Repository: OrderDetailRepository
 * Phân hệ: Order Service (Quản lý đơn hàng & Tách đơn đa shop - Port 8082)
 * Mô tả: Giao diện truy vấn dữ liệu Spring Data JPA thao tác với cơ sở dữ liệu cho OrderDetailRepository.
 * ==============================================================================
 */
package com.ctut.wms.orderservice.repository;

import com.ctut.wms.orderservice.entity.OrderDetail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface OrderDetailRepository extends JpaRepository<OrderDetail, Long> {

    // Người dùng đã mua & nhận sản phẩm (đơn hoàn thành hoặc đã giao) hay chưa
    @Query("select count(d) > 0 from OrderDetail d where d.donHang.nguoiDungId = :uid and d.maHangHoa = :ma "
            + "and (upper(d.donHang.trangThaiDonHang) = 'COMPLETED' or upper(d.donHang.trangThaiGiaoHang) = 'DELIVERED')")
    boolean hasPurchased(@Param("uid") Long nguoiDungId, @Param("ma") String maHangHoa);
}