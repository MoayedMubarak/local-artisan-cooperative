package com.example.demo.controller;

import com.example.demo.model.Artisan;
import com.example.demo.model.Customer;
import com.example.demo.model.User;
import com.example.demo.model.Wishlist;
import com.example.demo.repository.UserRepository;
import com.example.demo.repository.WishlistRepository;
import org.mindrot.jbcrypt.BCrypt;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private WishlistRepository wishlistRepository;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> payload) {
        String email    = payload.get("email");
        String password = payload.get("password");

        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            if (BCrypt.checkpw(password, user.getPassword())) {
                Map<String, Object> response = new HashMap<>();
                response.put("success", true);
                response.put("user", user);
                return ResponseEntity.ok(response);
            }
        }
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("success", false, "message", "Invalid email or password"));
    }

    @PostMapping("/register/customer")
    public ResponseEntity<?> registerCustomer(@RequestBody Customer customer) {
        if (userRepository.findByEmail(customer.getEmail()).isPresent()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("success", false, "message", "Email already exists"));
        }
        customer.setRole("CUSTOMER");
        customer.setPassword(BCrypt.hashpw(customer.getPassword(), BCrypt.gensalt()));
        userRepository.save(customer);

        // Auto-create an empty wishlist immediately on registration
        // so the wishlist page always works without lazy initialisation
        Wishlist wishlist = new Wishlist();
        wishlist.setCustomer(customer);
        wishlist.setDateCreated(LocalDate.now());
        wishlistRepository.save(wishlist);

        return ResponseEntity.ok(Map.of("success", true, "user", customer));
    }

    @PostMapping("/register/artisan")
    public ResponseEntity<?> registerArtisan(@RequestBody Artisan artisan) {
        if (userRepository.findByEmail(artisan.getEmail()).isPresent()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("success", false, "message", "Email already exists"));
        }
        artisan.setRole("ARTISAN");
        artisan.setPassword(BCrypt.hashpw(artisan.getPassword(), BCrypt.gensalt()));
        userRepository.save(artisan);
        return ResponseEntity.ok(Map.of("success", true, "user", artisan));
    }

    // Deletes account by email — handles FK constraint by removing
    // the wishlist first before deleting the user
    @DeleteMapping("/delete-account")
    @Transactional
    public ResponseEntity<?> deleteAccount(@RequestParam String email) {
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            if (user instanceof Customer) {
                wishlistRepository.findByCustomer((Customer) user)
                        .ifPresent(wishlistRepository::delete);
            }
            userRepository.delete(user);
            return ResponseEntity.ok(Map.of("success", true, "message", "Account deleted successfully"));
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("success", false, "message", "User not found"));
    }
}