package com.example.demo.service;

import com.example.demo.model.Customer;
import com.example.demo.model.Order;
import com.example.demo.model.OrderItem;
import com.example.demo.model.Product;
import com.example.demo.repository.CustomerRepository;
import com.example.demo.repository.OrderItemRepository;
import com.example.demo.repository.OrderRepository;
import com.example.demo.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class CartService {

    public static final String STATUS_CART = "cart";

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private OrderItemRepository orderItemRepository;

    @Transactional(readOnly = true)
    public Map<String, Object> getCartPayload(String email) {
        Customer customer = customerRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Customer not found"));
        Optional<Order> cartOpt = orderRepository.findByCustomerAndStatusIgnoreCase(customer, STATUS_CART);
        if (cartOpt.isEmpty()) {
            return emptyCartResponse(null);
        }
        Order cart = cartOpt.get();
        return buildCartResponse(cart.getOrderId());
    }

    @Transactional
    public Map<String, Object> addItem(String email, Long productId, int quantity) {
        if (quantity < 1) {
            quantity = 1;
        }
        Customer customer = customerRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Customer not found"));
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new IllegalArgumentException("Product not found"));
        if (product.isAuctionItem()) {
            throw new IllegalArgumentException("Auction items cannot be added to the cart");
        }
        if (product.getStockQuantity() < 1) {
            throw new IllegalArgumentException("Product is out of stock");
        }

        Order cart = orderRepository.findByCustomerAndStatusIgnoreCase(customer, STATUS_CART)
                .orElseGet(() -> createCartOrder(customer));

        Optional<OrderItem> existing = orderItemRepository.findByOrderAndProduct_Id(cart, productId);
        if (existing.isPresent()) {
            OrderItem line = existing.get();
            int newQty = line.getQuantity() + quantity;
            if (newQty > product.getStockQuantity()) {
                newQty = product.getStockQuantity();
            }
            line.setQuantity(newQty);
            line.setPrice(product.getPrice());
            orderItemRepository.save(line);
        } else {
            int qty = Math.min(quantity, product.getStockQuantity());
            OrderItem line = new OrderItem();
            line.setOrder(cart);
            line.setProduct(product);
            line.setQuantity(qty);
            line.setPrice(product.getPrice());
            orderItemRepository.save(line);
        }

        refreshOrderTotal(cart.getOrderId());
        return buildCartResponse(cart.getOrderId());
    }

    @Transactional
    public Map<String, Object> updateLineQuantity(String email, Long orderItemId, int quantity) {
        if (quantity < 1) {
            throw new IllegalArgumentException("Quantity must be at least 1");
        }
        Customer customer = customerRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Customer not found"));
        OrderItem line = orderItemRepository.findByOrderItemId(orderItemId)
                .orElseThrow(() -> new IllegalArgumentException("Cart line not found"));
        Order cart = line.getOrder();
        if (!STATUS_CART.equalsIgnoreCase(cart.getStatus())) {
            throw new IllegalArgumentException("Not a cart order");
        }
        if (cart.getCustomer() == null || !cart.getCustomer().getUserId().equals(customer.getUserId())) {
            throw new IllegalArgumentException("Forbidden");
        }
        Product product = productRepository.findById(line.getProduct().getId())
                .orElseThrow(() -> new IllegalArgumentException("Product not found"));
        int capped = Math.min(quantity, product.getStockQuantity());
        line.setQuantity(capped);
        line.setPrice(product.getPrice());
        orderItemRepository.save(line);
        refreshOrderTotal(cart.getOrderId());
        return buildCartResponse(cart.getOrderId());
    }

    @Transactional
    public Map<String, Object> removeLine(String email, Long orderItemId) {
        Customer customer = customerRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Customer not found"));
        OrderItem line = orderItemRepository.findByOrderItemId(orderItemId)
                .orElseThrow(() -> new IllegalArgumentException("Cart line not found"));
        Order cart = line.getOrder();
        if (!STATUS_CART.equalsIgnoreCase(cart.getStatus())) {
            throw new IllegalArgumentException("Not a cart order");
        }
        if (cart.getCustomer() == null || !cart.getCustomer().getUserId().equals(customer.getUserId())) {
            throw new IllegalArgumentException("Forbidden");
        }
        Long orderId = cart.getOrderId();
        orderItemRepository.delete(line);
        List<OrderItem> remaining = orderItemRepository.findByOrderIdWithProduct(orderId);
        if (remaining.isEmpty()) {
            orderRepository.deleteById(orderId);
            return emptyCartResponse(null);
        }
        refreshOrderTotal(orderId);
        return buildCartResponse(orderId);
    }

    private Order createCartOrder(Customer customer) {
        Order o = new Order();
        o.setCustomer(customer);
        o.setStatus(STATUS_CART);
        o.setDate(LocalDate.now());
        o.setTotalAmount(0);
        o.setShippingAddress("");
        return orderRepository.save(o);
    }

    private void refreshOrderTotal(Long orderId) {
        Order order = orderRepository.findById(orderId).orElseThrow();
        List<OrderItem> lines = orderItemRepository.findByOrderIdWithProduct(orderId);
        double sum = lines.stream().mapToDouble(li -> li.getPrice() * li.getQuantity()).sum();
        order.setTotalAmount(sum);
        orderRepository.save(order);
    }

    private Map<String, Object> emptyCartResponse(Long orderId) {
        Map<String, Object> m = new HashMap<>();
        m.put("success", true);
        m.put("orderId", orderId);
        m.put("itemCount", 0);
        m.put("subtotal", 0.0);
        m.put("items", List.of());
        return m;
    }

    private Map<String, Object> buildCartResponse(Long orderId) {
        List<OrderItem> lines = orderItemRepository.findByOrderIdWithProduct(orderId);
        if (lines.isEmpty()) {
            orderRepository.deleteById(orderId);
            return emptyCartResponse(null);
        }
        int itemCount = lines.stream().mapToInt(OrderItem::getQuantity).sum();
        double subtotal = lines.stream().mapToDouble(li -> li.getPrice() * li.getQuantity()).sum();
        List<Map<String, Object>> items = new ArrayList<>();
        for (OrderItem li : lines) {
            Product p = li.getProduct();
            Map<String, Object> row = new HashMap<>();
            row.put("orderItemId", li.getOrderItemId());
            row.put("productId", p.getId());
            row.put("title", p.getTitle());
            row.put("imageUrl", p.getImageUrl());
            row.put("unitPrice", li.getPrice());
            row.put("quantity", li.getQuantity());
            row.put("subtotal", li.getPrice() * li.getQuantity());
            row.put("maxQuantity", p.getStockQuantity());
            items.add(row);
        }
        Map<String, Object> m = new HashMap<>();
        m.put("success", true);
        m.put("orderId", orderId);
        m.put("itemCount", itemCount);
        m.put("subtotal", subtotal);
        m.put("items", items);
        return m;
    }
}
