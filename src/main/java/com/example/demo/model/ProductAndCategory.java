// ProductCategory.java
@Entity
@Data
public class ProductCategory {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long categoryId;
    private String name;
}

// Product.java
@Entity
@Data
public class Product {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long productId;
    private String name;
    private String description;
    private double price;
    private int stockQuantity;
    private LocalDate addingDate;
    private String images;

    @ManyToOne
    @JoinColumn(name = "artisan_id")
    private Artisan artisan; // The "Lists" relationship

    @ManyToOne
    @JoinColumn(name = "category_id")
    private ProductCategory productCategory; // The "Belongs to" relationship
}