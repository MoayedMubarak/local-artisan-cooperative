package com.example.demo.model;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "products")
public class Product {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;
    @Column(length = 1000)
    private String description;
    private double price;
    private String category; // e.g., Ceramics, Jewelry
    private String imageUrl;
    private int stockQuantity;
    private String artisanName;
    private boolean isAuctionItem;
}
