package com.example.demo;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.jdbc.core.JdbcTemplate;

@SpringBootApplication
public class DemoApplication {

	public static void main(String[] args) {
		SpringApplication.run(DemoApplication.class, args);
	}

	@Bean
	public CommandLineRunner databaseSchemaUpdater(JdbcTemplate jdbcTemplate) {
		return args -> {
			try {
				jdbcTemplate.execute("ALTER TABLE products ALTER COLUMN image_url TYPE TEXT");
				System.out.println("Schema Migration: successfully altered products.image_url to TEXT");
			} catch (Exception ex) {
				System.err.println("Schema Migration: could not alter products.image_url column: " + ex.getMessage());
			}
			try {
				jdbcTemplate.execute("ALTER TABLE users ALTER COLUMN profile_picture TYPE TEXT");
				System.out.println("Schema Migration: successfully altered users.profile_picture to TEXT");
			} catch (Exception ex) {
				System.err.println("Schema Migration: could not alter users.profile_picture column: " + ex.getMessage());
			}
			try {
				jdbcTemplate.execute("ALTER TABLE artisans ALTER COLUMN shop_banner TYPE TEXT");
				System.out.println("Schema Migration: successfully altered artisans.shop_banner to TEXT");
			} catch (Exception ex) {
				System.err.println("Schema Migration: could not alter artisans.shop_banner column: " + ex.getMessage());
			}
		};
	}
}
