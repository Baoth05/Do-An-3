package com.ctut.wms.orderservice.client;

import com.ctut.wms.orderservice.dto.WmsExportRequest;
import com.ctut.wms.orderservice.security.CurrentUser;
import com.ctut.wms.orderservice.security.ForbiddenException;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

/**
 * Client gọi nội bộ sang WMS Core Service: tra giá bán thật, kiểm tra chủ gian hàng, tạo phiếu xuất kho.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class WmsClient {

    private final RestTemplate restTemplate;

    @Value("${services.wms-url:http://wms-core-service}")
    private String wmsUrl;

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class WmsStore {
        private Long id;
        private Long quanLyId;
    }

    /** Lấy bản ghi tồn kho (giá bán, tồn khả dụng) của sản phẩm tại gian hàng. Ném lỗi nếu không bán. */
    public WmsInventoryItem getInventoryItem(Long sanPhamId, Long khoHangId) {
        try {
            WmsInventoryItem item = restTemplate.getForObject(
                    wmsUrl + "/inventory/item?sanPhamId={sp}&khoHangId={kho}",
                    WmsInventoryItem.class, sanPhamId, khoHangId);
            if (item == null) {
                throw new RuntimeException("Lỗi: Không tra cứu được sản phẩm ID " + sanPhamId);
            }
            return item;
        } catch (HttpClientErrorException.NotFound e) {
            throw new RuntimeException("Lỗi: Gian hàng #" + khoHangId + " không bán sản phẩm ID " + sanPhamId + "!");
        } catch (RestClientException e) {
            log.error("Không kết nối được WMS Core để tra giá: {}", e.getMessage());
            throw new RuntimeException("Lỗi: Hệ thống kho đang bận, vui lòng thử lại sau!");
        }
    }

    /** Trả về userId chủ gian hàng (quanLyId), hoặc null nếu không xác định được. */
    public Long getStoreOwnerId(Long cuaHangId) {
        if (cuaHangId == null) return null;
        try {
            WmsStore store = restTemplate.getForObject(wmsUrl + "/stores/{id}", WmsStore.class, cuaHangId);
            return store != null ? store.getQuanLyId() : null;
        } catch (RestClientException e) {
            log.warn("Không tra cứu được chủ gian hàng #{}: {}", cuaHangId, e.getMessage());
            return null;
        }
    }

    /** Admin luôn được phép; Chủ shop chỉ được thao tác trên gian hàng của chính mình. */
    public void requireStoreOwner(Long cuaHangId) {
        if (CurrentUser.isAdmin()) return;
        Long me = CurrentUser.id();
        Long owner = getStoreOwnerId(cuaHangId);
        if (!CurrentUser.isSeller() || me == null || owner == null || !owner.equals(me)) {
            throw new ForbiddenException("Từ chối truy cập: Bạn không phải chủ của gian hàng #" + cuaHangId + "!");
        }
    }

    public boolean isStoreOwner(Long cuaHangId) {
        Long me = CurrentUser.id();
        if (!CurrentUser.isSeller() || me == null) return false;
        Long owner = getStoreOwnerId(cuaHangId);
        return owner != null && owner.equals(me);
    }

    /**
     * Hủy các phiếu xuất chưa xuất kho của đơn hàng & trả lại tồn khả dụng.
     * Ném lỗi nếu hàng đã rời kho hoặc không liên lạc được WMS (để không hủy đơn khi kho chưa đồng bộ).
     */
    public void cancelExportNotes(String maDonHang) {
        try {
            restTemplate.put(wmsUrl + "/export-notes/by-order/{id}/cancel", null, maDonHang);
        } catch (HttpClientErrorException e) {
            String body = e.getResponseBodyAsString();
            throw new RuntimeException(body != null && !body.isBlank() ? body : "Lỗi: Kho từ chối hủy phiếu xuất của đơn hàng!");
        } catch (RestClientException e) {
            log.error("Không kết nối được WMS Core để hủy phiếu xuất đơn {}: {}", maDonHang, e.getMessage());
            throw new RuntimeException("Lỗi: Hệ thống kho đang bận, chưa thể hủy đơn. Vui lòng thử lại sau!");
        }
    }

    public void createExportNote(WmsExportRequest request) {
        try {
            restTemplate.postForEntity(wmsUrl + "/export-notes", request, String.class);
        } catch (RestClientException e) {
            log.warn("Cảnh báo gửi yêu cầu xuất kho WMS cho đơn {}: {}", request.getDonHangId(), e.getMessage());
        }
    }
}
