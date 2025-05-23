package com.presupuestos.usuarioservice.config;

import io.github.cdimascio.dotenv.Dotenv;
import org.mockito.Mockito;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;

import static org.mockito.Mockito.when;

@TestConfiguration
public class DotenvTestConfig {

    @Bean
    public Dotenv dotenv() {
        Dotenv mockDotenv = Mockito.mock(Dotenv.class);
        when(mockDotenv.get("JWT_SECRET")).thenReturn("clave_super_segura_de_prueba");
        when(mockDotenv.get("WHITELIST_EMAILS")).thenReturn("test@gmail.com");
        return mockDotenv;
    }
}