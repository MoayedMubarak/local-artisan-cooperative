package com.example.demo.controller;

import com.example.demo.model.CartItem;
import com.example.demo.model.Product;
import com.example.demo.model.User;
import com.example.demo.repository.CartItemRepository;
import com.example.demo.repository.ProductRepository;
import com.example.demo.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/cart")
public class CartController {

    @Autowired
    private CartItemRepository cartItemRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProductRepository productRepository;

    @GetMapping
    public ResponseEntity<?> getCart(@RequestParam String email) {
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isPresent()) {
            List<CartItem> items = cartItemRepository.findByUser(userOpt.get());
            return ResponseEntity.ok(Map.of("success", true, "items", items));
        }
        return ResponseEntity.status(404).body(Map.of("success", false, "message", "User not found"));
    }

    @PostMapping("/add")
    public ResponseEntity<?> addToCart(@RequestBody Map<String, Object> payload) {
        String email = (String) payload.get("email");
        Long productId = Long.valueOf(payload.get("productId").toString());
        int quantity = (int) payload.getOrDefault("quantity", 1);

        Optional<User> userOpt = userRepository.findByEmail(email);
        Optional<Product> productOpt = productRepository.findById(productId);

        if (userOpt.isPresent() && productOpt.isPresent()) {
            User user = userOpt.get();
            Product product = productOpt.get();

            Optional<CartItem> existingItem = cartItemRepository.findByUserAndProduct_Id(user, productId);
            CartItem item;
            if (existingItem.isPresent()) {
                item = existingItem.get();
                item.setQuantity(item.getQuantity() + quantity);
            } else {
                item = new CartItem();
                item.setUser(user);
                item.setProduct(product);
                item.setQuantity(quantity);
            }
            cartItemRepository.save(item);
            return ResponseEntity.ok(Map.of("success", true, "message", "Item added to cart", "cartCount", cartItemRepository.findByUser(user).size()));
        }
        return ResponseEntity.status(404).body(Map.of("success", false, "message", "User or Product not found"));
    }

    @DeleteMapping("/remove/{productId}")
    @Transactional
    public ResponseEntity<?> removeFromCart(@PathVariable Long productId, @RequestParam String email) {
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isPresent()) {
            Optional<CartItem> existingItem = cartItemRepository.findByUserAndProduct_Id(userOpt.get(), productId);
            existingItem.ifPresent(cartItem -> cartItemRepository.delete(cartItem));
            return ResponseEntity.ok(Map.of("success", true, "message", "Item removed from cart"));
        }
        return ResponseEntity.status(404).body(Map.of("success", false, "message", "User not found"));
    }

    @DeleteMapping("/clear")
    @Transactional
    public ResponseEntity<?> clearCart(@RequestParam String email) {
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isPresent()) {
            cartItemRepository.deleteByUser(userOpt.get());
            return ResponseEntity.ok(Map.of("success", true, "message", "Cart cleared"));
        }
        return ResponseEntity.status(404).body(Map.of("success", false, "message", "User not found"));
    }
}
