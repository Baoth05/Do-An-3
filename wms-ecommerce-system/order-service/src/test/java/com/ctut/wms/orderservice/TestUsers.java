package com.ctut.wms.orderservice;

import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

/** Giả lập header người dùng mà API Gateway gắn vào request (X-User-Id / X-User-Role / X-User-Account). */
public final class TestUsers {

    private TestUsers() {
    }

    public static void as(String role, Long userId) {
        MockHttpServletRequest req = new MockHttpServletRequest();
        req.addHeader("X-User-Role", role);
        req.addHeader("X-User-Account", role.toLowerCase() + (userId != null ? userId : ""));
        if (userId != null) {
            req.addHeader("X-User-Id", String.valueOf(userId));
        }
        RequestContextHolder.setRequestAttributes(new ServletRequestAttributes(req));
    }

    public static void clear() {
        RequestContextHolder.resetRequestAttributes();
    }
}
