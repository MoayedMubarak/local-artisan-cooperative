package com.example.demo.controller;

import com.example.demo.model.*;
import com.example.demo.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
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

    @Autowired
    private AuctionRepository auctionRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private ReviewRepository reviewRepository;

    @GetMapping("/dashboard")
    public String dashboard(Model model) {
        // KPI Data
        model.addAttribute("totalUsers", userRepository.count());
        model.addAttribute("activeProducts", productRepository.countByIsAuctionItem(false));
        model.addAttribute("openAuctions", auctionRepository.countByStatus("active")); 
        
        LocalDate oneWeekAgo = LocalDate.now().minusWeeks(1);
        model.addAttribute("weeklyOrders", orderRepository.findByDateAfter(oneWeekAgo).size());

        // Moderation Data
        model.addAttribute("pendingArtisans", artisanRepository.findByIsApprovedFalse());
        model.addAttribute("flaggedReviews", reviewRepository.findByIsFlaggedTrue());
        model.addAttribute("allUsers", userRepository.findByRoleNot("ADMIN"));

        return "adminDashboard";
    }

    @PostMapping("/approve-artisan/{id}")
    public String approveArtisan(@PathVariable Long id) {
        artisanRepository.findById(id).ifPresent(artisan -> {
            artisan.setApproved(true);
            artisanRepository.save(artisan);
        });
        return "redirect:/admin/dashboard";
    }

    @PostMapping("/suspend-user/{id}")
    public String suspendUser(@PathVariable Long id) {
        userRepository.findById(id).ifPresent(user -> {
            user.setSuspended(!user.isSuspended());
            userRepository.save(user);
        });
        return "redirect:/admin/dashboard";
    }

    @PostMapping("/delete-user/{id}")
    public String deleteUser(@PathVariable Long id) {
        userRepository.deleteById(id);
        return "redirect:/admin/dashboard";
    }

    @PostMapping("/delete-review/{id}")
    public String deleteReview(@PathVariable Long id) {
        reviewRepository.deleteById(id);
        return "redirect:/admin/dashboard";
    }
}
