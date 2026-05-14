package com.example.demo.controller;

import com.example.demo.repository.ProductRepository;
import com.example.demo.repository.AuctionRepository;
import com.example.demo.service.AuctionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@Controller
public class MainController {

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private AuctionRepository auctionRepository;

    @Autowired
    private ArtisanRepository artisanRepository;

    @Autowired
    private OrderItemRepository orderItemRepository;

    @Autowired
    private AuctionService auctionService;

    @GetMapping("/")
    public String index(Model model) {
        model.addAttribute("featuredProducts", productRepository.findAll().stream().limit(6).collect(java.util.stream.Collectors.toList()));
        return "index";
    }

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

    @PostMapping("/auctions/bid")
    public String placeBid(@RequestParam Long auctionId, @RequestParam double amount, Model model) {
        String message = auctionService.placeBid(auctionId, amount, "Jane Doe");
        model.addAttribute("message", message);
        return "redirect:/auctions";
    }

    @GetMapping("/cart")
    public String cart() {
        return "cart";
    }

    @GetMapping("/login")
    public String login() {
        return "Login";
    }

    @GetMapping("/profile")
    public String profile() {
        return "myprofile";
    }

    @GetMapping("/orders")
    public String orders() {
        return "myorders";
    }

    @GetMapping("/wishlist")
    public String wishlist() {
        return "mywishlist";
    }

    @GetMapping("/notifications")
    public String notifications() {
        return "notifications";
    }

    @GetMapping("/artisan-products")
    public String artisanProducts(@RequestParam(required = false) Long id, Model model) {
        // Fallback for demonstration if no ID is provided (e.g., Artisan Elena)
        Long artisanId = (id != null) ? id : 2L; 
        
        artisanRepository.findById(artisanId).ifPresent(artisan -> {
            model.addAttribute("artisan", artisan);
            model.addAttribute("products", productRepository.findByArtisanUserId(artisanId));
        });
        
        return "artisanProducts";
    }

    @GetMapping("/artisan-dashboard")
    public String artisanDashboard(@RequestParam(required = false) Long id, Model model) {
        // Fallback for demonstration if no ID is provided (e.g., Artisan Elena)
        Long artisanId = (id != null) ? id : 2L; 
        
        artisanRepository.findById(artisanId).ifPresent(artisan -> {
            model.addAttribute("artisan", artisan);
            
            // KPI Stats
            long productsCount = productRepository.countByArtisanUserId(artisanId);
            long activeAuctions = auctionRepository.countByProductArtisanUserIdAndStatus(artisanId, "active");
            
            List<com.example.demo.model.OrderItem> orderItems = orderItemRepository.findByProductArtisanUserId(artisanId);
            long pendingOrders = orderItems.stream()
                .filter(item -> "pending".equalsIgnoreCase(item.getOrder().getStatus()))
                .count();
                
            double totalRevenue = orderItems.stream()
                .mapToDouble(item -> item.getPrice() * item.getQuantity())
                .sum();
            
            model.addAttribute("productsCount", productsCount);
            model.addAttribute("activeAuctions", activeAuctions);
            model.addAttribute("pendingOrders", pendingOrders);
            model.addAttribute("totalRevenue", totalRevenue);
            model.addAttribute("recentOrders", orderItems);
        });
        
        return "artisanDashboard";
    }

    @GetMapping("/forgot-password")
    public String forgotPassword() {
        return "ForgetPassword";
    }

    @GetMapping("/about")
    public String about() {
        return "about";
    }

    @GetMapping("/contact")
    public String contact() {
        return "contact";
    }

    @GetMapping("/index")
    public String indexAlt() {
        return "index";
    }

    @GetMapping("/Login")
    public String loginAlt() {
        return "Login";
    }

    @GetMapping("/ForgetPassword")
    public String forgetPasswordAlt() {
        return "ForgetPassword";
    }

    @GetMapping("/myprofile")
    public String myProfile() {
        return "myprofile";
    }

    @GetMapping("/myorders")
    public String myOrders() {
        return "myorders";
    }

    @GetMapping("/mywishlist")
    public String myWishlist() {
        return "mywishlist";
    }

    @GetMapping("/OrderConformation")
    public String orderConformation() {
        return "OrderConformation";
    }

    @GetMapping("/ProductDetailsAuction")
    public String productDetailsAuction() {
        return "ProductDetailsAuction";
    }

    @GetMapping("/ProductDetailsStandard")
    public String productDetailsStandard(@RequestParam(required = false) Long id, Model model) {
        if (id != null) {
            productRepository.findById(id).ifPresent(product -> model.addAttribute("product", product));
        }
        return "ProductDetailsStandard";
    }
}
