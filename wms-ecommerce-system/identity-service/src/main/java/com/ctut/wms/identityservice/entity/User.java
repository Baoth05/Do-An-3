package com.ctut.wms.identityservice.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;
@Entity
@Table(name = "nguoi_dung")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tai_khoan", unique = true, length =50)
    private String taiKhoan;

    @Column(name = "mat_khau")
    private String matKhau;

    @Column(name = "email", unique = true, length = 100)
    private String email;

    @Column(name = "trang_thai")
    private Boolean trangThai;

    @Column(name = "refresh_token")
    private String refreshToken;

    @Column(name = "token_expiry_date")
    private LocalDateTime tokenExpiryDate;

    @Column(name = "ngay_tao")
    private LocalDateTime ngayTao;

    @Column(name = "ngay_cap_nhat")
    private LocalDateTime ngayCapNhat;

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
            name = "nguoi_dung_vai_tro",
            joinColumns = @JoinColumn(name = "user_id"),
            inverseJoinColumns = @JoinColumn(name = "role_id")
    )
    private Set<Role> roles = new HashSet<>();

    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private UserInfo userInfo;
    public void generateRefreshToken() {
        // Logic will be implemented later
    }
    @Column(name = "vai_tro")
    private String vaiTro = "USER";

}



