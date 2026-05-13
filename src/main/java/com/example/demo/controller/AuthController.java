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

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> payload) {
        String email = payload.get("email");
        String password = payload.get("password");

        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            if (user.getPassword().equals(password)) {
                Map<String, Object> response = new HashMap<>();
                response.put("success", true);
                response.put("user", user);
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
        userRepository.save(customer);
        return ResponseEntity.ok(Map.of("success", true, "user", customer));
    }

    @PostMapping("/register/artisan")
    public ResponseEntity<?> registerArtisan(@RequestBody Artisan artisan) {
        if (userRepository.findByEmail(artisan.getEmail()).isPresent()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("success", false, "message", "Email already exists"));
        }
        artisan.setRole("ARTISAN");
        userRepository.save(artisan);
        return ResponseEntity.ok(Map.of("success", true, "user", artisan));
    }
}
