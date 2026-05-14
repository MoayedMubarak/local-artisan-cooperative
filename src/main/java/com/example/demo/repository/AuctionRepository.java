package com.example.demo.repository;

import com.example.demo.model.Auction;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AuctionRepository extends JpaRepository<Auction, Long> {
    long countByStatus(String status);
    long countByProductArtisanUserId(Long artisanId);
    long countByProductArtisanUserIdAndStatus(Long artisanId, String status);
}
