package com.example.demo.controller;

import com.example.demo.repository.ProductRepository;
import com.example.demo.repository.AuctionRepository;
import com.example.demo.repository.UserRepository;
import com.example.demo.service.AuctionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

@Controller
public class MainController {

    @Autowired private ProductRepository productRepository;
    @Autowired private AuctionRepository auctionRepository;
    @Autowired private AuctionService auctionService;
    @Autowired private UserRepository userRepository;

    @GetMapping("/")
    public String index(Model model) { return "index"; }

    @GetMapping({"/index", "/index.html"})
    public String indexAlt() { return "index"; }

    @GetMapping("/products")
    public String products(Model model) {
        model.addAttribute("products", productRepository.findByIsAuctionItem(false));
        return "products";
    }

    @GetMapping("/auctions")
    public String auctions(Model model) {
        model.addAttribute("auctions", auctionRepository.findAll());
        return "auctions";
    }

    // FIX: was hardcoded "Jane Doe". Now resolves real bidder name from DB,
    // with "Guest" fallback if customerId is not sent by the form.
    @PostMapping("/auctions/bid")
    public String placeBid(
            @RequestParam Long auctionId,
            @RequestParam double amount,
            @RequestParam(required = false) Long customerId,
            Model model) {

        String bidderName = "Guest";
        if (customerId != null) {
            bidderName = userRepository.findById(customerId)
                    .map(u -> u.getName())
                    .orElse("Guest");
        }
        String message = auctionService.placeBid(auctionId, amount, bidderName);
        model.addAttribute("message", message);
        return "redirect:/auctions";
    }

    @GetMapping("/cart")
    public String cart() { return "cart"; }

    // FIX: collapsed duplicate /login + /Login mappings that caused
    // Spring's ambiguous-mapping exception at startup.
    @GetMapping({"/login", "/Login"})
    public String login() { return "Login"; }

    @GetMapping("/profile")
    public String profile() { return "myprofile"; }

    @GetMapping({"/orders", "/myorders"})
    public String orders() { return "myorders"; }

    @GetMapping({"/wishlist", "/mywishlist"})
    public String wishlist() { return "mywishlist"; }

    @GetMapping("/notifications")
    public String notifications() { return "notifications"; }

    @GetMapping({"/forgot-password", "/ForgetPassword"})
    public String forgotPassword() { return "ForgetPassword"; }

    @GetMapping("/about")
    public String about() { return "about"; }

    @GetMapping("/contact")
    public String contact() { return "contact"; }

    @GetMapping("/myprofile")
    public String myProfile() { return "myprofile"; }

    @GetMapping("/OrderConformation")
    public String orderConformation() { return "OrderConformation"; }

    @GetMapping("/ProductDetailsAuction")
    public String productDetailsAuction() { return "ProductDetailsAuction"; }

    @GetMapping("/ProductDetailsStandard")
    public String productDetailsStandard() { return "ProductDetailsStandard"; }
}