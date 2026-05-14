package com.example.demo.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;

@Data
@Entity
@Table(name = "disputes")
public class Dispute {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;

    @Column(length = 1000)
    private String description;

    private String status;

    private String customerName;
    private String artisanName;

    private LocalDate createdDate;

    @Column(length = 1000)
    private String resolution;

    private LocalDate resolvedDate;
}
