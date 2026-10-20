package com.ctut.wms.identityservice.config;

import com.ctut.wms.identityservice.entity.Role;
import com.ctut.wms.identityservice.repository.RoleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.Arrays;

@Component
@RequiredArgsConstructor
@Slf4j
public class RoleInitializer implements CommandLineRunner {

    private final RoleRepository roleRepository;

    @Override
    public void run(String... args) {
        // Kiểm tra xem bảng vai_tro có đang trống không
        if (roleRepository.count() == 0) {
            log.info("Bảng Vai Trò đang trống. Bắt đầu tự động nạp dữ liệu...");

            Role admin = new Role(); admin.setMaVaiTro("ADMIN"); admin.setTenVaiTro("Quản trị viên");
            Role thuKho = new Role(); thuKho.setMaVaiTro("THUKHO"); thuKho.setTenVaiTro("Thủ kho");
            Role nvKho = new Role(); nvKho.setMaVaiTro("NVKHO"); nvKho.setTenVaiTro("Nhân viên kho");
            Role customer = new Role(); customer.setMaVaiTro("CUSTOMER"); customer.setTenVaiTro("Khách hàng");

            // Lưu tất cả xuống CSDL
            roleRepository.saveAll(Arrays.asList(admin, thuKho, nvKho, customer));
            log.info("Khởi tạo 4 vai trò mặc định thành công!");
        }
    }
}