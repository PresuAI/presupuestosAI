package com.presupuestos.negocioservice.service.impl;

import com.presupuestos.negocioservice.service.GeminiService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Service
public class GeminiServiceImpl implements GeminiService {

    @Value("${gemini.api.key}")
    private String apiKey;

    private final String URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

    @Override
    public String obtenerRespuesta(String mensaje) {
        RestTemplate restTemplate = new RestTemplate();

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("X-goog-api-key", apiKey);

        String requestJson = """
        {
            "contents": [
                {
                    "parts": [
                        {
                            "text": "%s"
                        }
                    ]
                }
            ]
        }
        """.formatted(mensaje);

        HttpEntity<String> request = new HttpEntity<>(requestJson, headers);

        ResponseEntity<Map> response = restTemplate.postForEntity(URL, request, Map.class);

        if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
            try {
                var candidates = ((Map) ((java.util.List<?>) response.getBody().get("candidates")).get(0));
                var content = (Map<?, ?>) candidates.get("content");
                var parts = (java.util.List<?>) content.get("parts");
                var textPart = (Map<?, ?>) parts.get(0);
                return textPart.get("text").toString();
            } catch (Exception e) {
                return "Error al procesar la respuesta de Gemini.";
            }
        }

        return "No se pudo obtener respuesta de Gemini.";
    }
}