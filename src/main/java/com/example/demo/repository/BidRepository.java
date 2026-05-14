package com.example.demo.repository;

import com.example.demo.model.Bid;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface BidRepository extends JpaRepository<Bid, Long> {

    // Used by AuctionController to show bid history newest-first
    List<Bid> findByAuction_IdOrderByBidTimeDesc(Long auctionId);

    // Used to fetch all bids placed by a specific customer
    List<Bid> findByCustomer_UserId(Long customerId);
}