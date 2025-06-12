package com.presupuestos.negocioservice.config;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

@Configuration
@Profile("!test")
public class CustomEnvConfig {

    @Bean
    public Dotenv dotenv() {
        return Dotenv.configure()
                .filename(".env")
                .ignoreIfMissing()
                .load();
    }
}