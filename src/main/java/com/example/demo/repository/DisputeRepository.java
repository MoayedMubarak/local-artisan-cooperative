package com.example.demo.repository;

import com.example.demo.model.Dispute;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DisputeRepository extends JpaRepository<Dispute, Long> {
    long countByStatus(String status);
}
