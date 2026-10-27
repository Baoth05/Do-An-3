package com.ctut.wms.wmscoreservice.service.inventory;

import com.ctut.wms.wmscoreservice.entity.inventory.TheKho;
import com.ctut.wms.wmscoreservice.repository.inventory.TheKhoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TheKhoService {
    private final TheKhoRepository theKhoRepository;

    public List<TheKho> getAllTheKho() {
        return theKhoRepository.findAll();
    }

    public List<TheKho> getTheKhoByKho(Long khoId) {
        return theKhoRepository.findByKhoCuaHangIdOrderByNgayTaoDesc(khoId);
    }

    public List<TheKho> getTheKhoByHangHoa(Long hangHoaId) {
        return theKhoRepository.findByHangHoaIdOrderByNgayTaoDesc(hangHoaId);
    }

    public List<TheKho> getTheKhoByKhoAndHangHoa(Long khoId, Long hangHoaId) {
        return theKhoRepository.findByKhoCuaHangIdAndHangHoaIdOrderByNgayTaoDesc(khoId, hangHoaId);
    }

    public TheKho recordStockMovement(TheKho theKho) {
        return theKhoRepository.save(theKho);
    }
}

