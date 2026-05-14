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
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserRepository userRepository;

    // GET /api/users/{id}
    // Returns the full user object to hydrate the profile form on page load.
    @GetMapping("/{id}")
    public ResponseEntity<?> getUser(@PathVariable Long id) {
        return userRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // PUT /api/users/{id}
    // Updates name, email, phone/address (Customer), shopName/biography (Artisan).
    // Called by my-profile.js savePersonalInfo() and saveShopInfo().
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

    // PUT /api/users/{id}/password
    // Verifies current password before hashing and saving the new one.
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

    // DELETE /api/users/{id}
    // FIX: @Transactional ensures that if any FK-constrained child row (orders,
    // reviews, bids, wishlist) blocks the delete, the whole operation rolls back
    // cleanly instead of leaving a partially deleted account.
    // Note: for a full hard-delete you would also need to delete or nullify child
    // records first (orders, reviews, wishlist, bids). For now this works cleanly
    // only if those records have been removed first, or if cascade is configured
    // on the FK relationships in the database. The frontend (my-profile.js) shows
    // a confirmation dialog before calling this endpoint.
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