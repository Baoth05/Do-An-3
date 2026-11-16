package com.ctut.wms.paymentservice.config;

import com.ctut.wms.paymentservice.client.OrderClient;
import com.ctut.wms.paymentservice.security.InternalCallInterceptor;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestTemplate;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Kiểm tra việc ghép bean: RestTemplate mặc định (gọi MoMo bên ngoài) KHÔNG mang khóa nội bộ,
 * còn OrderClient dùng internalRestTemplate có khóa nội bộ.
 */
class RestClientsConfigTest {

    private final ApplicationContextRunner runner = new ApplicationContextRunner()
            .withUserConfiguration(RestClientsConfig.class, OrderClient.class)
            .withPropertyValues("internal.secret=test-secret");

    @Test
    @DisplayName("RestTemplate mặc định dành cho MoMo không gửi khóa nội bộ; OrderClient dùng bản nội bộ")
    void wiring() {
        runner.run(ctx -> {
            assertThat(ctx).hasNotFailed();
            RestTemplate external = ctx.getBean(RestTemplate.class); // bean @Primary
            RestTemplate internal = ctx.getBean("internalRestTemplate", RestTemplate.class);

            assertThat(external.getInterceptors()).noneMatch(i -> i instanceof InternalCallInterceptor);
            assertThat(internal.getInterceptors()).anyMatch(i -> i instanceof InternalCallInterceptor);

            OrderClient client = ctx.getBean(OrderClient.class);
            assertThat(ReflectionTestUtils.getField(client, "restTemplate")).isSameAs(internal);
            assertThat(ReflectionTestUtils.getField(client, "orderUrl")).isEqualTo("http://order-service");
        });
    }
}
