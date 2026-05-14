package com.example.demo.service;

import com.example.demo.model.*;
import com.example.demo.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.util.List;

@Service
public class ReviewService {

    @Autowired private ReviewRepository reviewRepository;
    @Autowired private ProductRepository productRepository;

    public List<Review> getReviewsForProduct(Long productId) {
        return reviewRepository.findByProduct_Id(productId);
    }

    public List<Review> getReviewsByCustomer(Long customerId) {
        return reviewRepository.findByCustomer_UserId(customerId);
    }

    public Review addReview(Customer customer, Long productId, int rating, String comment) {
        if (rating < 1 || rating > 5) {
            throw new IllegalArgumentException("Rating must be between 1 and 5.");
        }
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new IllegalArgumentException("Product not found."));

        Review review = new Review();
        review.setCustomer(customer);
        review.setProduct(product);
        review.setRating(rating);
        review.setComment(comment);
        review.setDate(LocalDate.now());
        return reviewRepository.save(review);
    }

    public void deleteReview(Long reviewId) {
        reviewRepository.deleteById(reviewId);
    }
}