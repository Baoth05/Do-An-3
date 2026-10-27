package com.ctut.wms.wmscoreservice.service.category;

import com.ctut.wms.wmscoreservice.entity.category.Category;
import com.ctut.wms.wmscoreservice.repository.category.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CategoryService {
    private final CategoryRepository categoryRepository;

    public Category createCategory(Category category) {
        return categoryRepository.save(category);
    }

    public List<Category> getAllCategories() {
        return categoryRepository.findAll();
    }

    public Category getCategoryById(Long id) {
        return categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Lỗi: Không tìm thấy danh mục có ID = " + id));
    }

    @Transactional
    public Category updateCategory(Long id, Category category) {
        Category existing = getCategoryById(id);
        if (category.getTenDanhMuc() != null) {
            existing.setTenDanhMuc(category.getTenDanhMuc());
        }
        if (category.getMoTa() != null) {
            existing.setMoTa(category.getMoTa());
        }
        return categoryRepository.save(existing);
    }

    @Transactional
    public void deleteCategory(Long id) {
        if (!categoryRepository.existsById(id)) {
            throw new RuntimeException("Lỗi: Không tìm thấy danh mục có ID = " + id);
        }
        categoryRepository.deleteById(id);
    }
}
