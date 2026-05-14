package com.example.demo.repository;

import com.example.demo.model.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {

    // Used by OrderService to look up the payment linked to an order
    Optional<Payment> findByOrder_OrderId(Long orderId);
}