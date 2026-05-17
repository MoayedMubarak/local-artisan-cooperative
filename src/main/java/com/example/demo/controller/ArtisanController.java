package com.example.demo.controller;

import com.example.demo.model.Artisan;
import com.example.demo.model.OrderItem;
import com.example.demo.repository.*;
import com.example.demo.service.AuctionService;
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

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private AuctionService auctionService;

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

    /**
     * Total revenue = sum of (price × qty) for regular order items
     *               + sum of currentHighestBid for ENDED auctions belonging to this artisan
     */
    private double computeTotalRevenue(Long artisanId, List<OrderItem> orders) {
        // Revenue from standard product orders (exclude auction-item order lines to avoid double-counting)
        double orderRevenue = orders.stream()
                .filter(o -> o.getProduct() != null && !o.getProduct().isAuctionItem())
                .mapToDouble(o -> o.getPrice() * o.getQuantity())
                .sum();

        // Revenue from ended auctions: use the highest bid (actual sale price)
        double auctionRevenue = auctionRepository
                .findByProductArtisanUserIdAndStatus(artisanId, "ENDED")
                .stream()
                .filter(a -> a.getHighestBidder() != null)   // only sold auctions
                .mapToDouble(a -> a.getCurrentHighestBid())
                .sum();

        return orderRevenue + auctionRevenue;
    }

    @GetMapping("/artisanDashboard")
    public String dashboard(@RequestParam(required = false) Long id, Model model) {
        initEmptyModel(model);
        loadArtisan(id, model);
        if (id != null) {
            model.addAttribute("productsCount", productRepository.countByArtisanUserId(id));
            model.addAttribute("activeAuctions", auctionRepository.countByProductArtisanUserIdAndStatus(id, "LIVE"));
            List<OrderItem> orders = getArtisanOrderItems(id);
            model.addAttribute("pendingOrders", orders.stream()
                    .filter(o -> "pending".equalsIgnoreCase(o.getOrder().getStatus())).count());
            model.addAttribute("totalRevenue", computeTotalRevenue(id, orders));
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
        // Sync auction statuses so ENDED auctions are correctly marked
        try { auctionService.syncStoredStatuses(); } catch (Exception ignored) {}
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
            model.addAttribute("activeAuctions", auctionRepository.countByProductArtisanUserIdAndStatus(id, "LIVE"));
            List<OrderItem> orders = getArtisanOrderItems(id);
            model.addAttribute("pendingOrders", orders.stream()
                    .filter(o -> "pending".equalsIgnoreCase(o.getOrder().getStatus())).count());
            model.addAttribute("totalRevenue", computeTotalRevenue(id, orders));
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
    public String ordersDetail(@RequestParam(required = false) Long id,
                               @RequestParam(required = false) Long orderId,
                               Model model) {
        initEmptyModel(model);
        loadArtisan(id, model);

        if (id != null && orderId != null) {
            orderRepository.findById(orderId).ifPresent(order -> {
                model.addAttribute("order", order);

                List<OrderItem> allItems = orderItemRepository.findByOrderIdWithProduct(orderId);
                List<OrderItem> artisanItems = allItems.stream()
                        .filter(item -> item.getProduct() != null
                                && item.getProduct().getArtisan() != null
                                && item.getProduct().getArtisan().getUserId().equals(id))
                        .toList();
                model.addAttribute("orderItems", artisanItems);

                double artisanSubtotal = artisanItems.stream()
                        .mapToDouble(item -> item.getPrice() * item.getQuantity())
                        .sum();
                model.addAttribute("artisanSubtotal", artisanSubtotal);
            });
        }
        return "artisanOrderDetail";
    }

    @GetMapping("/artisanNotification")
    public String notifications(@RequestParam(required = false) Long id, Model model) {
        initEmptyModel(model);
        loadArtisan(id, model);
        return "artisanNotification";
    }
}
