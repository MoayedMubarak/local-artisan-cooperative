package com.example.demo.controller;

import com.example.demo.model.User;
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

    @PostMapping("/update-profile-picture")
    public ResponseEntity<?> updateProfilePicture(@RequestBody Map<String, String> payload) {
        String email = payload.get("email");
        String imageUrl = payload.get("imageUrl");

        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            user.setProfilePicture(imageUrl);
            userRepository.save(user);
            return ResponseEntity.ok(Map.of("success", true, "profilePicture", imageUrl));
        }
        return ResponseEntity.status(404).body(Map.of("success", false, "message", "User not found"));
    }
}
