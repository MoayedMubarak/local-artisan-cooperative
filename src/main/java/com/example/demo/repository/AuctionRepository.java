package com.example.demo.repository;

import com.example.demo.model.Auction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface AuctionRepository extends JpaRepository<Auction, Long> {

    // Used by AuctionController ?status= filter (live/upcoming/ended tabs)
    List<Auction> findByStatus(String status);

    // Used by ArtisanController dashboard to count active auctions per artisan
    long countByProductArtisanUserIdAndStatus(Long artisanId, String status);
}