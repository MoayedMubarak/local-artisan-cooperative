package com.example.demo.controller;

import com.example.demo.model.Artisan;
import com.example.demo.model.OrderItem;
import com.example.demo.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.List;

@Controller
public class ArtisanController {

    @Autowired
    private ArtisanRepository artisanRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private AuctionRepository auctionRepository;

    @Autowired
    private OrderItemRepository orderItemRepository;

    @GetMapping("/artisanDashboard")
    public String dashboard(@RequestParam(required = false) Long id, Model model) {
        Long artisanId = (id != null) ? id : 2L; // Default to Elena for demo
        artisanRepository.findById(artisanId).ifPresent(artisan -> {
            model.addAttribute("artisan", artisan);

            // Stats
            model.addAttribute("productsCount", productRepository.countByArtisanUserId(artisanId));
            model.addAttribute("activeAuctions", auctionRepository.countByProductArtisanUserIdAndStatus(artisanId, "active"));

            List<OrderItem> orders = orderItemRepository.findByProductArtisanUserId(artisanId).stream()
                    .filter(o -> !"cart".equalsIgnoreCase(o.getOrder().getStatus()))
                    .toList();
            model.addAttribute("pendingOrders", orders.stream().filter(o -> "pending".equalsIgnoreCase(o.getOrder().getStatus())).count());
            model.addAttribute("totalRevenue", orders.stream().mapToDouble(o -> o.getPrice() * o.getQuantity()).sum());
            model.addAttribute("recentOrders", orders);
        });
        return "artisanDashboard";
    }

    @GetMapping("/artisanProducts")
    public String products(@RequestParam(required = false) Long id, Model model) {
        Long artisanId = (id != null) ? id : 2L;
        artisanRepository.findById(artisanId).ifPresent(artisan -> {
            model.addAttribute("artisan", artisan);
            model.addAttribute("products", productRepository.findByArtisanUserId(artisanId));
        });
        return "artisanProducts";
    }

    @GetMapping("/artisanAuction")
    public String auctions(@RequestParam(required = false) Long id, Model model) {
        Long artisanId = (id != null) ? id : 2L;
        artisanRepository.findById(artisanId).ifPresent(artisan -> {
            model.addAttribute("artisan", artisan);
            model.addAttribute("auctions", auctionRepository.findByProductArtisanUserId(artisanId));
        });
        return "artisanAuction";
    }

    @GetMapping("/artisanOrders")
    public String orders(@RequestParam(required = false) Long id, Model model) {
        Long artisanId = (id != null) ? id : 2L;
        artisanRepository.findById(artisanId).ifPresent(artisan -> {
            model.addAttribute("artisan", artisan);
            List<OrderItem> orders = orderItemRepository.findByProductArtisanUserId(artisanId).stream()
                    .filter(o -> !"cart".equalsIgnoreCase(o.getOrder().getStatus()))
                    .toList();
            model.addAttribute("orders", orders);
        });
        return "artisanOrders";
    }

    @GetMapping("/artisanAnalytics")
    public String analytics(@RequestParam(required = false) Long id, Model model) {
        Long artisanId = (id != null) ? id : 2L;
        artisanRepository.findById(artisanId).ifPresent(artisan -> {
            model.addAttribute("artisan", artisan);
            // For simplicity, reusing the same stats as dashboard
            model.addAttribute("productsCount", productRepository.countByArtisanUserId(artisanId));
            model.addAttribute("activeAuctions", auctionRepository.countByProductArtisanUserIdAndStatus(artisanId, "active"));

            List<OrderItem> orders = orderItemRepository.findByProductArtisanUserId(artisanId).stream()
                    .filter(o -> !"cart".equalsIgnoreCase(o.getOrder().getStatus()))
                    .toList();
            model.addAttribute("pendingOrders", orders.stream().filter(o -> "pending".equalsIgnoreCase(o.getOrder().getStatus())).count());
            model.addAttribute("totalRevenue", orders.stream().mapToDouble(o -> o.getPrice() * o.getQuantity()).sum());
            model.addAttribute("totalOrders", orders.size());
        });

        return "artisanAnalytics";
    }

    @GetMapping("/artisanSettings")
    public String settings(@RequestParam(required = false) Long id, Model model) {
        Long artisanId = (id != null) ? id : 2L;
        artisanRepository.findById(artisanId).ifPresent(artisan -> model.addAttribute("artisan", artisan));
        return "artisanSettings";
    }

    @GetMapping("/artisanOrderDetail")
    public String ordersDetail(@RequestParam(required = false) Long id, Model model) {
        Long artisanId = (id != null) ? id : 2L;
        artisanRepository.findById(artisanId).ifPresent(artisan -> model.addAttribute("artisan", artisan));
        return "artisanOrderDetail";
    }

    @GetMapping("/artisanNotification")
    public String notifications(@RequestParam(required = false) Long id, Model model) {
        Long artisanId = (id != null) ? id : 2L;
        artisanRepository.findById(artisanId).ifPresent(artisan -> model.addAttribute("artisan", artisan));
        return "artisanNotification";
    }
}