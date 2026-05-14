package com.example.demo.controller;

import com.example.demo.model.Product;
import com.example.demo.service.ProductService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    @Autowired
    private ProductService productService;

    // GET /api/products
    @GetMapping
    public ResponseEntity<List<Product>> getAllProducts() {
        return ResponseEntity.ok(productService.getAllStandardProducts());
    }

    // FIX: /category/{name} must be declared BEFORE /{id}
    // otherwise Spring tries to parse "category" as a Long and crashes
    // GET /api/products/category/Ceramics
    @GetMapping("/category/{name}")
    public ResponseEntity<List<Product>> getByCategory(@PathVariable String name) {
        return ResponseEntity.ok(productService.getProductsByCategory(name));
    }

    // GET /api/products/5
    @GetMapping("/{id}")
    public ResponseEntity<?> getProduct(@PathVariable Long id) {
        return productService.getProductById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // POST /api/products
    @PostMapping
    public ResponseEntity<Product> createProduct(@RequestBody Product product) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(productService.saveProduct(product));
    }

    // PUT /api/products/5
    @PutMapping("/{id}")
    public ResponseEntity<?> updateProduct(@PathVariable Long id,
                                           @RequestBody Product product) {
        if (productService.getProductById(id).isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "Product not found."));
        }
        product.setId(id);
        return ResponseEntity.ok(productService.saveProduct(product));
    }

    // DELETE /api/products/5
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteProduct(@PathVariable Long id) {
        if (productService.getProductById(id).isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "Product not found."));
        }
        productService.deleteProduct(id);
        return ResponseEntity.ok(Map.of("message", "Product deleted."));
    }
}