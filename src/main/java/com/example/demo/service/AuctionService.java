package com.example.demo.service;

import com.example.demo.model.Auction;
import com.example.demo.repository.AuctionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.List;

@Service
public class AuctionService {

    public static final String STATUS_LIVE = "LIVE";
    public static final String STATUS_UPCOMING = "UPCOMING";
    public static final String STATUS_ENDED = "ENDED";

    @Autowired
    private AuctionRepository auctionRepository;

    /** Derive LIVE / UPCOMING / ENDED from database start_time and end_time. */
    public String resolveDisplayStatus(Auction auction) {
        LocalDateTime now = LocalDateTime.now();
        if (auction.getStartTime() != null && now.isBefore(auction.getStartTime())) {
            return STATUS_UPCOMING;
        }
        if (auction.getEndTime() != null && now.isAfter(auction.getEndTime())) {
            return STATUS_ENDED;
        }
        return STATUS_LIVE;
    }

    public void normalizeStatuses(List<Auction> auctions) {
        for (Auction auction : auctions) {
            auction.setStatus(resolveDisplayStatus(auction));
        }
    }

    /** Sort: live first, then upcoming, then ended. */
    public List<Auction> prepareAuctionsForDisplay(List<Auction> auctions) {
        normalizeStatuses(auctions);
        auctions.sort(Comparator
                .comparingInt((Auction a) -> statusSortOrder(a.getStatus()))
                .thenComparing(Auction::getEndTime, Comparator.nullsLast(Comparator.naturalOrder())));
        return auctions;
    }

    private int statusSortOrder(String status) {
        if (STATUS_LIVE.equals(status)) return 0;
        if (STATUS_UPCOMING.equals(status)) return 1;
        if (STATUS_ENDED.equals(status)) return 2;
        return 3;
    }

    /** Replit/Postgres often has old dates; refresh once when nothing is still open. */
    public void refreshStaleSchedules(List<Auction> auctions) {
        if (auctions.isEmpty()) {
            return;
        }
        LocalDateTime now = LocalDateTime.now();
        boolean anyStillOpen = auctions.stream()
                .anyMatch(a -> a.getEndTime() != null && a.getEndTime().isAfter(now));
        if (anyStillOpen) {
            return;
        }
        for (Auction auction : auctions) {
            applyRelativeSchedule(auction, now);
        }
        auctionRepository.saveAll(auctions);
    }

    private void applyRelativeSchedule(Auction auction, LocalDateTime now) {
        Long id = auction.getId();
        if (Long.valueOf(4L).equals(id)) {
            auction.setStartTime(now.minusDays(60));
            auction.setEndTime(now.minusDays(14));
        } else if (Long.valueOf(6L).equals(id)) {
            auction.setStartTime(now.plusDays(7));
            auction.setEndTime(now.plusDays(37));
        } else if (id != null && (id == 1L || id == 2L || id == 3L || id == 5L)) {
            auction.setStartTime(now.minusDays(7));
            auction.setEndTime(now.plusDays(21));
        } else {
            int bucket = id != null ? (int) (id % 3) : 0;
            if (bucket == 0) {
                auction.setStartTime(now.minusDays(5));
                auction.setEndTime(now.plusDays(14));
            } else if (bucket == 1) {
                auction.setStartTime(now.plusDays(3));
                auction.setEndTime(now.plusDays(24));
            } else {
                auction.setStartTime(now.minusDays(45));
                auction.setEndTime(now.minusDays(10));
            }
        }
        auction.setStatus(resolveDisplayStatus(auction));
    }

    public int getMinimumBid(Auction auction) {
        double base = Math.max(auction.getCurrentHighestBid(), auction.getStartingBid());
        return (int) Math.floor(base) + 1;
    }

    public String placeBid(Long auctionId, double bidAmount, String bidderName) {
        Auction auction = auctionRepository.findById(auctionId).orElse(null);
        if (auction == null) return "Auction not found.";

        String displayStatus = resolveDisplayStatus(auction);
        if (STATUS_ENDED.equals(displayStatus)) {
            return "Auction has already ended.";
        }
        if (STATUS_UPCOMING.equals(displayStatus)) {
            return "This auction has not started yet.";
        }

        if (bidderName == null || bidderName.isBlank()) {
            return "Please enter your name before placing a bid.";
        }

        if (bidAmount != Math.floor(bidAmount)) {
            return "Bids must be in whole BD amounts.";
        }

        int minBid = getMinimumBid(auction);
        if (bidAmount < minBid) {
            return "Bid must be at least " + minBid + " BD (current bid + 1 BD minimum).";
        }

        auction.setCurrentHighestBid(bidAmount);
        auction.setHighestBidderName(bidderName.trim());

        long secondsRemaining = ChronoUnit.SECONDS.between(LocalDateTime.now(), auction.getEndTime());
        if (secondsRemaining <= 30 && secondsRemaining >= 0) {
            auction.setEndTime(auction.getEndTime().plusMinutes(2));
        }

        auction.setStatus(STATUS_LIVE);
        auctionRepository.save(auction);
        return secondsRemaining <= 30
                ? "Bid placed successfully! Auction extended by 2 minutes (anti-snipe rule)."
                : "Bid placed successfully!";
    }
}
