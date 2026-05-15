package com.example.demo.controller;

import com.example.demo.model.Artisan;
import com.example.demo.model.Customer;
import com.example.demo.model.User;
import com.example.demo.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import org.mindrot.jbcrypt.BCrypt;
import org.springframework.transaction.annotation.Transactional;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private com.example.demo.repository.CustomerRepository customerRepository;

    @Autowired
    private com.example.demo.repository.WishlistRepository wishlistRepository;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> payload) {
        String email = payload.get("email");
        String password = payload.get("password");

        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            if (BCrypt.checkpw(password, user.getPassword())) {
                Map<String, Object> response = new HashMap<>();
                response.put("success", true);
                if (user instanceof Customer) {
                    customerRepository.findByEmail(email)
                            .ifPresentOrElse(c -> response.put("user", c), () -> response.put("user", user));
                } else {
                    response.put("user", user);
                }
                return ResponseEntity.ok(response);
            }
        }
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("success", false, "message", "Invalid email or password"));
    }

    @PostMapping("/register/customer")
    public ResponseEntity<?> registerCustomer(@RequestBody Customer customer) {
        if (userRepository.findByEmail(customer.getEmail()).isPresent()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("success", false, "message", "Email already exists"));
        }
        customer.setRole("CUSTOMER");
        customer.setPassword(BCrypt.hashpw(customer.getPassword(), BCrypt.gensalt()));
        customer.setTotalOrders(0);
        customer.setTotalSpent(0.0);
        userRepository.save(customer);
        
        com.example.demo.model.Wishlist wishlist = new com.example.demo.model.Wishlist();
        wishlist.setCustomer(customer);
        wishlist.setDateCreated(java.time.LocalDate.now());
        wishlistRepository.save(wishlist);
        
        return ResponseEntity.ok(Map.of("success", true, "user", customer));
    }

    @PostMapping("/register/artisan")
    public ResponseEntity<?> registerArtisan(@RequestBody Artisan artisan) {
        if (userRepository.findByEmail(artisan.getEmail()).isPresent()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("success", false, "message", "Email already exists"));
        }
        artisan.setRole("ARTISAN");
        artisan.setPassword(BCrypt.hashpw(artisan.getPassword(), BCrypt.gensalt()));
        userRepository.save(artisan);
        return ResponseEntity.ok(Map.of("success", true, "user", artisan));
    }

    @DeleteMapping("/delete-account")
    @Transactional
    public ResponseEntity<?> deleteAccount(@RequestParam String email) {
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            if (user instanceof Customer) {
                Optional<com.example.demo.model.Wishlist> wishlistOpt = wishlistRepository.findByCustomer((Customer) user);
                wishlistOpt.ifPresent(wishlist -> wishlistRepository.delete(wishlist));
            }
            // Add similar logic for Artisan products if needed, or just let JPA handle it if configured
            userRepository.delete(user);
            return ResponseEntity.ok(Map.of("success", true, "message", "Account deleted successfully"));
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("success", false, "message", "User not found"));
    }
}
