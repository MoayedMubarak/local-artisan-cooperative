package com.example.demo.repository;

import com.example.demo.model.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {

    // Used by ReviewController to show reviews on a product detail page
    List<Review> findByProduct_Id(Long productId);

    // Used to show all reviews written by a specific customer
    List<Review> findByCustomer_UserId(Long customerId);
}