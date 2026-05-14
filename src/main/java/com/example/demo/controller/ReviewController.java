package com.example.demo.controller;

import com.example.demo.model.Customer;
import com.example.demo.model.Review;
import com.example.demo.repository.UserRepository;
import com.example.demo.service.ReviewService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reviews")
public class ReviewController {

    @Autowired private ReviewService reviewService;
    @Autowired private UserRepository userRepository;

    // GET /api/reviews?productId=5
    @GetMapping
    public ResponseEntity<List<Review>> getReviews(@RequestParam Long productId) {
        return ResponseEntity.ok(reviewService.getReviewsForProduct(productId));
    }

    // POST /api/reviews
    // Body: { "customerId": 3, "productId": 5, "rating": 4, "comment": "Love it!" }
    @PostMapping
    public ResponseEntity<?> addReview(@RequestBody Map<String, Object> payload) {
        try {
            Long   customerId = Long.valueOf(payload.get("customerId").toString());
            Long   productId  = Long.valueOf(payload.get("productId").toString());
            int    rating     = Integer.parseInt(payload.get("rating").toString());
            String comment    = payload.get("comment").toString();

            Customer customer = resolveCustomer(customerId);
            if (customer == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("message", "Customer not found or user is not a customer."));
            }

            Review review = reviewService.addReview(customer, productId, rating, comment);
            return ResponseEntity.status(HttpStatus.CREATED).body(review);

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // DELETE /api/reviews/1
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteReview(@PathVariable Long id) {
        reviewService.deleteReview(id);
        return ResponseEntity.ok(Map.of("message", "Review deleted."));
    }

    private Customer resolveCustomer(Long customerId) {
        return userRepository.findById(customerId)
                .filter(u -> u instanceof Customer)
                .map(u -> (Customer) u)
                .orElse(null);
    }
}