package com.ctut.wms.wmscoreservice.repository.shipping;


import com.ctut.wms.wmscoreservice.entity.shipping.ShippingProvider;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ShippingProviderRepository extends JpaRepository<ShippingProvider, Long> {
}