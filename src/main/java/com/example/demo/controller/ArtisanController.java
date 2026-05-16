package com.example.demo.controller;

import com.example.demo.model.Artisan;
import com.example.demo.model.OrderItem;
import com.example.demo.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.Collections;
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

    private void initEmptyModel(Model model) {
        model.addAttribute("productsCount", 0L);
        model.addAttribute("activeAuctions", 0L);
        model.addAttribute("pendingOrders", 0L);
        model.addAttribute("totalRevenue", 0.0);
        model.addAttribute("recentOrders", Collections.emptyList());
        model.addAttribute("products", Collections.emptyList());
        model.addAttribute("orders", Collections.emptyList());
        model.addAttribute("auctions", Collections.emptyList());
        model.addAttribute("ordersCount", 0L);
    }

    private void loadArtisan(Long artisanId, Model model) {
        if (artisanId == null) {
            model.addAttribute("artisan", null);
            return;
        }
        artisanRepository.findById(artisanId).ifPresentOrElse(
                artisan -> model.addAttribute("artisan", artisan),
                () -> model.addAttribute("artisan", null)
        );
    }

    private List<OrderItem> getArtisanOrderItems(Long artisanId) {
        if (artisanId == null) {
            return Collections.emptyList();
        }
        return orderItemRepository.findByProductArtisanUserId(artisanId).stream()
                .filter(o -> o.getOrder() != null && !"cart".equalsIgnoreCase(o.getOrder().getStatus()))
                .toList();
    }

    @GetMapping("/artisanDashboard")
    public String dashboard(@RequestParam(required = false) Long id, Model model) {
        initEmptyModel(model);
        loadArtisan(id, model);
        if (id != null) {
            model.addAttribute("productsCount", productRepository.countByArtisanUserId(id));
            model.addAttribute("activeAuctions", auctionRepository.countByProductArtisanUserIdAndStatus(id, "active"));
            List<OrderItem> orders = getArtisanOrderItems(id);
            model.addAttribute("pendingOrders", orders.stream()
                    .filter(o -> "pending".equalsIgnoreCase(o.getOrder().getStatus())).count());
            model.addAttribute("totalRevenue", orders.stream().mapToDouble(o -> o.getPrice() * o.getQuantity()).sum());
            model.addAttribute("recentOrders", orders);
        }
        return "artisanDashboard";
    }

    @GetMapping("/artisanProducts")
    public String products(@RequestParam(required = false) Long id, Model model) {
        initEmptyModel(model);
        loadArtisan(id, model);
        if (id != null) {
            model.addAttribute("products", productRepository.findByArtisanUserId(id));
            model.addAttribute("productsCount", productRepository.countByArtisanUserId(id));
        }
        return "artisanProducts";
    }

    @GetMapping("/artisanAuction")
    public String auctions(@RequestParam(required = false) Long id, Model model) {
        initEmptyModel(model);
        loadArtisan(id, model);
        if (id != null) {
            model.addAttribute("auctions", auctionRepository.findByProductArtisanUserId(id));
        }
        return "artisanAuction";
    }

    @GetMapping("/artisanOrders")
    public String orders(@RequestParam(required = false) Long id, Model model) {
        initEmptyModel(model);
        loadArtisan(id, model);
        if (id != null) {
            List<OrderItem> orderItems = getArtisanOrderItems(id);
            model.addAttribute("orders", orderItems);
            model.addAttribute("ordersCount", (long) orderItems.size());
        }
        return "artisanOrders";
    }

    @GetMapping("/artisanAnalytics")
    public String analytics(@RequestParam(required = false) Long id, Model model) {
        initEmptyModel(model);
        loadArtisan(id, model);
        if (id != null) {
            model.addAttribute("productsCount", productRepository.countByArtisanUserId(id));
            model.addAttribute("activeAuctions", auctionRepository.countByProductArtisanUserIdAndStatus(id, "active"));
            List<OrderItem> orders = getArtisanOrderItems(id);
            model.addAttribute("pendingOrders", orders.stream()
                    .filter(o -> "pending".equalsIgnoreCase(o.getOrder().getStatus())).count());
            model.addAttribute("totalRevenue", orders.stream().mapToDouble(o -> o.getPrice() * o.getQuantity()).sum());
            model.addAttribute("ordersCount", (long) orders.size());
        }
        return "artisanAnalytics";
    }

    @GetMapping("/artisanSettings")
    public String settings(@RequestParam(required = false) Long id, Model model) {
        initEmptyModel(model);
        loadArtisan(id, model);
        return "artisanSettings";
    }

    @GetMapping("/artisanOrderDetail")
    public String ordersDetail(@RequestParam(required = false) Long id, Model model) {
        initEmptyModel(model);
        loadArtisan(id, model);
        return "artisanOrderDetail";
    }

    @GetMapping("/artisanNotification")
    public String notifications(@RequestParam(required = false) Long id, Model model) {
        initEmptyModel(model);
        loadArtisan(id, model);
        return "artisanNotification";
    }
}
