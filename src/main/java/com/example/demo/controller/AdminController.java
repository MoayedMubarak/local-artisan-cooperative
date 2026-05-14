package com.example.demo.controller;

import com.example.demo.model.*;
import com.example.demo.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    @Autowired private UserRepository userRepository;
    @Autowired private ArtisanRepository artisanRepository;
    @Autowired private ReviewRepository reviewRepository;
    @Autowired private OrderRepository orderRepository;
    @Autowired private DisputeRepository disputeRepository;
    @Autowired private ProductRepository productRepository;
    @Autowired private AuctionRepository auctionRepository;
    @Autowired private WishlistRepository wishlistRepository;

    private boolean isAdmin(String email) {
        if (email == null || email.isBlank()) return false;
        return userRepository.findByEmail(email)
                .map(u -> "ADMIN".equals(u.getRole()))
                .orElse(false);
    }

    private ResponseEntity<Map<String, Object>> forbidden() {
        Map<String, Object> body = new HashMap<>();
        body.put("error", "Forbidden: Admin access required.");
        return ResponseEntity.status(403).body(body);
    }

    // ── Stats ──────────────────────────────────────────────────────────────────

    @GetMapping("/stats")
    public ResponseEntity<?> getStats(@RequestParam String adminEmail) {
        if (!isAdmin(adminEmail)) return forbidden();

        LocalDate weekAgo = LocalDate.now().minusDays(7);
        double weeklySales = orderRepository.findAll().stream()
                .filter(o -> o.getDate() != null && o.getDate().isAfter(weekAgo))
                .mapToDouble(Order::getTotalAmount)
                .sum();

        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("totalUsers", userRepository.count());
        stats.put("totalProducts", productRepository.count());
        stats.put("openAuctions", auctionRepository.count());
        stats.put("weeklySales", weeklySales);
        stats.put("totalOrders", orderRepository.count());
        stats.put("pendingArtisans", artisanRepository.countByApproved(false));
        stats.put("flaggedReviews", reviewRepository.countByFlagged(true));
        stats.put("openDisputes", disputeRepository.countByStatus("OPEN"));
        return ResponseEntity.ok(stats);
    }

    // ── Users ──────────────────────────────────────────────────────────────────

    @GetMapping("/users")
    public ResponseEntity<?> getUsers(@RequestParam String adminEmail) {
        if (!isAdmin(adminEmail)) return forbidden();
        return ResponseEntity.ok(userRepository.findAll());
    }

    @PatchMapping("/users/{id}/suspend")
    public ResponseEntity<?> toggleSuspend(@PathVariable Long id, @RequestParam String adminEmail) {
        if (!isAdmin(adminEmail)) return forbidden();
        return userRepository.findById(id).map(user -> {
            if ("ADMIN".equals(user.getRole())) {
                return ResponseEntity.badRequest()
                        .<Map<String, Object>>body(Map.of("error", "Cannot suspend an admin account."));
            }
            user.setSuspended(!user.isSuspended());
            userRepository.save(user);
            return ResponseEntity.ok(Map.<String, Object>of("suspended", user.isSuspended()));
        }).orElse(ResponseEntity.notFound().<Map<String, Object>>build());
    }

    @DeleteMapping("/users/{id}")
    @Transactional
    public ResponseEntity<?> deleteUser(@PathVariable Long id, @RequestParam String adminEmail) {
        if (!isAdmin(adminEmail)) return forbidden();
        User user = userRepository.findById(id).orElse(null);
        if (user == null) return ResponseEntity.notFound().build();
        if ("ADMIN".equals(user.getRole())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Cannot delete admin accounts."));
        }
        if (user instanceof Customer) {
            wishlistRepository.findByCustomer((Customer) user)
                    .ifPresent(wishlistRepository::delete);
        }
        userRepository.delete(user);
        return ResponseEntity.ok(Map.of("success", true));
    }

    // ── Artisan Approvals ─────────────────────────────────────────────────────

    @GetMapping("/artisans/pending")
    public ResponseEntity<?> getPendingArtisans(@RequestParam String adminEmail) {
        if (!isAdmin(adminEmail)) return forbidden();
        return ResponseEntity.ok(artisanRepository.findByApproved(false));
    }

    @PatchMapping("/artisans/{id}/approve")
    public ResponseEntity<?> approveArtisan(@PathVariable Long id, @RequestParam String adminEmail) {
        if (!isAdmin(adminEmail)) return forbidden();
        return artisanRepository.findById(id).map(artisan -> {
            artisan.setApproved(true);
            artisanRepository.save(artisan);
            return ResponseEntity.ok(Map.<String, Object>of("approved", true));
        }).orElse(ResponseEntity.notFound().<Map<String, Object>>build());
    }

    @DeleteMapping("/artisans/{id}/reject")
    @Transactional
    public ResponseEntity<?> rejectArtisan(@PathVariable Long id, @RequestParam String adminEmail) {
        if (!isAdmin(adminEmail)) return forbidden();
        if (!artisanRepository.existsById(id)) return ResponseEntity.notFound().build();
        artisanRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("success", true));
    }

    // ── Reviews ───────────────────────────────────────────────────────────────

    @GetMapping("/reviews")
    public ResponseEntity<?> getReviews(@RequestParam String adminEmail,
                                        @RequestParam(required = false) Boolean flagged) {
        if (!isAdmin(adminEmail)) return forbidden();
        List<Review> reviews = Boolean.TRUE.equals(flagged)
                ? reviewRepository.findByFlagged(true)
                : reviewRepository.findAll();

        List<Map<String, Object>> result = reviews.stream().map(r -> {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("reviewId", r.getReviewId());
            map.put("rating", r.getRating());
            map.put("comment", r.getComment());
            map.put("date", r.getDate());
            map.put("flagged", r.isFlagged());
            if (r.getCustomer() != null) {
                map.put("customer", Map.of(
                        "userId", r.getCustomer().getUserId(),
                        "name", r.getCustomer().getName(),
                        "email", r.getCustomer().getEmail()
                ));
            }
            if (r.getProduct() != null) {
                map.put("product", Map.of(
                        "id", r.getProduct().getId(),
                        "title", r.getProduct().getTitle()
                ));
            }
            return map;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }

    @PatchMapping("/reviews/{id}/flag")
    public ResponseEntity<?> toggleFlagReview(@PathVariable Long id, @RequestParam String adminEmail) {
        if (!isAdmin(adminEmail)) return forbidden();
        return reviewRepository.findById(id).map(review -> {
            review.setFlagged(!review.isFlagged());
            reviewRepository.save(review);
            return ResponseEntity.ok(Map.<String, Object>of("flagged", review.isFlagged()));
        }).orElse(ResponseEntity.notFound().<Map<String, Object>>build());
    }

    @DeleteMapping("/reviews/{id}")
    public ResponseEntity<?> deleteReview(@PathVariable Long id, @RequestParam String adminEmail) {
        if (!isAdmin(adminEmail)) return forbidden();
        if (!reviewRepository.existsById(id)) return ResponseEntity.notFound().build();
        reviewRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("success", true));
    }

    // ── Disputes ──────────────────────────────────────────────────────────────

    @GetMapping("/disputes")
    public ResponseEntity<?> getDisputes(@RequestParam String adminEmail) {
        if (!isAdmin(adminEmail)) return forbidden();
        return ResponseEntity.ok(disputeRepository.findAll());
    }

    @PostMapping("/disputes")
    public ResponseEntity<?> createDispute(@RequestBody Dispute dispute,
                                           @RequestParam String adminEmail) {
        if (!isAdmin(adminEmail)) return forbidden();
        dispute.setStatus("OPEN");
        dispute.setCreatedDate(LocalDate.now());
        dispute.setId(null);
        return ResponseEntity.ok(disputeRepository.save(dispute));
    }

    @PatchMapping("/disputes/{id}/resolve")
    public ResponseEntity<?> resolveDispute(@PathVariable Long id,
                                            @RequestBody Map<String, String> body,
                                            @RequestParam String adminEmail) {
        if (!isAdmin(adminEmail)) return forbidden();
        return disputeRepository.findById(id).map(dispute -> {
            dispute.setStatus("RESOLVED");
            dispute.setResolution(body.get("resolution"));
            dispute.setResolvedDate(LocalDate.now());
            disputeRepository.save(dispute);
            return ResponseEntity.ok(Map.<String, Object>of("success", true));
        }).orElse(ResponseEntity.notFound().<Map<String, Object>>build());
    }
}
