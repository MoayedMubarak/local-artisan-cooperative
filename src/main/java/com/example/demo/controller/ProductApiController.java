package com.example.demo.controller;

import com.example.demo.model.Product;
import com.example.demo.model.Artisan;
import com.example.demo.model.Auction;
import com.example.demo.service.ProductService;
import com.example.demo.service.AuctionService;
import com.example.demo.repository.ProductRepository;
import com.example.demo.repository.ArtisanRepository;
import com.example.demo.repository.AuctionRepository;
import com.example.demo.repository.WishlistItemRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.List;

@RestController
@RequestMapping("/api/products")
public class ProductApiController {

    @Autowired
    private ProductService productService;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private ArtisanRepository artisanRepository;

    @Autowired
    private AuctionRepository auctionRepository;

    @Autowired
    private WishlistItemRepository wishlistItemRepository;

    @Autowired
    private AuctionService auctionService;

    @PostMapping
    public ResponseEntity<?> createProduct(@RequestBody Map<String, Object> payload) {
        try {
            String email = (String) payload.get("artisanEmail");
            String title = (String) payload.get("title");
            String description = (String) payload.get("description");
            double price = Double.parseDouble(payload.get("price").toString());
            String category = (String) payload.get("category");
            String imageUrl = (String) payload.get("imageUrl");
            int stockQuantity = Integer.parseInt(payload.get("stockQuantity").toString());
            boolean isAuctionItem = Boolean.parseBoolean(payload.get("isAuctionItem").toString());

            Artisan artisan = artisanRepository.findByEmail(email)
                    .orElseThrow(() -> new IllegalArgumentException("Artisan not found"));

            Product product = new Product();
            product.setArtisan(artisan);
            product.setArtisanName(artisan.getName());
            product.setTitle(title);
            product.setDescription(description);
            product.setPrice(price);
            product.setCategory(category);
            product.setImageUrl(imageUrl);
            product.setStockQuantity(stockQuantity);
            product.setAuctionItem(isAuctionItem);
            product.setAddingDate(java.time.LocalDate.now());

            Product saved = productRepository.save(product);

            if (isAuctionItem) {
                Auction auction = new Auction();
                auction.setProduct(saved);
                auction.setStartingBid(price);
                auction.setCurrentHighestBid(price);
                auction.setStartTime(java.time.LocalDateTime.now());
                
                String endTimeStr = (String) payload.get("endTime");
                if (endTimeStr != null && !endTimeStr.isBlank()) {
                    auction.setEndTime(java.time.LocalDateTime.parse(endTimeStr));
                } else {
                    auction.setEndTime(java.time.LocalDateTime.now().plusDays(7));
                }
                auction.setStatus("active");
                Auction savedAuction = auctionRepository.save(auction);
                
                try {
                    auctionService.triggerAuctionStartNotification(savedAuction);
                } catch (Exception ex) {
                    // Ignore
                }
            }

            return ResponseEntity.ok(Map.of("success", true, "product", saved));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateProduct(@PathVariable Long id, @RequestBody Product product) {
        try {
            Product updated = productService.updateProduct(id, product);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteProduct(@PathVariable Long id) {
        try {
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
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }
}

