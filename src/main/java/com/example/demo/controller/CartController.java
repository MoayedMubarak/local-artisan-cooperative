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
        List<CartItem> items = cartItemRepository.findByUser_Email(email);
        return ResponseEntity.ok(items);
    }

    @PostMapping("/add")
    public ResponseEntity<?> addToCart(@RequestHeader("X-User-Email") String email, @RequestBody Map<String, Object> payload) {
        Long productId = Long.valueOf(payload.get("productId").toString());
        int quantity = payload.get("quantity") != null ? Integer.parseInt(payload.get("quantity").toString()) : 1;

        Optional<CartItem> existingItemOpt = cartItemRepository.findByUser_EmailAndProduct_Id(email, productId);
        if (existingItemOpt.isPresent()) {
            CartItem item = existingItemOpt.get();
            item.setQuantity(item.getQuantity() + quantity);
            cartItemRepository.save(item);
            return ResponseEntity.ok(Map.of("success", true, "message", "Quantity updated in cart"));
        } else {
            Optional<User> userOpt = userRepository.findByEmail(email);
            Optional<Product> productOpt = productRepository.findById(productId);
            
            if (userOpt.isEmpty() || productOpt.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("success", false, "message", "User or Product not found"));
            }

            CartItem item = new CartItem();
            item.setUser(userOpt.get());
            item.setProduct(productOpt.get());
            item.setQuantity(quantity);
            cartItemRepository.save(item);
            return ResponseEntity.ok(Map.of("success", true, "message", "Item added to cart"));
        }
    }

    @PutMapping("/update/{itemId}")
    public ResponseEntity<?> updateQuantity(@RequestHeader("X-User-Email") String email, @PathVariable Long itemId, @RequestBody Map<String, Integer> payload) {
        Integer quantity = payload.get("quantity");
        if (quantity == null) return ResponseEntity.badRequest().body("Quantity is required");

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
        cartItemRepository.deleteByUser_Email(email);
        return ResponseEntity.ok(Map.of("success", true, "message", "Cart cleared"));
    }

    @GetMapping("/count")
    public ResponseEntity<?> getCartCount(@RequestHeader("X-User-Email") String email) {
        List<CartItem> items = cartItemRepository.findByUser_Email(email);
        int totalCount = items.stream().mapToInt(CartItem::getQuantity).sum();
        return ResponseEntity.ok(totalCount);
    }
}
