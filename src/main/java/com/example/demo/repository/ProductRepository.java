package com.example.demo.repository;

import com.example.demo.model.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ProductRepository extends JpaRepository<Product, Long> {
    List<Product> findByCategoryIgnoreCase(String category);
    List<Product> findByIsAuctionItem(boolean isAuctionItem);
    List<Product> findByProductCategory_NameIgnoreCase(String categoryName);
}
