package com.example.demo.service;

import com.example.demo.model.Product;
import com.example.demo.model.WishlistItem;
import com.example.demo.repository.ProductRepository;
import com.example.demo.repository.WishlistItemRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ProductService {

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private WishlistItemRepository wishlistItemRepository;

    @Autowired
    private NotificationService notificationService;

    @Transactional
    public Product updateProduct(Long productId, Product updatedDetails) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new IllegalArgumentException("Product not found"));

        double oldPrice = product.getPrice();
        int oldStock = product.getStockQuantity();

        product.setTitle(updatedDetails.getTitle());
        product.setDescription(updatedDetails.getDescription());
        product.setPrice(updatedDetails.getPrice());
        product.setStockQuantity(updatedDetails.getStockQuantity());
        product.setCategory(updatedDetails.getCategory());
        product.setImageUrl(updatedDetails.getImageUrl());

        productRepository.save(product);

        // Check for discount or restock to notify wishlist users
        if (product.getPrice() < oldPrice) {
            notifyWishlistUsers(product, "Price Drop!", "An item in your wishlist, " + product.getTitle() + ", is now cheaper! Only " + product.getPrice() + " BD");
        } else if (oldStock == 0 && product.getStockQuantity() > 0) {
            notifyWishlistUsers(product, "Back in Stock!", "Good news! " + product.getTitle() + " is back in stock.");
        }

        return product;
    }

    private void notifyWishlistUsers(Product product, String title, String message) {
        List<WishlistItem> items = wishlistItemRepository.findByProduct(product);
        for (WishlistItem item : items) {
            if (item.getWishlist() != null && item.getWishlist().getCustomer() != null) {
                notificationService.sendNotification(
                    item.getWishlist().getCustomer(),
                    title,
                    message,
                    "WISHLIST_UPDATE",
                    "/product-details?id=" + product.getId()
                );
            }
        }
    }
}
