package com.ctut.wms.wmscoreservice.entity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "kho_hang")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Warehouse {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "ma_kho", nullable = false, unique = true)
    private String maKho;

    @Column(name = "ten_kho", nullable = false)
    private String tenKho;

    @Column(name = "dia_chi")
    private String diaChi;
}
