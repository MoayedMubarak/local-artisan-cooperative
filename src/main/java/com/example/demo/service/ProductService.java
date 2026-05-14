package com.example.demo.service;

import com.example.demo.model.Product;
import com.example.demo.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
public class ProductService {

    @Autowired
    private ProductRepository productRepository;

    public List<Product> getAllStandardProducts() {
        return productRepository.findByIsAuctionItem(false);
    }

    public List<Product> getAllAuctionProducts() {
        return productRepository.findByIsAuctionItem(true);
    }

    public List<Product> getAllProducts() {
        return productRepository.findAll();
    }

    public Optional<Product> getProductById(Long id) {
        return productRepository.findById(id);
    }

    public List<Product> getProductsByCategory(String category) {
        return productRepository.findByProductCategory_NameIgnoreCase(category);
    }

    // Automatically sets addingDate when creating a new product
    public Product saveProduct(Product product) {
        if (product.getId() == null) {
            product.setAddingDate(LocalDate.now());
        }
        return productRepository.save(product);
    }

    public void deleteProduct(Long id) {
        productRepository.deleteById(id);
    }
}