package com.example.demo.service;

import com.example.demo.model.Auction;
import com.example.demo.repository.AuctionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

@Service
public class AuctionService {

    @Autowired
    private AuctionRepository auctionRepository;

    public String placeBid(Long auctionId, double bidAmount, String bidderName) {
        Auction auction = auctionRepository.findById(auctionId).orElse(null);
        if (auction == null) return "Auction not found.";

        if (LocalDateTime.now().isAfter(auction.getEndTime())) {
            return "Auction has already ended.";
        }

        if (bidAmount <= auction.getCurrentHighestBid() || bidAmount < auction.getStartingBid()) {
            return "Bid must be higher than the current highest bid.";
        }

        auction.setCurrentHighestBid(bidAmount);
        auction.setHighestBidderName(bidderName);

        // Anti-Sniping Rule: If bid is placed in the last 30 seconds, extend by 2 mins
        long secondsRemaining = ChronoUnit.SECONDS.between(LocalDateTime.now(), auction.getEndTime());
        if (secondsRemaining <= 30) {
            auction.setEndTime(auction.getEndTime().plusMinutes(2));
        }

        auctionRepository.save(auction);
        return "Bid placed successfully!";
    }
}
