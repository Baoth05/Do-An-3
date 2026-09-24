package com.ctut.wms.wmscoreservice.entity.shipping;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "don_vi_van_chuyen")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ShippingProvider {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "ten_don_vi", nullable = false)
    private String tenDonVi;

    @Column(name = "thong_tin_lien_he")
    private String thongTinLienHe;
}
