package com.example.demo.service;

import com.example.demo.model.Auction;
import com.example.demo.model.Customer;
import com.example.demo.model.User;
import com.example.demo.repository.AuctionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Service
public class AuctionService {

    public static final String DISPLAY_LIVE = "LIVE";
    public static final String DISPLAY_UPCOMING = "UPCOMING";
    public static final String DISPLAY_ENDED = "ENDED";

    @Autowired
    private AuctionRepository auctionRepository;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private com.example.demo.repository.CustomerRepository customerRepository;

    @Autowired
    private com.example.demo.repository.UserRepository userRepository;

    public String resolveDisplayStatus(Auction auction) {
        if (auction == null) return DISPLAY_ENDED;
        LocalDateTime now = LocalDateTime.now();
        String stored = normalizeStatus(auction.getStatus());

        if (DISPLAY_ENDED.equals(stored)) {
            return DISPLAY_ENDED;
        }
        if (auction.getEndTime() != null && now.isAfter(auction.getEndTime())) {
            return DISPLAY_ENDED;
        }
        if (auction.getStartTime() != null && now.isBefore(auction.getStartTime())) {
            return DISPLAY_UPCOMING;
        }
        if (DISPLAY_UPCOMING.equals(stored) && auction.getStartTime() != null && now.isBefore(auction.getStartTime())) {
            return DISPLAY_UPCOMING;
        }
        return DISPLAY_LIVE;
    }

    public static String normalizeStatus(String status) {
        if (status == null || status.isBlank()) return "";
        String upper = status.trim().toUpperCase();
        if ("ACTIVE".equals(upper)) return DISPLAY_LIVE;
        return upper;
    }

    public Optional<Auction> findById(Long id) {
        return auctionRepository.findById(id);
    }

    public Map<String, Object> toDetailMap(Auction auction) {
        Map<String, Object> map = new HashMap<>();
        String displayStatus = resolveDisplayStatus(auction);
        map.put("id", auction.getId());
        map.put("displayStatus", displayStatus);
        map.put("startingBid", (int) Math.floor(auction.getStartingBid()));
        map.put("currentHighestBid", (int) Math.floor(auction.getCurrentHighestBid()));
        map.put("highestBidderName", auction.getHighestBidderName());
        map.put("startTime", auction.getStartTime() != null ? auction.getStartTime().toString() : null);
        map.put("endTime", auction.getEndTime() != null ? auction.getEndTime().toString() : null);
        map.put("minNextBid", computeMinNextBid(auction));

        long secondsRemaining = 0;
        if (auction.getEndTime() != null && DISPLAY_LIVE.equals(displayStatus)) {
            secondsRemaining = Math.max(0, ChronoUnit.SECONDS.between(LocalDateTime.now(), auction.getEndTime()));
        }
        map.put("secondsRemaining", secondsRemaining);

        if (auction.getProduct() != null) {
            map.put("productId", auction.getProduct().getId());
            map.put("name", auction.getProduct().getTitle());
            map.put("artist", auction.getProduct().getArtisanName());
            map.put("category", auction.getProduct().getCategory());
            map.put("imageUrl", auction.getProduct().getImageUrl());
            map.put("description", auction.getProduct().getDescription());
        }
        return map;
    }

    public int computeMinNextBid(Auction auction) {
        int current = (int) Math.floor(auction.getCurrentHighestBid());
        int starting = (int) Math.floor(auction.getStartingBid());
        if (current < starting) {
            return starting;
        }
        return current + 1;
    }

    public Map<String, Object> placeBid(Long auctionId, int bidAmount, String bidderName, Long bidderId) {
        Map<String, Object> result = new HashMap<>();
        Auction auction = auctionRepository.findById(auctionId).orElse(null);
        if (auction == null) {
            result.put("success", false);
            result.put("message", "Auction not found.");
            return result;
        }

        Customer newBidder = bidderId != null ? customerRepository.findById(bidderId).orElse(null) : null;
        if (newBidder == null && bidderId != null) {
            result.put("success", false);
            result.put("message", "User not found.");
            return result;
        }

        String displayStatus = resolveDisplayStatus(auction);
        if (DISPLAY_ENDED.equals(displayStatus)) {
            result.put("success", false);
            result.put("message", "Auction has already ended.");
            return result;
        }
        if (DISPLAY_UPCOMING.equals(displayStatus)) {
            result.put("success", false);
            result.put("message", "This auction has not started yet.");
            return result;
        }

        if (bidderName == null || bidderName.isBlank()) {
            result.put("success", false);
            result.put("message", "Please enter your name.");
            return result;
        }

        int minBid = computeMinNextBid(auction);
        if (bidAmount < minBid) {
            result.put("success", false);
            result.put("message", "Your bid must be at least " + minBid + " BD (current bid + 1 BD minimum).");
            return result;
        }

        // Notify previous highest bidder
        if (auction.getHighestBidder() != null && !auction.getHighestBidder().getUserId().equals(bidderId)) {
            notificationService.sendNotification(
                auction.getHighestBidder(),
                "Outbid!",
                "Someone has placed a higher bid of " + bidAmount + " BD on " + auction.getProduct().getTitle(),
                "BID_OUTBID",
                "/auctions" // Link to auctions page
            );
        }

        boolean extended = false;
        long secondsRemaining = ChronoUnit.SECONDS.between(LocalDateTime.now(), auction.getEndTime());
        if (secondsRemaining <= 30 && secondsRemaining >= 0) {
            auction.setEndTime(auction.getEndTime().plusMinutes(2));
            extended = true;
        }

        auction.setCurrentHighestBid(bidAmount);
        auction.setHighestBidderName(bidderName.trim());
        auction.setHighestBidder(newBidder);
        auction.setStatus(DISPLAY_LIVE);
        auctionRepository.save(auction);

        result.put("success", true);
        result.put("message", extended
                ? "Bid placed! Anti-snipe rule applied — auction extended by 2 minutes."
                : "Bid placed successfully!");
        result.put("extended", extended);
        result.put("auction", toDetailMap(auction));
        return result;
    }

