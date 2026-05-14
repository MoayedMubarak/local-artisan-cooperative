package com.example.demo.model;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "users")
@Inheritance(strategy = InheritanceType.JOINED)
public abstract class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long userId;
    private String name;
    private String email;
    private String password;
    private String role;
    @Lob
    @Column(columnDefinition = "TEXT")
    private String profilePicture = "https://cdn-icons-png.flaticon.com/512/149/149071.png";
}
