package com.example.demo.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "artisans")
public class Artisan extends User {

    private String shopName;
    private String biography;
    // profilePicture removed — it now lives on the base User class
}