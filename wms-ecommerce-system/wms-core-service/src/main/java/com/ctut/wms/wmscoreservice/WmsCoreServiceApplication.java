package com.ctut.wms.wmscoreservice;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;

@SpringBootApplication
@EnableDiscoveryClient
public class WmsCoreServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(WmsCoreServiceApplication.class, args);
    }

}
