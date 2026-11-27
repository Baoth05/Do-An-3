package com.ctut.wms.apigateway.filter;

import com.ctut.wms.apigateway.util.JwtUtil;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import org.springframework.test.util.ReflectionTestUtils;
import reactor.core.publisher.Mono;

import java.util.Date;
import java.util.concurrent.atomic.AtomicReference;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Kiểm thử bộ lọc bảo mật của API Gateway: xác thực JWT, phân quyền RBAC (mặc định từ chối),
 * chống giả mạo header định danh, chặn đường dẫn bất thường.
 */
class AuthenticationFilterTest {

    static final String SECRET = "5367566B59703373367639792F423F4528482B4D6251655468576D5A71347437";
    static final String INTERNAL = "test-internal-secret";

    AuthenticationFilter filter;

    /** Request đã đi qua filter để tới service phía sau (null nếu bị chặn). */
    final AtomicReference<ServerHttpRequest> forwarded = new AtomicReference<>();

    @BeforeEach
    void setUp() {
        JwtUtil jwtUtil = new JwtUtil();
        ReflectionTestUtils.setField(jwtUtil, "secret", SECRET);
        filter = new AuthenticationFilter();
        ReflectionTestUtils.setField(filter, "jwtUtil", jwtUtil);
        ReflectionTestUtils.setField(filter, "internalSecret", INTERNAL);
        forwarded.set(null);
    }

    static String token(String role, long userId) {
        return Jwts.builder()
                .setSubject("user" + userId)
                .claim("role", role)
                .claim("userId", userId)
                .setExpiration(new Date(System.currentTimeMillis() + 60_000))
                .signWith(Keys.hmacShaKeyFor(Decoders.BASE64.decode(SECRET)), SignatureAlgorithm.HS256)
                .compact();
    }

    /** Gửi request qua filter, trả về HTTP status (200 = được chuyển tiếp tới service). */
    private HttpStatus send(HttpMethod method, String path, String bearer, String... extraHeaders) {
        // Dùng URI thô để giữ nguyên đường dẫn như request thật (không bị chuẩn hóa / mã hóa lại)
        MockServerHttpRequest.BaseBuilder<?> b = MockServerHttpRequest.method(method, java.net.URI.create(path));
        if (bearer != null) b.header(HttpHeaders.AUTHORIZATION, "Bearer " + bearer);
        for (int i = 0; i + 1 < extraHeaders.length; i += 2) b.header(extraHeaders[i], extraHeaders[i + 1]);
        MockServerWebExchange exchange = MockServerWebExchange.from(b.build());

        filter.filter(exchange, ex -> {
            forwarded.set(ex.getRequest());
            return Mono.empty();
        }).block();

        if (forwarded.get() != null) return HttpStatus.OK;
        return HttpStatus.valueOf(exchange.getResponse().getStatusCode().value());
    }

    private String forwardedHeader(String name) {
        return forwarded.get().getHeaders().getFirst(name);
    }

    @Test
    @DisplayName("Endpoint công khai đi qua, được gắn khóa nội bộ; header giả mạo bị xóa")
    void publicEndpointStripsSpoofedHeaders() {
        HttpStatus st = send(HttpMethod.GET, "/products", null,
                "X-User-Role", "ADMIN", "X-User-Id", "1", "X-Internal-Secret", "doan-mo");
        assertThat(st).isEqualTo(HttpStatus.OK);
        assertThat(forwardedHeader("X-User-Role")).isNull();
        assertThat(forwardedHeader("X-User-Id")).isNull();
        assertThat(forwardedHeader("X-Internal-Secret")).isEqualTo(INTERNAL);
    }

    @Test
    @DisplayName("Khách hàng gửi kèm header X-User-Role: ADMIN vẫn chỉ là CUSTOMER")
    void cannotEscalateViaHeader() {
        HttpStatus st = send(HttpMethod.POST, "/orders/checkout-multishop", token("CUSTOMER", 5),
                "X-User-Role", "ADMIN", "X-User-Id", "1");
        assertThat(st).isEqualTo(HttpStatus.OK);
        assertThat(forwardedHeader("X-User-Role")).isEqualTo("CUSTOMER");
        assertThat(forwardedHeader("X-User-Id")).isEqualTo("5");
    }

