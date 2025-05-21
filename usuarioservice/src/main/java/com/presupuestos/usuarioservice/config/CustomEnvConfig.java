package com.presupuestos.usuarioservice.config;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class CustomEnvConfig {

    @Bean
    public Dotenv dotenv() {
        return Dotenv.configure()
                .filename(".env")
                .ignoreIfMissing()
                .load();
    }
}
