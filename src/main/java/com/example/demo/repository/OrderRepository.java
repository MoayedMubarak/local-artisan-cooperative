package com.example.demo.repository;

import com.example.demo.model.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {

    // Used by OrderController to load a customer's order history
    List<Order> findByCustomer_UserId(Long customerId);
}