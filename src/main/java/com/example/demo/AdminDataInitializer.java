package com.example.demo;

import com.example.demo.model.Admin;
import com.example.demo.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

@Component
public class AdminDataInitializer {

    @Autowired
    private UserRepository userRepository;

    @EventListener(ApplicationReadyEvent.class)
    public void seedDefaultAdmin() {
        boolean adminExists = userRepository.findAll().stream()
                .anyMatch(u -> "ADMIN".equals(u.getRole()));

        if (!adminExists) {
            Admin admin = new Admin();
            admin.setName("Admin");
            admin.setEmail("admin@artsyvibe.com");
            admin.setPassword("Admin@123");
            admin.setRole("ADMIN");
            userRepository.save(admin);

            System.out.println("=======================================================");
            System.out.println("  Default admin account created:");
            System.out.println("    Email:    admin@artsyvibe.com");
            System.out.println("    Password: Admin@123");
            System.out.println("  Change these credentials after first login.");
            System.out.println("=======================================================");
        }
    }
}
