package com.example.demo.repository;

import com.example.demo.model.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ProductRepository extends JpaRepository<Product, Long> {
    // Notice how we changed this to look inside the ProductCategory object!
    List<Product> findByProductCategory_NameIgnoreCase(String categoryName);
}