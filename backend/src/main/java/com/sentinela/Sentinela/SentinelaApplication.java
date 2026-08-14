package com.sentinela.Sentinela;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class SentinelaApplication {
	public static void main(String[] args) {
		SpringApplication.run(SentinelaApplication.class, args);
	}
}