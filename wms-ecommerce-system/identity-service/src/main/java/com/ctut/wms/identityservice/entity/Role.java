/**
 * ==============================================================================
 * Entity: Role
 * Phân hệ: Identity Service (Quản lý định danh & Phân quyền RBAC - Port 8084)
 * Mô tả: Thực thể cơ sở dữ liệu ánh xạ bảng lưu trữ dữ liệu Role trong cơ sở dữ liệu.
 * ==============================================================================
 */
package com.ctut.wms.identityservice.entity;

import jakarta.persistence.*;
import lombok.*;

@Table(name = "vai_tro")
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@Entity
public final class Role {
    @Id
    @GeneratedValue(strategy =  GenerationType.IDENTITY)
    private Long id;

    @Column(name = "ma_vai_tro", unique = true, length = 50 )
    private String maVaiTro;

    @Column(name = "ten_vai_tro", length = 20)
    private String tenVaiTro;

}
