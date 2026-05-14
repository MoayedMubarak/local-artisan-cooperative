package com.example.demo.repository;

import com.example.demo.model.Customer;
import com.example.demo.model.Wishlist;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface WishlistRepository extends JpaRepository<Wishlist, Long> {

    // Used by WishlistService (lookup by customer object)
    Optional<Wishlist> findByCustomer(Customer customer);

    // Used by WishlistController (lookup by email from header)
    Optional<Wishlist> findByCustomer_Email(String email);

    // Used by WishlistService (lookup by customer id)
    Optional<Wishlist> findByCustomer_UserId(Long customerId);
}