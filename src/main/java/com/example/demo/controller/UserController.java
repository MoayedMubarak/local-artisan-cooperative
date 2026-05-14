package com.example.demo.controller;

import com.example.demo.model.Artisan;
import com.example.demo.model.Customer;
import com.example.demo.model.User;
import com.example.demo.repository.UserRepository;
import org.mindrot.jbcrypt.BCrypt;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/user")
public class UserController {

    @Autowired
    private UserRepository userRepository;

    // GET /api/user/me?email=john@example.com
    // Used by my-profile.js on page load to fetch the current user's data
    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(@RequestParam String email) {
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isPresent()) {
            return ResponseEntity.ok(Map.of("success", true, "user", userOpt.get()));
        }
        return ResponseEntity.status(404)
                .body(Map.of("success", false, "message", "User not found"));
    }

    // POST /api/user/update-profile-picture
    // Body: { "email": "john@example.com", "imageUrl": "https://..." }
    @PostMapping("/update-profile-picture")
    public ResponseEntity<?> updateProfilePicture(@RequestBody Map<String, String> payload) {
        String email    = payload.get("email");
        String imageUrl = payload.get("imageUrl");

        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            user.setProfilePicture(imageUrl);
            userRepository.save(user);
            return ResponseEntity.ok(Map.of("success", true, "user", user));
        }
        return ResponseEntity.status(404)
                .body(Map.of("success", false, "message", "User not found"));
    }

    // PUT /api/user/{id}
    // Updates name, email, phone/address (Customer), shopName/biography (Artisan)
    // Called by my-profile.js savePersonalInfo() and saveShopInfo()
    @PutMapping("/{id}")
    public ResponseEntity<?> updateUser(@PathVariable Long id,
                                        @RequestBody Map<String, String> payload) {
        Optional<User> opt = userRepository.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "User not found."));
        }

        User user = opt.get();

        if (payload.containsKey("name"))  user.setName(payload.get("name"));
        if (payload.containsKey("email")) {
            String newEmail = payload.get("email");
            boolean emailTaken = userRepository.findByEmail(newEmail)
                    .map(u -> !u.getUserId().equals(id))
                    .orElse(false);
            if (emailTaken) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("message", "Email is already in use by another account."));
            }
            user.setEmail(newEmail);
        }

        if (user instanceof Customer customer) {
            if (payload.containsKey("phone"))   customer.setPhone(payload.get("phone"));
            if (payload.containsKey("address")) customer.setAddress(payload.get("address"));
        }

        if (user instanceof Artisan artisan) {
            if (payload.containsKey("shopName"))  artisan.setShopName(payload.get("shopName"));
            if (payload.containsKey("biography")) artisan.setBiography(payload.get("biography"));
        }

        userRepository.save(user);
        return ResponseEntity.ok(Map.of("success", true, "user", user));
    }

    // PUT /api/user/{id}/password
    // Verifies current password before saving new one
    @PutMapping("/{id}/password")
    public ResponseEntity<?> changePassword(@PathVariable Long id,
                                            @RequestBody Map<String, String> payload) {
        Optional<User> opt = userRepository.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "User not found."));
        }

        User user = opt.get();
        String currentPassword = payload.get("currentPassword");
        String newPassword     = payload.get("newPassword");

        if (!BCrypt.checkpw(currentPassword, user.getPassword())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Current password is incorrect."));
        }

        if (newPassword == null || newPassword.length() < 8) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "New password must be at least 8 characters."));
        }

        user.setPassword(BCrypt.hashpw(newPassword, BCrypt.gensalt()));
        userRepository.save(user);
        return ResponseEntity.ok(Map.of("success", true, "message", "Password updated successfully."));
    }

    // DELETE /api/user/{id}
    // @Transactional ensures the whole delete rolls back if FK constraint fails
    @Transactional
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        if (!userRepository.existsById(id)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "User not found."));
        }
        userRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("success", true, "message", "Account deleted."));
    }
}