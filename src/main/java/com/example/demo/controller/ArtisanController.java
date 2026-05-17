package com.example.demo.controller;

import com.example.demo.model.Artisan;
import com.example.demo.model.Order;
import com.example.demo.model.OrderItem;
import com.example.demo.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.time.format.DateTimeFormatter;
import java.util.Arrays;
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

        if (orderId != null) {
            orderRepository.findById(orderId).ifPresent(order -> {
                model.addAttribute("order", order);

                // Format date
                if (order.getDate() != null) {
                    model.addAttribute("orderDate",
                        order.getDate().format(DateTimeFormatter.ofPattern("MMMM dd, yyyy")));
                }

                // Customer initials for avatar
                if (order.getCustomer() != null && order.getCustomer().getName() != null) {
                    String[] parts = order.getCustomer().getName().trim().split("\\s+");
                    String initials = parts.length >= 2
                        ? String.valueOf(parts[0].charAt(0)) + parts[parts.length - 1].charAt(0)
                        : String.valueOf(parts[0].charAt(0));
                    model.addAttribute("customerInitials", initials.toUpperCase());
                }

                // Filter order items to only this artisan's products
                final Long artisanId = id;
                List<OrderItem> artisanItems = (order.getOrderItems() != null && artisanId != null)
                    ? order.getOrderItems().stream()
                        .filter(oi -> oi.getProduct() != null
                            && oi.getProduct().getArtisan() != null
                            && oi.getProduct().getArtisan().getUserId().equals(artisanId))
                        .toList()
                    : (order.getOrderItems() != null ? order.getOrderItems() : Collections.emptyList());

                model.addAttribute("orderItems", artisanItems);

                double subtotal = artisanItems.stream()
                    .mapToDouble(oi -> oi.getPrice() * oi.getQuantity()).sum();
                model.addAttribute("orderSubtotal", subtotal);
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
