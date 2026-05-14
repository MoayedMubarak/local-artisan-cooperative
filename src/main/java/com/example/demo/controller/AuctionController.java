package com.example.demo.controller;

import com.example.demo.model.Auction;
import com.example.demo.model.Bid;
import com.example.demo.model.Customer;
import com.example.demo.repository.AuctionRepository;
import com.example.demo.repository.BidRepository;
import com.example.demo.repository.UserRepository;
import com.example.demo.service.AuctionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/auctions")
public class AuctionController {

    @Autowired private AuctionRepository auctionRepository;
    @Autowired private BidRepository bidRepository;
    @Autowired private AuctionService auctionService;
    @Autowired private UserRepository userRepository;

    // GET /api/auctions              — all auctions
    // GET /api/auctions?status=active    — live only
    // GET /api/auctions?status=upcoming  — upcoming only
    // GET /api/auctions?status=ended     — ended only
    @GetMapping
    public ResponseEntity<List<Auction>> getAllAuctions(
            @RequestParam(required = false) String status) {
        List<Auction> result = (status != null && !status.isBlank())
                ? auctionRepository.findByStatus(status)
                : auctionRepository.findAll();
        return ResponseEntity.ok(result);
    }

    // GET /api/auctions/5
    @GetMapping("/{id}")
    public ResponseEntity<?> getAuction(@PathVariable Long id) {
        return auctionRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // GET /api/auctions/5/bids — bid history newest-first
    @GetMapping("/{id}/bids")
    public ResponseEntity<List<Bid>> getBidHistory(@PathVariable Long id) {
        return ResponseEntity.ok(
                bidRepository.findByAuction_IdOrderByBidTimeDesc(id));
    }

    // POST /api/auctions/5/bid
    // Body: { "customerId": 3, "amount": 250.00 }
    @PostMapping("/{id}/bid")
    public ResponseEntity<?> placeBid(@PathVariable Long id,
                                      @RequestBody Map<String, Object> payload) {
        try {
            double amount     = Double.parseDouble(payload.get("amount").toString());
            Long   customerId = Long.valueOf(payload.get("customerId").toString());

            // Safe cast — returns 400 instead of crashing if user is not a Customer
            Customer customer = resolveCustomer(customerId);
            if (customer == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("message", "Customer not found or user is not a customer."));
            }

            String result = auctionService.placeBid(id, amount, customer.getName());
            if (!result.equals("Bid placed successfully!")) {
                return ResponseEntity.badRequest().body(Map.of("message", result));
            }

            Auction auction = auctionRepository.findById(id).orElseThrow();
            Bid bid = new Bid();
            bid.setAuction(auction);
            bid.setCustomer(customer);
            bid.setBidAmount(amount);
            bid.setBidTime(LocalDateTime.now());
            bidRepository.save(bid);

            return ResponseEntity.ok(Map.of(
                    "message",        result,
                    "newHighestBid",  amount,
                    "auctionEndTime", auction.getEndTime().toString()
            ));

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    private Customer resolveCustomer(Long customerId) {
        return userRepository.findById(customerId)
                .filter(u -> u instanceof Customer)
                .map(u -> (Customer) u)
                .orElse(null);
    }
}