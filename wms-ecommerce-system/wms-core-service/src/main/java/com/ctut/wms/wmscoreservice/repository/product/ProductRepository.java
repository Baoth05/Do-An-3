package com.ctut.wms.wmscoreservice.repository.product;

import com.ctut.wms.wmscoreservice.entity.product.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
@Repository
public interface ProductRepository extends JpaRepository<Product, Long>{
    Optional<Product> findBySku(String sku);
}
