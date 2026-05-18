package com.example.demo.model;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "users")
@Inheritance(strategy = InheritanceType.JOINED)
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long userId;
    private String name;
    private String email;
    private String password;
    private String role;
    @Column(columnDefinition = "TEXT")
    private String profilePicture = "https://cdn-icons-png.flaticon.com/512/149/149071.png";

    private String status = "active";
    private java.time.LocalDateTime joinDate;
    private java.time.LocalDateTime lastActive;

    @PrePersist
    protected void onCreate() {
        joinDate = java.time.LocalDateTime.now();
    }
}
