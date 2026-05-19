package com.example.demo.repository;

import com.example.demo.model.Auction;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AuctionRepository extends JpaRepository<Auction, Long> {
    List<Auction> findByProductArtisanUserId(Long artisanId);
    long countByProductArtisanUserIdAndStatus(Long artisanId, String status);
    List<Auction> findByProductArtisanUserIdAndStatus(Long artisanId, String status);

    @org.springframework.data.jpa.repository.Query("SELECT a FROM Auction a WHERE a.status IS NULL OR UPPER(a.status) <> 'ENDED'")
    List<Auction> findActiveAndUpcomingAuctions();
}
