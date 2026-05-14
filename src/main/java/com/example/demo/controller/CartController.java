package com.example.demo.controller;

import com.example.demo.model.CartItem;
import com.example.demo.model.Product;
import com.example.demo.model.User;
import com.example.demo.repository.CartItemRepository;
import com.example.demo.repository.ProductRepository;
import com.example.demo.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/cart")
@Transactional
public class CartController {

    @Autowired
    private CartItemRepository cartItemRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProductRepository productRepository;

    @GetMapping
    public ResponseEntity<?> getCart(@RequestHeader("X-User-Email") String email) {
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isPresent()) {
            List<CartItem> items = cartItemRepository.findByUser(userOpt.get());
            return ResponseEntity.ok(items);
        }
        return ResponseEntity.ok(List.of());
    }

    @PostMapping("/add")
    public ResponseEntity<?> addToCart(@RequestHeader("X-User-Email") String email, @RequestBody Map<String, Object> payload) {
        Long productId = Long.valueOf(payload.get("productId").toString());
        int quantity = payload.get("quantity") != null ? Integer.parseInt(payload.get("quantity").toString()) : 1;

        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) return ResponseEntity.badRequest().body("User not found");

        Optional<Product> productOpt = productRepository.findById(productId);
        if (productOpt.isEmpty()) return ResponseEntity.badRequest().body("Product not found");

        User user = userOpt.get();
        Product product = productOpt.get();

        Optional<CartItem> existingItemOpt = cartItemRepository.findByUserAndProductId(user, productId);
        if (existingItemOpt.isPresent()) {
            CartItem item = existingItemOpt.get();
            item.setQuantity(item.getQuantity() + quantity);
            cartItemRepository.save(item);
            return ResponseEntity.ok(Map.of("success", true, "message", "Quantity updated in cart"));
        } else {
            CartItem item = new CartItem();
            item.setUser(user);
            item.setProduct(product);
            item.setQuantity(quantity);
            cartItemRepository.save(item);
            return ResponseEntity.ok(Map.of("success", true, "message", "Item added to cart"));
        }
    }

    @PutMapping("/update/{itemId}")
    public ResponseEntity<?> updateQuantity(@RequestHeader("X-User-Email") String email, @PathVariable Long itemId, @RequestBody Map<String, Integer> payload) {
        int quantity = payload.get("quantity");
        Optional<CartItem> itemOpt = cartItemRepository.findById(itemId);
        if (itemOpt.isPresent()) {
            CartItem item = itemOpt.get();
            if (quantity <= 0) {
                cartItemRepository.delete(item);
                return ResponseEntity.ok(Map.of("success", true, "message", "Item removed from cart"));
            }
            item.setQuantity(quantity);
            cartItemRepository.save(item);
            return ResponseEntity.ok(Map.of("success", true, "message", "Quantity updated"));
        }
        return ResponseEntity.badRequest().body("Item not found");
    }

    @DeleteMapping("/remove/{itemId}")
    public ResponseEntity<?> removeFromCart(@RequestHeader("X-User-Email") String email, @PathVariable Long itemId) {
        if (cartItemRepository.existsById(itemId)) {
            cartItemRepository.deleteById(itemId);
            return ResponseEntity.ok(Map.of("success", true, "message", "Item removed from cart"));
        }
        return ResponseEntity.badRequest().body("Item not found");
    }

    @DeleteMapping("/clear")
    public ResponseEntity<?> clearCart(@RequestHeader("X-User-Email") String email) {
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isPresent()) {
            cartItemRepository.deleteByUser(userOpt.get());
            return ResponseEntity.ok(Map.of("success", true, "message", "Cart cleared"));
        }
        return ResponseEntity.badRequest().body("User not found");
    }

    @GetMapping("/count")
    public ResponseEntity<?> getCartCount(@RequestHeader("X-User-Email") String email) {
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isPresent()) {
            List<CartItem> items = cartItemRepository.findByUser(userOpt.get());
            int totalCount = items.stream().mapToInt(CartItem::getQuantity).sum();
            return ResponseEntity.ok(totalCount);
        }
        return ResponseEntity.ok(0);
    }
}