    /** Keeps demo auctions visible on Replit when seed dates are in the past. */
    public void refreshStaleActiveAuctionWindows() {
        LocalDateTime now = LocalDateTime.now();
        for (Auction auction : auctionRepository.findAll()) {
            String stored = normalizeStatus(auction.getStatus());
            if (!DISPLAY_LIVE.equals(stored) && !"ACTIVE".equalsIgnoreCase(auction.getStatus())) {
                continue;
            }
            if (auction.getEndTime() == null || !auction.getEndTime().isBefore(now)) {
                continue;
            }
            if (auction.getStartTime() == null || auction.getStartTime().isAfter(now)) {
                auction.setStartTime(now.minusHours(1));
            }
            auction.setEndTime(now.plusDays(7));
            auction.setStatus(DISPLAY_LIVE);
            auctionRepository.save(auction);
        }
    }

    public void triggerAuctionStartNotification(Auction auction) {
        if (auction == null || auction.getProduct() == null) return;
        notifyAllUsers(
            "Auction Started!",
            "A new auction for " + auction.getProduct().getTitle() + " has just started!",
            "AUCTION_START",
            "/auctions"
        );
    }

    public void triggerAuctionEndNotifications(Auction auction) {
        if (auction == null || auction.getProduct() == null) return;

        // 1. Send "Auction Won" notification to the winner
        if (auction.getHighestBidder() != null) {
            notificationService.sendNotification(
                auction.getHighestBidder(),
                "Auction Won!",
                "Congratulations! You won the auction for " + auction.getProduct().getTitle() + " with a bid of " + auction.getCurrentHighestBid() + " BD",
                "AUCTION_WON",
                "/orders"
            );
        }

        // 2. Send "Auction Ended" notification to the artisan (seller)
        if (auction.getProduct().getArtisan() != null) {
            String artisanMsg = auction.getHighestBidder() != null 
                ? "Your auction for " + auction.getProduct().getTitle() + " has ended! Winner: " + auction.getHighestBidder().getName() + " with a bid of " + auction.getCurrentHighestBid() + " BD."
                : "Your auction for " + auction.getProduct().getTitle() + " has ended with no bids.";
            notificationService.sendNotification(
                auction.getProduct().getArtisan(),
                "Auction Ended",
                artisanMsg,
                "AUCTION_ENDED",
                "/artisanAuction"
            );
        }

        // 3. Send general "Auction Ended" notification to all other users
        notifyAllUsers(
            "Auction Ended",
            "The auction for " + auction.getProduct().getTitle() + " has ended.",
            "AUCTION_ENDED",
            "/auctions"
        );
    }

    public void syncStoredStatuses() {
        LocalDateTime now = LocalDateTime.now();
        for (Auction auction : auctionRepository.findAll()) {
            String resolved = resolveDisplayStatus(auction);
            String normalized = normalizeStatus(auction.getStatus());
            
            if (!resolved.equals(normalized)) {
                // Trigger notifications based on status change
                if (DISPLAY_LIVE.equals(resolved) && DISPLAY_UPCOMING.equals(normalized)) {
                    triggerAuctionStartNotification(auction);
                } else if (DISPLAY_ENDED.equals(resolved) && (DISPLAY_LIVE.equals(normalized) || DISPLAY_UPCOMING.equals(normalized))) {
                    triggerAuctionEndNotifications(auction);
                }
                
                auction.setStatus(resolved);
                auctionRepository.save(auction);
            }
            if (DISPLAY_ENDED.equals(resolved) && auction.getEndTime() != null && now.isAfter(auction.getEndTime())) {
                auction.setStatus(DISPLAY_ENDED);
                auctionRepository.save(auction);
            }
        }
    }

    private void notifyAllUsers(String title, String message, String type, String link) {
        userRepository.findAll().forEach(user -> {
            notificationService.sendNotification(user, title, message, type, link);
        });
    }
}
