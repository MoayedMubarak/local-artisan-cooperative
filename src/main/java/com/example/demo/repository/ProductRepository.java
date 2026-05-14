package com.example.demo.repository;

import com.example.demo.model.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

    // Used by products page and ProductService
    List<Product> findByCategoryIgnoreCase(String category);

    // Used by MainController to separate auction vs standard products
    List<Product> findByIsAuctionItem(boolean isAuctionItem);

    // Used by ProductController category filter
    List<Product> findByProductCategory_NameIgnoreCase(String categoryName);

    // Used by ArtisanController to show an artisan's own products
    List<Product> findByArtisanUserId(Long artisanId);

    // Used by ArtisanController dashboard stats
    long countByArtisanUserId(Long artisanId);
}