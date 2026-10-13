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

    @Column(name = "ma_hang_hoa", nullable = false)
    private String maHangHoa;

    @Column(name = "noi_dung", columnDefinition = "TEXT", nullable = false)
    private String noiDung;

    // CHỜ DUYỆT, ĐÃ DUYỆT, ẨN
    @Column(name = "trang_thai")
    private String trangThai = "ĐÃ DUYỆT";

    // 🌟 Kỹ thuật Tự tham chiếu (Self-referencing) để làm chức năng Trả lời (Reply)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    private BinhLuan parentComment; // Nếu đây là một câu trả lời, nó sẽ lưu lại ID của bình luận gốc

    @OneToMany(mappedBy = "parentComment", cascade = CascadeType.ALL)
    private List<BinhLuan> replies; // Danh sách các câu trả lời cho bình luận này
}