/**
 * ==============================================================================
 * Entity: BinhLuan
 * Phân hệ: Interaction Service (Đánh giá, nhận xét & hỏi đáp - Port 8083)
 * Mô tả: Thực thể cơ sở dữ liệu ánh xạ bảng lưu trữ dữ liệu BinhLuan trong cơ sở dữ liệu.
 * ==============================================================================
 */
package com.ctut.wms.interactionservice.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Entity
@Table(name = "binh_luan")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class BinhLuan extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "nguoi_dung_id", nullable = false)
    private Long nguoiDungId;

    @Column(name = "cua_hang_id")
    private Long cuaHangId; // Logical FK Gian hàng nơi sản phẩm được bình luận

    @Column(name = "ma_hang_hoa", nullable = false)
    private String maHangHoa;

    @Column(name = "noi_dung", columnDefinition = "TEXT", nullable = false)
    private String noiDung;

    // CHỜ DUYỆT, ĐÃ DUYỆT, ẨN
    @Column(name = "trang_thai")
    private String trangThai = "ĐÃ DUYỆT";

    // Kỹ thuật Tự tham chiếu (Self-referencing) để làm chức năng Trả lời (Reply)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    private BinhLuan parentComment;

    @OneToMany(mappedBy = "parentComment", cascade = CascadeType.ALL)
    private List<BinhLuan> replies;
}
