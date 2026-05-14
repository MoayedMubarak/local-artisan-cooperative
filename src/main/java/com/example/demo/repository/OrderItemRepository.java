package com.example.demo.repository;

import com.example.demo.model.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {

    // Used by OrderService to fetch line-items for a specific order
    List<OrderItem> findByOrder_OrderId(Long orderId);

    // Used by ArtisanController to show sales per artisan
    List<OrderItem> findByProductArtisanUserId(Long artisanId);
}