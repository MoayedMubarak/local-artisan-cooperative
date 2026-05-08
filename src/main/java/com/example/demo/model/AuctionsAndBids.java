// Auction.java
@Entity
@Data
public class Auction {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long auctionId;
    private double startBid;
    private double currentBid;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private String status;

    @OneToOne
    @JoinColumn(name = "product_id")
    private Product product; // The "Listed in" relationship

    @ManyToOne
    @JoinColumn(name = "admin_id")
    private Admin admin; // The "Schedules" relationship
}

// Bid.java
@Entity
@Data
public class Bid {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long bidId;
    private double bidAmount;
    private LocalDateTime bidTime;

    @ManyToOne
    @JoinColumn(name = "customer_id")
    private Customer customer; // The "places" relationship

    @ManyToOne
    @JoinColumn(name = "auction_id")
    private Auction auction; // The "Receive" relationship
}