    @Test
    @DisplayName("Thiếu token hoặc token cửa sau cũ (mock-jwt-token-wms-2026) bị 401")
    void missingOrBackdoorTokenRejected() {
        assertThat(send(HttpMethod.GET, "/orders/user/5", null)).isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(send(HttpMethod.GET, "/auth/users", "mock-jwt-token-wms-2026")).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    @DisplayName("Token ký bằng khóa khác bị 401")
    void forgedTokenRejected() {
        String forged = Jwts.builder().setSubject("hacker").claim("role", "ADMIN")
                .signWith(Keys.hmacShaKeyFor(new byte[32]), SignatureAlgorithm.HS256).compact();
        assertThat(send(HttpMethod.GET, "/auth/users", forged)).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @ParameterizedTest(name = "{0} {1} {2} -> {3}")
    @CsvSource({
            // Khách hàng
            "CUSTOMER, POST, /orders/checkout-multishop, 200",
            "CUSTOMER, GET, /orders/user/5, 200",
            "CUSTOMER, PUT, /orders/9/cancel, 200",
            "CUSTOMER, PUT, /auth/users/5, 200",
            "CUSTOMER, PUT, /auth/upgrade-to-seller, 200",
            "CUSTOMER, POST, /payments/create, 200",
            "CUSTOMER, PUT, /orders/9/status, 403",
            "CUSTOMER, PUT, /orders/checkout-session/CHECKOUT-1/payment-status, 403",
            "CUSTOMER, POST, /payments/confirm-manual/DH-1, 403",
            "CUSTOMER, POST, /payments/crypto/1/confirm, 403",
            "CUSTOMER, GET, /auth/users, 403",
            "CUSTOMER, POST, /stores, 403",
            "CUSTOMER, GET, /wms/finance/summary, 403",
            "CUSTOMER, DELETE, /orders/9, 403",
            "CUSTOMER, POST, /inventory/add, 403",
            // Chủ cửa hàng
            "STORE_OWNER, PUT, /inventory/3/publish, 200",
            "STORE_OWNER, POST, /inventory/add, 200",
            "STORE_OWNER, PUT, /orders/9/status, 200",
            "STORE_OWNER, POST, /vouchers, 200",
            "STORE_OWNER, PUT, /vouchers/SHOPA10/deactivate, 200",
            "CUSTOMER, PUT, /vouchers/SHOPA10/deactivate, 403",
            "ADMIN, PUT, /auth/users/7/approve, 200",
            "STORE_OWNER, PUT, /auth/users/7/approve, 403",
            "STORE_OWNER, PUT, /supply-contracts/1/sign, 200",
            "STORE_OWNER, POST, /orders/checkout-multishop, 200",
            "STORE_OWNER, GET, /orders, 403",
            "STORE_OWNER, GET, /auth/customers, 403",
            "STORE_OWNER, POST, /export-notes, 403",
            // Nhân sự kho
            "WAREHOUSE_MANAGER, POST, /inventory/add, 200",
            "WAREHOUSE_STAFF, PUT, /import-notes/1/status, 200",
            "WAREHOUSE_STAFF, PUT, /supply-contracts/1/dispatch, 200",
            "WAREHOUSE_STAFF, GET, /auth/profile/nvkho, 200",
            "WAREHOUSE_STAFF, GET, /wms/finance/summary, 403",
            "WAREHOUSE_STAFF, PUT, /inventory/3/publish, 403",
            "WAREHOUSE_STAFF, POST, /orders/checkout-multishop, 403",
            // Admin
            "ADMIN, GET, /wms/finance/summary, 200",
            "ADMIN, GET, /auth/users, 200",
    })
    @DisplayName("Ma trận phân quyền RBAC")
    void rbacMatrix(String role, String method, String path, int expected) {
        assertThat(send(HttpMethod.valueOf(method), path, token(role, 5)).value()).isEqualTo(expected);
    }

    @ParameterizedTest(name = "{0}")
    @CsvSource({
            "/products/../auth/users",
            "/products//x",
            "/products/%2e%2e/auth/users",
            "/inventory;jsessionid=1",
    })
    @DisplayName("Đường dẫn bất thường bị chặn 400")
    void suspiciousPathsBlocked(String path) {
        assertThat(send(HttpMethod.GET, path, token("ADMIN", 1))).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    @DisplayName("Webhook IPN MoMo đi qua không cần token (bảo vệ bằng chữ ký HMAC ở payment-service)")
    void momoIpnIsPublic() {
        assertThat(send(HttpMethod.POST, "/payments/momo-ipn", null)).isEqualTo(HttpStatus.OK);
    }
}
