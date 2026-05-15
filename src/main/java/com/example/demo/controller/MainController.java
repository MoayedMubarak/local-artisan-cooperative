package com.example.demo.controller;

import com.example.demo.repository.ProductRepository;
import com.example.demo.repository.AuctionRepository;
import com.example.demo.repository.ReviewRepository;
import com.example.demo.repository.OrderRepository;
import com.example.demo.model.Order;
import com.example.demo.service.AuctionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;
import com.example.demo.model.Auction;

@Controller
public class MainController {

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private AuctionRepository auctionRepository;

    @Autowired
    private AuctionService auctionService;

    @Autowired
    private ReviewRepository reviewRepository;

    @Autowired
    private OrderRepository orderRepository;

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
        List<Auction> auctions = auctionRepository.findAll();
        auctionService.refreshStaleSchedules(auctions);
        auctions = auctionRepository.findAll();
        model.addAttribute("auctions", auctionService.prepareAuctionsForDisplay(auctions));
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
    public String orderConformation(@RequestParam(required = false) Long orderId, Model model) {
        if (orderId != null) {
            Optional<Order> orderOpt = orderRepository.findById(orderId);
            orderOpt.ifPresent(order -> model.addAttribute("order", order));
        }
        return "OrderConformation";
    }

    @GetMapping("/ProductDetailsAuction")
    public String productDetailsAuction(@RequestParam(required = false) Long id, Model model) {
        if (id != null) {
            auctionRepository.findById(id).ifPresent(auction -> {
                auction.setStatus(auctionService.resolveDisplayStatus(auction));
                long secondsRemaining = Math.max(0,
                        ChronoUnit.SECONDS.between(LocalDateTime.now(), auction.getEndTime()));
                model.addAttribute("auction", auction);
                model.addAttribute("minBid", auctionService.getMinimumBid(auction));
                model.addAttribute("secondsRemaining", secondsRemaining);
            });
        }
        return "ProductDetailsAuction";
    }

    @GetMapping("/ProductDetailsStandard")
    public String productDetailsStandard(@RequestParam(required = false) Long id, Model model) {
        if (id != null) {
            productRepository.findById(id).ifPresent(product -> {
                model.addAttribute("product", product);
                model.addAttribute("reviews", reviewRepository.findByProductIdWithCustomerOrderByDateDesc(id));
                Double avg = reviewRepository.findAverageRatingByProductId(id);
                long count = reviewRepository.countByProductId(id);
                model.addAttribute("averageRating", avg != null ? Math.round(avg * 10.0) / 10.0 : 0.0);
                model.addAttribute("reviewCount", count);
            });
        }
        return "ProductDetailsStandard";
    }
}
