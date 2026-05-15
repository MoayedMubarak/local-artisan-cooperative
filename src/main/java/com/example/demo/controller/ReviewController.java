package com.example.demo.controller;

import com.example.demo.model.Customer;
import com.example.demo.model.Product;
import com.example.demo.model.Review;
import com.example.demo.model.User;
import com.example.demo.repository.CustomerRepository;
import com.example.demo.repository.ProductRepository;
import com.example.demo.repository.ReviewRepository;
import com.example.demo.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/reviews")
public class ReviewController {

    @Autowired
    private ReviewRepository reviewRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @GetMapping("/product/{productId}")
    public ResponseEntity<?> getReviewsForProduct(@PathVariable Long productId) {
        List<Review> reviews = reviewRepository.findByProductIdOrderByDateDesc(productId);
        Double avg = reviewRepository.findAverageRatingByProductId(productId);
        long count = reviewRepository.countByProductId(productId);

        return ResponseEntity.ok(Map.of(
            "reviews", reviews,
            "averageRating", avg != null ? Math.round(avg * 10.0) / 10.0 : 0.0,
            "reviewCount", count
        ));
    }

    @PostMapping("/product/{productId}")
    public ResponseEntity<?> submitReview(
            @PathVariable Long productId,
            @RequestBody Map<String, Object> payload) {

        String email = (String) payload.get("email");
        int rating = Integer.parseInt(payload.get("rating").toString());
        String comment = (String) payload.get("comment");

        if (rating < 1 || rating > 5) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Rating must be between 1 and 5"));
        }
        if (comment == null || comment.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Comment cannot be empty"));
        }

        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(401).body(Map.of("success", false, "message", "User not found"));
        }
        if (!(userOpt.get() instanceof Customer)) {
            return ResponseEntity.status(403).body(Map.of("success", false, "message", "Only customers can leave reviews"));
        }

        Optional<Product> productOpt = productRepository.findById(productId);
        if (productOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("success", false, "message", "Product not found"));
        }

        Review review = new Review();
        review.setRating(rating);
        review.setComment(comment.trim());
        review.setDate(LocalDate.now());
        review.setCustomer((Customer) userOpt.get());
        review.setProduct(productOpt.get());

        reviewRepository.save(review);

        Double newAvg = reviewRepository.findAverageRatingByProductId(productId);
        long newCount = reviewRepository.countByProductId(productId);

        return ResponseEntity.ok(Map.of(
            "success", true,
            "message", "Review submitted successfully",
            "averageRating", newAvg != null ? Math.round(newAvg * 10.0) / 10.0 : 0.0,
            "reviewCount", newCount
        ));
    }
}
