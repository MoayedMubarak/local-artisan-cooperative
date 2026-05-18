package com.example.demo.controller;

import com.example.demo.model.Artisan;
import com.example.demo.model.Order;
import com.example.demo.model.User;
import com.example.demo.model.Product;
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

import org.springframework.http.ResponseEntity;
import java.util.Map;
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

    @Autowired
    private com.example.demo.repository.WishlistItemRepository wishlistItemRepository;

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
    public String adminArtisanApproval(Model model) {
        List<Artisan> pendingArtisans = artisanRepository.findByStatusIn(List.of("pending approval", "pending"));
        List<Artisan> approvedArtisans = artisanRepository.findByStatus("active");
        List<Artisan> rejectedArtisans = artisanRepository.findByStatus("rejected");

        model.addAttribute("pendingArtisans", pendingArtisans);
        model.addAttribute("approvedArtisans", approvedArtisans);
        model.addAttribute("rejectedArtisans", rejectedArtisans);

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
    public String adminProducts(Model model) {
        List<Product> products = productRepository.findAll();
        java.util.Set<String> categories = new java.util.TreeSet<>();
        java.util.Set<String> artisans = new java.util.TreeSet<>();
        for (Product p : products) {
            if (p.getStockQuantity() <= 0 && !"out of stock".equalsIgnoreCase(p.getStatus())) {
                p.setStatus("out of stock");
                productRepository.save(p);
            }
            if (p.getCategory() != null && !p.getCategory().trim().isEmpty()) {
                categories.add(p.getCategory().trim());
            }
            if (p.getArtisanName() != null && !p.getArtisanName().trim().isEmpty()) {
                artisans.add(p.getArtisanName().trim());
            }
        }
        model.addAttribute("productsList", products);
        model.addAttribute("categoriesList", categories);
        model.addAttribute("artisansList", artisans);
        return "adminProducts";
    }

    @PostMapping("/admin/delete-product/{id}")
    @org.springframework.transaction.annotation.Transactional
    public String deleteProduct(@PathVariable Long id) {
        productRepository.findById(id).ifPresent(product -> {
            // Delete associated wishlist items
            var wishlistItems = wishlistItemRepository.findByProduct(product);
            wishlistItemRepository.deleteAll(wishlistItems);

            // Delete associated auctions
            var auctions = auctionRepository.findAll().stream()
                    .filter(a -> a.getProduct() != null && a.getProduct().getId().equals(id))
                    .toList();
            auctionRepository.deleteAll(auctions);
        });
        productRepository.deleteById(id);
        return "redirect:/adminProducts";
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
    public String adminUsersManagement(Model model) {
        List<User> users = userRepository.findAll();
        boolean needsSave = false;
        for (User u : users) {
            if (u.getStatus() == null) {
                if ("ARTISAN".equalsIgnoreCase(u.getRole())) {
                    u.setStatus("pending");
                } else {
                    u.setStatus("active");
                }
                needsSave = true;
            }
            if (u.getJoinDate() == null) {
                u.setJoinDate(java.time.LocalDateTime.now());
                needsSave = true;
            }
        }
        if (needsSave) {
            userRepository.saveAll(users);
        }
        model.addAttribute("usersList", users);
        return "adminUsersManagement";
    }

    @PostMapping("/approve-artisan/{id}")
    @org.springframework.transaction.annotation.Transactional
    public String approveArtisan(@PathVariable Long id) {
        userRepository.findById(id).ifPresent(user -> {
            user.setStatus("active");
            userRepository.save(user);
        });
        return "redirect:/adminArtisanApproval";
    }

    @PostMapping("/reject-artisan/{id}")
    @org.springframework.transaction.annotation.Transactional
    public String rejectArtisan(@PathVariable Long id) {
        userRepository.findById(id).ifPresent(user -> {
            user.setStatus("rejected");
            userRepository.save(user);
        });
        return "redirect:/adminArtisanApproval";
    }

    @PostMapping("/reconsider-artisan/{id}")
    @org.springframework.transaction.annotation.Transactional
    public String reconsiderArtisan(@PathVariable Long id) {
        userRepository.findById(id).ifPresent(user -> {
            user.setStatus("pending approval");
            userRepository.save(user);
        });
        return "redirect:/adminArtisanApproval";
    }

    @PostMapping("/suspend-artisan/{id}")
    @org.springframework.transaction.annotation.Transactional
    public String suspendArtisan(@PathVariable Long id) {
        userRepository.findById(id).ifPresent(user -> {
            user.setStatus("suspended");
            userRepository.save(user);
        });
        return "redirect:/adminArtisanApproval";
    }


    @PostMapping("/suspend-user/{id}")
    public String suspendUser(@PathVariable Long id) {
        userRepository.findById(id).ifPresent(user -> {
            user.setStatus("suspended");
            userRepository.save(user);
        });
        return "redirect:/adminUsersManagement";
    }

    @PostMapping("/api/admin/users/{id}/status")
    @ResponseBody
    public ResponseEntity<?> updateUserStatus(@PathVariable Long id, @RequestParam String status) {
        return userRepository.findById(id).map(user -> {
            user.setStatus(status.toLowerCase());
            userRepository.save(user);
            return ResponseEntity.ok(Map.of("success", true, "message", "User status updated to " + status));
        }).orElse(ResponseEntity.status(404).body(Map.of("success", false, "message", "User not found")));
    }

    @PostMapping("/api/admin/users/{id}/update")
    @ResponseBody
    public ResponseEntity<?> updateUserDetails(@PathVariable Long id, @RequestParam String name, @RequestParam String email) {
        return userRepository.findById(id).map(user -> {
            user.setName(name);
            user.setEmail(email);
            userRepository.save(user);
            return ResponseEntity.ok(Map.of("success", true, "message", "User updated successfully"));
        }).orElse(ResponseEntity.status(404).body(Map.of("success", false, "message", "User not found")));
    }

    @PostMapping("/api/admin/users/{id}/delete")
    @ResponseBody
    public ResponseEntity<?> deleteUserAccount(@PathVariable Long id) {
        return userRepository.findById(id).map(user -> {
            userRepository.delete(user);
            return ResponseEntity.ok(Map.of("success", true, "message", "User deleted successfully"));
        }).orElse(ResponseEntity.status(404).body(Map.of("success", false, "message", "User not found")));
    }
}
