package com.ctut.wms.wmscoreservice.security;

import com.ctut.wms.wmscoreservice.entity.Warehouse;

/**
 * Kiểm tra quyền thao tác trên một Kho / Gian hàng:
 * - ADMIN, lời gọi nội bộ (SYSTEM) và nhân sự kho: được phép.
 * - Chủ cửa hàng: chỉ được thao tác trên gian hàng có quanLyId trùng với userId của mình.
 */
public final class StoreAccess {

    private StoreAccess() {
    }

    public static void requireCanManage(Warehouse store) {
        if (CurrentUser.isAdmin() || CurrentUser.isWarehouse()) {
            return;
        }
        Long me = CurrentUser.id();
        if (CurrentUser.isSeller() && store != null && me != null && me.equals(store.getQuanLyId())) {
            return;
        }
        throw new ForbiddenException("Từ chối truy cập: Bạn không phải chủ của gian hàng này!");
    }
}
