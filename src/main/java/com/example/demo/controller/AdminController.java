package com.example.demo.controller;

import com.example.demo.model.Artisan;
import com.example.demo.model.Order;
import com.example.demo.model.User;
import com.example.demo.repository.ArtisanRepository;
import com.example.demo.repository.AuctionRepository;
import com.example.demo.repository.OrderRepository;
import com.example.demo.repository.ProductRepository;
import com.example.demo.repository.ReviewRepository;
import com.example.demo.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.temporal.WeekFields;
import java.util.List;
import java.util.Locale;

@Controller
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

    @GetMapping("/adminDashboard")
    public String dashboard(Model model) {
        long totalUsers = userRepository.count();
        long totalArtisans = artisanRepository.count();
        List<com.example.demo.model.Product> allProducts = productRepository.findAll();
        LocalDate now = LocalDate.now();
        
        long activeProducts = allProducts.stream()
            .filter(p -> p.getAddingDate() != null && 
                         p.getAddingDate().getMonthValue() == now.getMonthValue() && 
                         p.getAddingDate().getYear() == now.getYear())
            .count();
            
        long productsLastMonth = allProducts.stream()
            .filter(p -> p.getAddingDate() != null && 
                         p.getAddingDate().getMonthValue() == now.minusMonths(1).getMonthValue() && 
                         p.getAddingDate().getYear() == now.minusMonths(1).getYear())
            .count();
            
        double productGrowth = 0;
        if (productsLastMonth > 0) {
            productGrowth = ((double) (activeProducts - productsLastMonth) / productsLastMonth) * 100;
        } else if (activeProducts > 0) {
            productGrowth = 100.0;
        }
        
        List<com.example.demo.model.Auction> allAuctions = auctionRepository.findAll();
        long openAuctions = allAuctions.stream()
            .filter(a -> a.getStartTime() != null && 
                         a.getStartTime().getMonthValue() == now.getMonthValue() && 
                         a.getStartTime().getYear() == now.getYear())
            .count();
            
        long auctionsLastMonth = allAuctions.stream()
            .filter(a -> a.getStartTime() != null && 
                         a.getStartTime().getMonthValue() == now.minusMonths(1).getMonthValue() && 
                         a.getStartTime().getYear() == now.minusMonths(1).getYear())
            .count();
            
        double auctionGrowth = 0;
        if (auctionsLastMonth > 0) {
            auctionGrowth = ((double) (openAuctions - auctionsLastMonth) / auctionsLastMonth) * 100;
        } else if (openAuctions > 0) {
            auctionGrowth = 100.0;
        }
        
        List<com.example.demo.model.Review> allReviews = reviewRepository.findAll();
        long totalReviewsThisMonth = allReviews.stream()
            .filter(r -> r.getDate() != null && 
                         r.getDate().getMonthValue() == now.getMonthValue() && 
                         r.getDate().getYear() == now.getYear())
            .count();
            
        long reviewsLastMonth = allReviews.stream()
            .filter(r -> r.getDate() != null && 
                         r.getDate().getMonthValue() == now.minusMonths(1).getMonthValue() && 
                         r.getDate().getYear() == now.minusMonths(1).getYear())
            .count();
            
        double reviewGrowth = 0;
        if (reviewsLastMonth > 0) {
            reviewGrowth = ((double) (totalReviewsThisMonth - reviewsLastMonth) / reviewsLastMonth) * 100;
        } else if (totalReviewsThisMonth > 0) {
            reviewGrowth = 100.0;
        }

        model.addAttribute("totalUsers", totalUsers);
        model.addAttribute("totalArtisans", totalArtisans);
        model.addAttribute("activeProducts", activeProducts);
        model.addAttribute("openAuctions", openAuctions);
        model.addAttribute("totalReviews", totalReviewsThisMonth);
        
        // Mock percentages for now (as User has no createdAt)
        model.addAttribute("userGrowth", 8.2);
        model.addAttribute("artisanGrowth", 12.5);
        model.addAttribute("productGrowth", productGrowth);
        model.addAttribute("auctionGrowth", auctionGrowth);
        model.addAttribute("reviewGrowth", reviewGrowth);
        
        List<Order> allOrders = orderRepository.findAll();
        
        // Orders per week (last 6 weeks)
        int[] ordersPerWeek = new int[6];
        for (Order order : allOrders) {
            if (order.getDate() != null) {
                long daysBetween = java.time.temporal.ChronoUnit.DAYS.between(order.getDate(), now);
                if (daysBetween >= 0 && daysBetween < 42) {
                    int weekIndex = (int) (daysBetween / 7);
                    // weekIndex 0 is current week, up to 5 is 6 weeks ago
                    ordersPerWeek[5 - weekIndex]++;
                }
            }
        }
        model.addAttribute("ordersPerWeek", ordersPerWeek);
        
        // Revenue per month (last 6 months)
        double[] revenuePerMonth = new double[6];
        String[] monthLabels = new String[6];
        for (int i = 0; i < 6; i++) {
            LocalDate monthDate = now.minusMonths(5 - i);
            monthLabels[i] = monthDate.getMonth().name().substring(0, 3);
            final int currentMonth = monthDate.getMonthValue();
            final int currentYear = monthDate.getYear();
            
            double monthlyRevenue = allOrders.stream()
                .filter(o -> o.getDate() != null && o.getDate().getMonthValue() == currentMonth && o.getDate().getYear() == currentYear)
                .mapToDouble(Order::getTotalAmount)
                .sum();
            revenuePerMonth[i] = monthlyRevenue;
        }
        model.addAttribute("revenuePerMonth", revenuePerMonth);
        model.addAttribute("monthLabels", monthLabels);

        return "adminDashboard";
    }

    @GetMapping("/adminArtisanApproval")
    public String adminArtisanApproval() {
        return "adminArtisanApproval";
    }

    @GetMapping("/adminAuction")
    public String adminAuction() {
        return "adminAuction";
    }

    @GetMapping("/adminLogs")
    public String adminLogs() {
        return "adminLogs";
    }

    @GetMapping("/adminNotification")
    public String adminNotification() {
        return "adminNotification";
    }

    @GetMapping("/adminOrderDetail")
    public String adminOrderDetail() {
        return "adminOrderDetail";
    }

    @GetMapping("/adminOrderManagment")
    public String adminOrderManagment() {
        return "adminOrderManagment";
    }

    @GetMapping("/adminProducts")
    public String adminProducts() {
        return "adminProducts";
    }

    @GetMapping("/adminRefund")
    public String adminRefund() {
        return "adminRefund";
    }

    @GetMapping("/adminReports")
    public String adminReports() {
        return "adminReports";
    }

    @GetMapping("/adminReview")
    public String adminReview() {
        return "adminReview";
    }

    @GetMapping("/adminUsersManagement")
    public String adminUsersManagement() {
        return "adminUsersManagement";
    }

    @PostMapping("/approve-artisan/{id}")
    public String approveArtisan(@PathVariable Long id) {
        artisanRepository.findById(id).ifPresent(artisan -> {
            // Logic to approve artisan (e.g. set a flag if added)
            // For now, we'll just redirect
        });
        return "redirect:/adminDashboard";
    }

    @PostMapping("/suspend-user/{id}")
    public String suspendUser(@PathVariable Long id) {
        userRepository.findById(id).ifPresent(user -> {
            // Logic to suspend user
        });
        return "redirect:/adminDashboard";
    }
}
