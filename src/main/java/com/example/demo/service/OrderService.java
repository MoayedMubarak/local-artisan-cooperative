package com.example.demo.service;

import com.example.demo.model.*;
import com.example.demo.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class OrderService {

    @Autowired private OrderRepository orderRepository;
    @Autowired private OrderItemRepository orderItemRepository;
    @Autowired private ProductRepository productRepository;
    @Autowired private PaymentRepository paymentRepository;

    public List<Order> getOrdersByCustomer(Long customerId) {
        return orderRepository.findByCustomer_UserId(customerId);
    }

    public Optional<Order> getOrderById(Long orderId) {
        return orderRepository.findById(orderId);
    }

    // @Transactional: if stock update or payment save fails,
    // the entire order is rolled back automatically
    @Transactional
    public Order placeOrder(Customer customer, Map<Long, Integer> productQuantities,
                            String shippingAddress, String paymentMethod) {

        Order order = new Order();
        order.setCustomer(customer);
        order.setDate(LocalDate.now());
        order.setStatus("PENDING");
        order.setShippingAddress(shippingAddress);
        Order savedOrder = orderRepository.save(order);

        double total = 0;

        for (Map.Entry<Long, Integer> entry : productQuantities.entrySet()) {
            Product product = productRepository.findById(entry.getKey())
                    .orElseThrow(() -> new IllegalArgumentException("Product not found: " + entry.getKey()));

            if (product.getStockQuantity() < entry.getValue()) {
                throw new IllegalStateException("Insufficient stock for: " + product.getTitle());
            }

            product.setStockQuantity(product.getStockQuantity() - entry.getValue());
            productRepository.save(product);

            OrderItem item = new OrderItem();
            item.setOrder(savedOrder);
            item.setProduct(product);
            item.setQuantity(entry.getValue());
            item.setPrice(product.getPrice() * entry.getValue());
            orderItemRepository.save(item);

            total += item.getPrice();
        }

        savedOrder.setTotalAmount(total);
        orderRepository.save(savedOrder);

        Payment payment = new Payment();
        payment.setOrder(savedOrder);
        payment.setAmount(total);
        payment.setDate(LocalDate.now());
        payment.setPaymentMethod(paymentMethod);
        payment.setStatus("COMPLETED");
        payment.setTransactionDetails("TXN-" + System.currentTimeMillis());
        paymentRepository.save(payment);

        return savedOrder;
    }

    public String cancelOrder(Long orderId) {
        Optional<Order> opt = orderRepository.findById(orderId);
        if (opt.isEmpty()) return "Order not found.";
        Order order = opt.get();
        if (!order.getStatus().equals("PENDING")) {
            return "Only pending orders can be cancelled.";
        }
        order.setStatus("CANCELLED");
        orderRepository.save(order);
        return "Order cancelled successfully.";
    }
}