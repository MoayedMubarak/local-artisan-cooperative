package com.example.demo.controller;

import com.example.demo.service.AuctionService;
import com.example.demo.service.BidResult;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auctions")
public class AuctionController {

    @Autowired
    private AuctionService auctionService;

    @PostMapping("/{id}/bid")
    public ResponseEntity<?> placeBid(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body) {
        double amount = parseAmount(body.get("amount"));
        String bidderName = body.get("bidderName") != null ? body.get("bidderName").toString() : "";

        BidResult result = auctionService.placeBid(id, amount, bidderName);
        if (!result.isSuccess()) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", result.getMessage()
            ));
        }

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", result.getMessage(),
                "currentHighestBid", result.getCurrentHighestBid(),
                "highestBidderName", result.getHighestBidderName(),
                "extended", result.isExtended(),
                "secondsRemaining", result.getSecondsRemaining(),
                "endTime", result.getEndTime() != null ? result.getEndTime().toString() : null
        ));
    }

    private double parseAmount(Object value) {
        if (value instanceof Number number) {
            return number.doubleValue();
        }
        if (value instanceof String str) {
            return Double.parseDouble(str);
        }
        return 0;
    }
}
