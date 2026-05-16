package com.example.demo.controller;

import com.example.demo.model.Artisan;
import com.example.demo.model.User;
import com.example.demo.repository.ArtisanRepository;
import com.example.demo.repository.ProductRepository;
import com.example.demo.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Controller
@RequestMapping("/admin")
public class AdminController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ArtisanRepository artisanRepository;

    @Autowired
    private ProductRepository productRepository;

    @GetMapping("/dashboard")
    public String dashboard(Model model) {
        model.addAttribute("totalUsers", userRepository.count());
        model.addAttribute("totalProducts", productRepository.count());
        model.addAttribute("artisans", artisanRepository.findAll());
        model.addAttribute("customers", userRepository.findAll().stream().filter(u -> "CUSTOMER".equalsIgnoreCase(u.getRole())).toList());
        return "adminDashboard";
    }

    @PostMapping("/approve-artisan/{id}")
    public String approveArtisan(@PathVariable Long id) {
        artisanRepository.findById(id).ifPresent(artisan -> {
            // Logic to approve artisan (e.g. set a flag if added)
            // For now, we'll just redirect
        });
        return "redirect:/admin/dashboard";
    }

    @PostMapping("/suspend-user/{id}")
    public String suspendUser(@PathVariable Long id) {
        userRepository.findById(id).ifPresent(user -> {
            // Logic to suspend user
        });
        return "redirect:/admin/dashboard";
    }
}
