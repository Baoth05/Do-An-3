package com.ctut.wms.wmscoreservice.repository;

import com.ctut.wms.wmscoreservice.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long>{

}
