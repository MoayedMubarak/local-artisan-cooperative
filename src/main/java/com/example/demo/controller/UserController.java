package com.example.demo.controller;

import com.example.demo.model.Artisan;
import com.example.demo.model.Customer;
import com.example.demo.model.User;
import com.example.demo.repository.ArtisanRepository;
import com.example.demo.repository.CustomerRepository;
import com.example.demo.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/user")
public class UserController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private ArtisanRepository artisanRepository;

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(@RequestParam String email) {
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("success", false, "message", "User not found"));
        }
        User user = userOpt.get();
        if (user instanceof Customer) {
            return customerRepository.findByEmail(email)
                    .map(customer -> ResponseEntity.ok(Map.of("success", true, "user", customer)))
                    .orElse(ResponseEntity.status(404).body(Map.of("success", false, "message", "User not found")));
        }
        if (user instanceof Artisan || "ARTISAN".equalsIgnoreCase(user.getRole())) {
            return artisanRepository.findByEmail(email)
                    .map(artisan -> ResponseEntity.ok(Map.of("success", true, "user", artisan)))
                    .orElse(ResponseEntity.status(404).body(Map.of("success", false, "message", "User not found")));
        }
        return ResponseEntity.ok(Map.of("success", true, "user", user));
    }

    @PostMapping("/update-profile-picture")
    public ResponseEntity<?> updateProfilePicture(@RequestBody Map<String, String> payload) {
        String email = payload.get("email");
        String imageUrl = payload.get("imageUrl");

        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            user.setProfilePicture(imageUrl);
            userRepository.save(user);
            if (user instanceof Customer) {
                return customerRepository.findByEmail(email)
                        .map(customer -> ResponseEntity.ok(Map.of("success", true, "user", customer)))
                        .orElse(ResponseEntity.ok(Map.of("success", true, "user", user)));
            }
            if (user instanceof Artisan || "ARTISAN".equalsIgnoreCase(user.getRole())) {
                return artisanRepository.findByEmail(email)
                        .map(artisan -> ResponseEntity.ok(Map.of("success", true, "user", artisan)))
                        .orElse(ResponseEntity.ok(Map.of("success", true, "user", user)));
            }
            return ResponseEntity.ok(Map.of("success", true, "user", user));
        }
        return ResponseEntity.status(404).body(Map.of("success", false, "message", "User not found"));
    }
}
