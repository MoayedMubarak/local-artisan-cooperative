package com.example.demo.repository;

import com.example.demo.model.Product;
import com.example.demo.model.Wishlist;
import com.example.demo.model.WishlistItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Optional;

@Repository
public interface WishlistItemRepository extends JpaRepository<WishlistItem, Long> {

    // Used by WishlistService to get all items in a wishlist
    List<WishlistItem> findByWishlist_WishlistId(Long wishlistId);

    // Used by teammate's WishlistController (object-based lookup)
    Optional<WishlistItem> findByWishlistAndProduct(Wishlist wishlist, Product product);

    // Used by WishlistService duplicate check
    boolean existsByWishlist_WishlistIdAndProduct_Id(Long wishlistId, Long productId);

    // Used by WishlistService to remove by wishlist+product directly
    @Transactional
    void deleteByWishlistAndProduct(Wishlist wishlist, Product product);
}