package com.example.demo.controller;

import com.example.demo.model.OrderItem;
import com.example.demo.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Controller
public class ArtisanController {

    @Autowired private ArtisanRepository artisanRepository;
    @Autowired private ProductRepository productRepository;
    @Autowired private AuctionRepository auctionRepository;
    @Autowired private OrderItemRepository orderItemRepository;

    @GetMapping("/artisan-dashboard")
    public String dashboard(@RequestParam(required = false) Long id, Model model) {
        Long artisanId = (id != null) ? id : 2L; // Default to first artisan for demo

        artisanRepository.findById(artisanId).ifPresent(artisan -> {
            model.addAttribute("artisan", artisan);
            model.addAttribute("productsCount",
                    productRepository.countByArtisanUserId(artisanId));
            model.addAttribute("activeAuctions",
                    auctionRepository.countByProductArtisanUserIdAndStatus(artisanId, "active"));

            List<OrderItem> orders = orderItemRepository.findByProductArtisanUserId(artisanId);
            model.addAttribute("pendingOrders", orders.stream()
                    .filter(o -> "pending".equalsIgnoreCase(o.getOrder().getStatus()))
                    .count());
            model.addAttribute("totalRevenue", orders.stream()
                    .mapToDouble(o -> o.getPrice() * o.getQuantity()).sum());
            model.addAttribute("recentOrders", orders);
        });

        return "artisanDashboard";
    }

    @GetMapping("/artisan-products")
    public String products(@RequestParam(required = false) Long id, Model model) {
        Long artisanId = (id != null) ? id : 2L;

        artisanRepository.findById(artisanId).ifPresent(artisan -> {
            model.addAttribute("artisan", artisan);
            model.addAttribute("products",
                    productRepository.findByArtisanUserId(artisanId));
        });

        return "artisanProducts";
    }
}