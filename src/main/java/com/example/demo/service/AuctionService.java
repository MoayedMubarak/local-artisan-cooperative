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

    public record AuctionSnapshot(
            long id,
            double currentHighestBid,
            String highestBidderName,
            LocalDateTime endTime,
            long secondsRemaining,
            String displayStatus
    ) {}

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

    /**
     * When every auction in the DB has already ended (typical on Replit with old seed dates),
     * refresh start/end windows relative to now so live and upcoming auctions appear again.
     */
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
        if (id != null && id == 4L) {
            auction.setStartTime(now.minusDays(60));
            auction.setEndTime(now.minusDays(14));
        } else if (id != null && id == 6L) {
            auction.setStartTime(now.plusDays(7));
            auction.setEndTime(now.plusDays(37));
        } else if (id != null && (id == 1L || id == 2L || id == 3L || id == 5L)) {
            auction.setStartTime(now.minusDays(7));
            auction.setEndTime(now.plusDays(21));
        } else {
            int index = id != null ? (int) (id % 3) : 0;
            if (index == 0) {
                auction.setStartTime(now.minusDays(5));
                auction.setEndTime(now.plusDays(14));
            } else if (index == 1) {
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

    public BidResult placeBid(Long auctionId, double bidAmount, String bidderName) {
        Auction auction = auctionRepository.findById(auctionId).orElse(null);
        if (auction == null) {
            return BidResult.error("Auction not found.");
        }

        String displayStatus = resolveDisplayStatus(auction);
        if (STATUS_ENDED.equals(displayStatus)) {
            return BidResult.error("Auction has already ended.");
        }
        if (STATUS_UPCOMING.equals(displayStatus)) {
            return BidResult.error("This auction has not started yet.");
        }

        if (bidderName == null || bidderName.isBlank()) {
            return BidResult.error("Please enter your name before placing a bid.");
        }

        if (bidAmount != Math.floor(bidAmount)) {
            return BidResult.error("Bids must be in whole BD amounts.");
        }

        int minBid = getMinimumBid(auction);
        if (bidAmount < minBid) {
            return BidResult.error("Bid must be at least " + minBid + " BD (current bid + 1 BD minimum).");
        }

        auction.setCurrentHighestBid(bidAmount);
        auction.setHighestBidderName(bidderName.trim());
        auction.setStatus(STATUS_LIVE);

        boolean extended = false;
        long secondsRemaining = ChronoUnit.SECONDS.between(LocalDateTime.now(), auction.getEndTime());
        if (secondsRemaining <= 30 && secondsRemaining >= 0) {
            auction.setEndTime(auction.getEndTime().plusMinutes(2));
            extended = true;
        }

        auctionRepository.save(auction);

        AuctionSnapshot snapshot = toSnapshot(auction);
        String message = extended
                ? "Bid placed successfully! Auction extended by 2 minutes (anti-snipe rule)."
                : "Bid placed successfully!";
        return BidResult.success(snapshot, message, extended);
    }

    public AuctionSnapshot toSnapshot(Auction auction) {
        long secondsRemaining = Math.max(0, ChronoUnit.SECONDS.between(LocalDateTime.now(), auction.getEndTime()));
        return new AuctionSnapshot(
                auction.getId(),
                auction.getCurrentHighestBid(),
                auction.getHighestBidderName(),
                auction.getEndTime(),
                secondsRemaining,
                resolveDisplayStatus(auction)
        );
    }
}
