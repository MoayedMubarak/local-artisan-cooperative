package com.example.demo.service;

import com.example.demo.model.*;
import com.example.demo.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.util.List;

@Service
public class WishlistService {

    @Autowired private WishlistRepository wishlistRepository;
    @Autowired private WishlistItemRepository wishlistItemRepository;
    @Autowired private ProductRepository productRepository;

    // Finds existing wishlist or creates one on first use
    private Wishlist getOrCreateWishlist(Customer customer) {
        return wishlistRepository.findByCustomer(customer)
                .orElseGet(() -> {
                    Wishlist w = new Wishlist();
                    w.setCustomer(customer);
                    w.setDateCreated(LocalDate.now());
                    return wishlistRepository.save(w);
                });
    }

    public List<WishlistItem> getWishlistItems(Customer customer) {
        Wishlist wishlist = getOrCreateWishlist(customer);
        return wishlistItemRepository.findByWishlist_WishlistId(wishlist.getWishlistId());
    }

    public String addToWishlist(Customer customer, Long productId) {
        Wishlist wishlist = getOrCreateWishlist(customer);

        if (wishlistItemRepository.existsByWishlist_WishlistIdAndProduct_Id(
                wishlist.getWishlistId(), productId)) {
            return "Product is already in your wishlist.";
        }

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new IllegalArgumentException("Product not found."));

        WishlistItem item = new WishlistItem();
        item.setWishlist(wishlist);
        item.setProduct(product);
        item.setDateAdded(LocalDate.now());
        wishlistItemRepository.save(item);

        return "Product added to wishlist.";
    }

    public String removeFromWishlist(Long wishlistItemId) {
        if (!wishlistItemRepository.existsById(wishlistItemId)) {
            return "Item not found in wishlist.";
        }
        wishlistItemRepository.deleteById(wishlistItemId);
        return "Item removed from wishlist.";
    }
}