package com.example.demo.service;

import java.time.LocalDateTime;

public class BidResult {
    private final boolean success;
    private final String message;
    private final double currentHighestBid;
    private final String highestBidderName;
    private final boolean extended;
    private final long secondsRemaining;
    private final LocalDateTime endTime;

    private BidResult(boolean success, String message, double currentHighestBid,
                      String highestBidderName, boolean extended, long secondsRemaining,
                      LocalDateTime endTime) {
        this.success = success;
        this.message = message;
        this.currentHighestBid = currentHighestBid;
        this.highestBidderName = highestBidderName;
        this.extended = extended;
        this.secondsRemaining = secondsRemaining;
        this.endTime = endTime;
    }

    public static BidResult error(String message) {
        return new BidResult(false, message, 0, null, false, 0, null);
    }

    public static BidResult success(AuctionService.AuctionSnapshot snapshot, String message, boolean extended) {
        return new BidResult(true, message, snapshot.currentHighestBid(), snapshot.highestBidderName(),
                extended, snapshot.secondsRemaining(), snapshot.endTime());
    }

    public boolean isSuccess() { return success; }
    public String getMessage() { return message; }
    public double getCurrentHighestBid() { return currentHighestBid; }
    public String getHighestBidderName() { return highestBidderName; }
    public boolean isExtended() { return extended; }
    public long getSecondsRemaining() { return secondsRemaining; }
    public LocalDateTime getEndTime() { return endTime; }
}
