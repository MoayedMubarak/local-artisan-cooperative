package com.example.demo;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class DemoApplication {

	public static void main(String[] args) {
		java.util.Locale.setDefault(java.util.Locale.ENGLISH);
		SpringApplication.run(DemoApplication.class, args);
	}

}
