package com.example.demo.controller;

import com.example.demo.model.Customer;
import com.example.demo.model.Order;
import com.example.demo.model.OrderItem;
import com.example.demo.repository.CustomerRepository;
import com.example.demo.repository.OrderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import org.springframework.transaction.annotation.Transactional;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private com.example.demo.service.NotificationService notificationService;

    @GetMapping
    @Transactional(readOnly = true)
    public ResponseEntity<?> getMyOrders(@RequestHeader(value = "X-User-Email", required = false) String email) {
        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Missing X-User-Email"));
        }

        Optional<Customer> customerOpt = customerRepository.findByEmail(email.trim());
        if (customerOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("success", false, "message", "Customer not found"));
        }

        Customer customer = customerOpt.get();
        List<Order> orders = orderRepository.findByCustomerAndStatusNotIgnoreCaseOrderByDateDesc(customer, "cart");

        List<Map<String, Object>> response = new ArrayList<>();
        for (Order order : orders) {
            Map<String, Object> orderMap = new HashMap<>();
            orderMap.put("orderId", order.getOrderId());
            orderMap.put("date", order.getDate().toString());
            orderMap.put("status", order.getStatus());
            orderMap.put("totalAmount", order.getTotalAmount());
            orderMap.put("shippingAddress", order.getShippingAddress());
            
            List<Map<String, Object>> items = new ArrayList<>();
            if (order.getOrderItems() != null) {
                for (OrderItem item : order.getOrderItems()) {
                    Map<String, Object> itemMap = new HashMap<>();
                    itemMap.put("title", item.getProduct().getTitle());
                    itemMap.put("imageUrl", item.getProduct().getImageUrl());
                    itemMap.put("quantity", item.getQuantity());
                    itemMap.put("price", item.getPrice());
                    items.add(itemMap);
                }
            }
            orderMap.put("items", items);
            response.add(orderMap);
        }
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{orderId}/status")
    public ResponseEntity<?> updateOrderStatus(@PathVariable Long orderId, @RequestBody Map<String, String> body) {
        String status = body.get("status");
        if (status == null) return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Status is required"));

        return orderRepository.findById(orderId).map(order -> {
            order.setStatus(status.toLowerCase());
            orderRepository.save(order);

            String title = "";
            String message = "";
            String type = "";

            if ("shipped".equalsIgnoreCase(status)) {
                title = "Order Shipped!";
                message = "Your order #" + order.getOrderId() + " has been shipped.";
                type = "ORDER_SHIPPED";
            } else if ("delivered".equalsIgnoreCase(status)) {
                title = "Order Delivered!";
                message = "Your order #" + order.getOrderId() + " has been delivered. Enjoy your purchase!";
                type = "ORDER_DELIVERED";
            }

            if (!title.isEmpty()) {
                notificationService.sendNotification(order.getCustomer(), title, message, type, "/orders");
            }

            return ResponseEntity.ok(Map.of("success", true));
        }).orElse(ResponseEntity.notFound().build());
    }
}
