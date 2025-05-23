package com.presupuestos.usuarioservice.config;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@TestConfiguration
public class DotenvTestConfig {

    @Bean
    public Dotenv dotenv() {
        Dotenv mockDotenv = mock(Dotenv.class);
        when(mockDotenv.get("JWT_SECRET")).thenReturn("clave_super_segura_de_prueba");
        when(mockDotenv.get("GOOGLE_CLIENT_ID")).thenReturn("test-client-id");
        when(mockDotenv.get("GOOGLE_CLIENT_SECRET")).thenReturn("test-client-secret");
        when(mockDotenv.get("GOOGLE_REDIRECT_URI")).thenReturn("http://localhost/test");
        return mockDotenv;
    }
}