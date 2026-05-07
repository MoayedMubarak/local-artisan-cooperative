package com.example.demo.controller;

import com.example.demo.repository.ProductRepository;
import com.example.demo.repository.AuctionRepository;
import com.example.demo.service.AuctionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

@Controller
public class MainController {

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private AuctionRepository auctionRepository;

    @Autowired
    private AuctionService auctionService;

    // Homepage
    @GetMapping("/")
    public String index(Model model) {
        return "index"; // Maps to src/main/resources/templates/index.html
    }

    // Product Catalog
    @GetMapping("/products")
    public String products(Model model) {
        model.addAttribute("products", productRepository.findByIsAuctionItem(false));
        return "Products"; // Mixed case as specified in your gotchas
    }

    // Auctions Page
    @GetMapping("/auctions")
    public String auctions(Model model) {
        model.addAttribute("auctions", auctionRepository.findAll());
        return "Auctions";
    }

    // Handle Bidding Form Submission
    @PostMapping("/auctions/bid")
    public String placeBid(@RequestParam Long auctionId, @RequestParam double amount, Model model) {
        // In a real app, bidderName comes from the logged-in session. Hardcoded for demo.
        String message = auctionService.placeBid(auctionId, amount, "Jane Doe");
        model.addAttribute("message", message);
        return "redirect:/auctions"; 
    }

    // Cart
    @GetMapping("/cart")
    public String cart() {
        return "Cart";
    }

    // Login
    @GetMapping("/login")
    public String login() {
        return "Login";
    }

    // Profile
    @GetMapping("/profile")
    public String profile() {
        return "Profile";
    }
}
