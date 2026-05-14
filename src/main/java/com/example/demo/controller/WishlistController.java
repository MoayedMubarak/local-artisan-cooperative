package com.example.demo.controller;

import com.example.demo.model.Customer;
import com.example.demo.model.WishlistItem;
import com.example.demo.repository.UserRepository;
import com.example.demo.service.WishlistService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/wishlist")
public class WishlistController {

    @Autowired private WishlistService wishlistService;
    @Autowired private UserRepository userRepository;

    // GET /api/wishlist?customerId=3
    @GetMapping
    public ResponseEntity<?> getWishlist(@RequestParam Long customerId) {
        Customer customer = resolveCustomer(customerId);
        if (customer == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Customer not found."));
        }
        List<WishlistItem> items = wishlistService.getWishlistItems(customer);
        return ResponseEntity.ok(items);
    }

    // GET /api/wishlist/count?customerId=3
    @GetMapping("/count")
    public ResponseEntity<?> getWishlistCount(@RequestParam Long customerId) {
        Customer customer = resolveCustomer(customerId);
        if (customer == null) return ResponseEntity.ok(0);
        return ResponseEntity.ok(wishlistService.getWishlistItems(customer).size());
    }

    // POST /api/wishlist
    // Body: { "customerId": 3, "productId": 7 }
    @PostMapping
    public ResponseEntity<?> addToWishlist(@RequestBody Map<String, Long> payload) {
        Long customerId = payload.get("customerId");
        Long productId  = payload.get("productId");

        Customer customer = resolveCustomer(customerId);
        if (customer == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Customer not found."));
        }

        String result = wishlistService.addToWishlist(customer, productId);
        return ResponseEntity.ok(Map.of("message", result));
    }

    // DELETE /api/wishlist/{itemId}
    @DeleteMapping("/{itemId}")
    public ResponseEntity<?> removeFromWishlist(@PathVariable Long itemId) {
        String result = wishlistService.removeFromWishlist(itemId);
        if (result.contains("not found")) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(Map.of("message", result));
    }

    private Customer resolveCustomer(Long customerId) {
        return userRepository.findById(customerId)
                .filter(u -> u instanceof Customer)
                .map(u -> (Customer) u)
                .orElse(null);
    }
}