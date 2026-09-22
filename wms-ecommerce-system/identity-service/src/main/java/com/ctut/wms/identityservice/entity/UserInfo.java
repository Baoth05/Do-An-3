package com.ctut.wms.identityservice.entity;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "thong_tin_nguoi_dung")
@Setter
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class UserInfo {
    @Id
    private Long userId; // Không dùng GeneratedValue ở đây

    // Kết nối 1-1 với bảng User và dùng chung ID
    @OneToOne
    @MapsId
    @JoinColumn(name = "nguoi_dung_id")
    private User user;

    @Column(name = "ho_ten", length = 100)
    private String hoTen;

    @Column(name = "so_dien_thoai", length = 15)
    private String soDienThoai;

    @Column(name = "dia_chi")
    private String diaChi;

    @Column(name = "ngay_cap_nhat")
    private LocalDateTime ngayCapNhat;

    @Column(name = "ngay_sinh")
    private LocalDate ngaySinh;

    @Column(name = "gioi_tinh")
    private String gioiTinh;

    @Column(name = "anh_dai_dien")
    private String anhDaiDien;
}
