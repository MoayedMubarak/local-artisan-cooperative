package com.example.demo.controller;

import com.example.demo.service.AuctionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.Map;

@RestController
@RequestMapping("/api/auctions")
public class AuctionController {

    @Autowired
    private AuctionService auctionService;

    @Autowired
    private com.example.demo.repository.AuctionRepository auctionRepository;

    @PostMapping("/{id}/bid")
    public ResponseEntity<Map<String, Object>> placeBid(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body) {
        double amount = parseAmount(body.get("amount"));
        String bidderName = body.get("bidderName") != null ? body.get("bidderName").toString() : "";

        String message = auctionService.placeBid(id, amount, bidderName);
        boolean success = message.contains("successfully");

        if (!success) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", message));
        }

        var auction = auctionRepository.findById(id).orElse(null);
        long secondsRemaining = 0;
        boolean extended = message.contains("extended");
        if (auction != null) {
            secondsRemaining = Math.max(0,
                    ChronoUnit.SECONDS.between(LocalDateTime.now(), auction.getEndTime()));
        }

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", message,
                "currentHighestBid", auction != null ? auction.getCurrentHighestBid() : amount,
                "highestBidderName", auction != null && auction.getHighestBidderName() != null
                        ? auction.getHighestBidderName() : bidderName,
                "extended", extended,
                "secondsRemaining", secondsRemaining
        ));
    }

    private double parseAmount(Object value) {
        if (value instanceof Number n) return n.doubleValue();
        if (value instanceof String s) return Double.parseDouble(s);
        return 0;
    }
}
