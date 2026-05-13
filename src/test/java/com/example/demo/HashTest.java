package com.example.demo;

import org.junit.jupiter.api.Test;
import org.mindrot.jbcrypt.BCrypt;

public class HashTest {
    @Test
    public void testHash() {
        System.out.println("ADMIN_HASH=" + BCrypt.hashpw("admin123", BCrypt.gensalt()));
        System.out.println("PASSWORD_HASH=" + BCrypt.hashpw("password123", BCrypt.gensalt()));
        System.out.println("CUSTOMER_HASH=" + BCrypt.hashpw("customer123", BCrypt.gensalt()));
    }
}
