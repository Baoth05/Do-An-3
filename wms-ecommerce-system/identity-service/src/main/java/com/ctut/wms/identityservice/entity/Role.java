package com.ctut.wms.identityservice.entity;

import jakarta.persistence.*;
import lombok.*;

@Table(name = "vai_tro")
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@Entity
public class Role {
    @Id
    @GeneratedValue(strategy =  GenerationType.IDENTITY)
    private Long id;

    @Column(name = "ma_vai_tro", unique = true, length = 50 )
    private String maVaiTro;

    @Column(name = "ten_vai_tro", length = 20)
    private String tenVaiTro;

}
