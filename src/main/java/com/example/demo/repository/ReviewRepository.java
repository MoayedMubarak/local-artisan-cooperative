package com.example.demo.repository;

import com.example.demo.model.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ReviewRepository extends JpaRepository<Review, Long> {
    List<Review> findByProductIdOrderByDateDesc(Long productId);

    @Query("SELECT r FROM Review r LEFT JOIN FETCH r.customer WHERE r.product.id = :productId ORDER BY r.date DESC")
    List<Review> findByProductIdWithCustomerOrderByDateDesc(@Param("productId") Long productId);

    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.product.id = :productId")
    Double findAverageRatingByProductId(@Param("productId") Long productId);

    long countByProductId(Long productId);

    @Query("SELECT r FROM Review r WHERE r.product.artisan.userId = :artisanId")
    List<Review> findByProductArtisanUserId(@Param("artisanId") Long artisanId);
}
