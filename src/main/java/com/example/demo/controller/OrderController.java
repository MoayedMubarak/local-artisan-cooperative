package com.example.demo.controller;

import com.example.demo.model.Customer;
import com.example.demo.model.Order;
import com.example.demo.repository.UserRepository;
import com.example.demo.service.OrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    @Autowired private OrderService orderService;
    @Autowired private UserRepository userRepository;

    // GET /api/orders?customerId=5
    @GetMapping
    public ResponseEntity<?> getOrders(@RequestParam Long customerId) {
        return ResponseEntity.ok(orderService.getOrdersByCustomer(customerId));
    }

    // GET /api/orders/1
    @GetMapping("/{id}")
    public ResponseEntity<?> getOrder(@PathVariable Long id) {
        return orderService.getOrderById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // POST /api/orders
    // Body: { "customerId":3, "shippingAddress":"...", "paymentMethod":"...", "items":{"1":2,"4":1} }
    @PostMapping
    public ResponseEntity<?> placeOrder(@RequestBody Map<String, Object> payload) {
        try {
            Long   customerId      = Long.valueOf(payload.get("customerId").toString());
            String shippingAddress = payload.get("shippingAddress").toString();
            String paymentMethod   = payload.get("paymentMethod").toString();

            Customer customer = resolveCustomer(customerId);
            if (customer == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("message", "Customer not found or user is not a customer."));
            }

            @SuppressWarnings("unchecked")
            Map<String, Integer> rawItems = (Map<String, Integer>) payload.get("items");
            Map<Long, Integer> items = new HashMap<>();
            rawItems.forEach((k, v) -> items.put(Long.parseLong(k), v));

            Order order = orderService.placeOrder(customer, items, shippingAddress, paymentMethod);
            return ResponseEntity.status(HttpStatus.CREATED).body(order);

        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // DELETE /api/orders/1/cancel
    @DeleteMapping("/{id}/cancel")
    public ResponseEntity<?> cancelOrder(@PathVariable Long id) {
        String result = orderService.cancelOrder(id);
        if (result.contains("not found")) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", result));
        }
        return ResponseEntity.ok(Map.of("message", result));
    }

    private Customer resolveCustomer(Long customerId) {
        return userRepository.findById(customerId)
                .filter(u -> u instanceof Customer)
                .map(u -> (Customer) u)
                .orElse(null);
    }
}