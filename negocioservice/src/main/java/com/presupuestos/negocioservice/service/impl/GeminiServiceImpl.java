package com.presupuestos.negocioservice.service.impl;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.presupuestos.negocioservice.dto.*;
import com.presupuestos.negocioservice.service.GeminiService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import com.presupuestos.negocioservice.service.PresupuestoService;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Map;

@Service
public class GeminiServiceImpl implements GeminiService {

    private final PresupuestoService presupuestoService;

    @Value("${gemini.api.key}")
    private String apiKey;

    private final String URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

    public GeminiServiceImpl(PresupuestoService presupuestoService) {
        this.presupuestoService = presupuestoService;
    }

    @Override
    public String obtenerRespuesta(String mensaje) {
        RestTemplate restTemplate = new RestTemplate();

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("X-goog-api-key", apiKey);

        ObjectMapper mapper = new ObjectMapper();
        String requestJson;

        try {
            Map<String, Object> requestMap = Map.of(
                    "contents", List.of(
                            Map.of("parts", List.of(
                                    Map.of("text", mensaje)
                            ))
                    )
            );
            requestJson = mapper.writeValueAsString(requestMap);
        } catch (JsonProcessingException e) {
            return "Error al construir el prompt para Gemini: " + e.getMessage();
        }


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

    @Override
    public String generarPresupuestoConAI(GeminiPresupuestoRequestDTO dto) {
        Long clienteId = dto.getClienteId();
        PresupuestoRequestDTO presupuestoActual = dto.getPresupuestoActual();
        String comentarios = dto.getComentarios();
        String mensaje = dto.getMensaje();

        List<PresupuestoResponseDTO> historico = presupuestoService.findTop10ByClienteIdOrderByFechaCreacionDesc(clienteId);
        List<ProductoResponseDTO> productos = obtenerProductosDeServicio();

        String rawPrompt = construirPrompt(historico, productos, presupuestoActual, comentarios, mensaje);

        try {
            return obtenerRespuesta(rawPrompt);
        } catch (Exception e) {
            return "Error al construir el prompt para Gemini: " + e.getMessage();
        }
    }

    private List<ProductoResponseDTO> obtenerProductosDeServicio() {
        try {
            ResponseEntity<ProductoResponseDTO[]> response = new RestTemplate()
                    .getForEntity("http://productoservice:8082/api/productos", ProductoResponseDTO[].class);

            return Arrays.asList(response.getBody());
        } catch (Exception e) {
            return Collections.emptyList();
        }
    }

    private String construirPrompt(List<PresupuestoResponseDTO> historico,
                                   List<ProductoResponseDTO> productos,
                                   PresupuestoRequestDTO actual,
                                   String comentarios,
                                   String mensajeUsuario) {

        StringBuilder prompt = new StringBuilder();

        prompt.append("Te voy a pasar el historial de presupuestos de un cliente, la lista de productos disponibles, ")
                .append("el estado actual del presupuesto y un mensaje o comentario. Quiero que me devuelvas un JSON con dos claves: ")
                .append("\"presupuesto\" (con cambios a aplicar) y \"mensaje\" (respuesta textual para el usuario). Formato obligatorio JSON.\n\n");

        prompt.append("=== COMENTARIOS ===\n").append(comentarios).append("\n\n");

        prompt.append("=== MENSAJE ===\n").append(mensajeUsuario).append("\n\n");

        prompt.append("=== PRODUCTOS DISPONIBLES ===\n");
        for (ProductoResponseDTO prod : productos) {
            prompt.append("- ").append(prod.getNombre()).append(": ")
                    .append(prod.getDescripcion()).append(" | $").append(prod.getPrecioUnitario()).append("\n");
        }

        prompt.append("\n=== HISTORIAL DE PRESUPUESTOS ===\n");
        for (PresupuestoResponseDTO pre : historico) {
            prompt.append("- Evento: ").append(pre.getTipoEvento()).append(" | Comentarios: ")
                    .append(pre.getComentarios()).append(" | Ganancia: $").append(pre.getGananciaEstimada()).append("\n");

            for (PresupuestoItemDTO item : pre.getItems()) {
                prompt.append("  · Producto ID ").append(item.getProductoId())
                        .append(", cantidad ").append(item.getCantidad()).append(", total $").append(item.getTotalItem()).append("\n");
            }
            prompt.append("\n");
        }

        prompt.append("=== PRESUPUESTO ACTUAL ===\n");
        for (PresupuestoItemDTO item : actual.getItems()) {
            prompt.append("· Producto ID ").append(item.getProductoId())
                    .append(", cantidad ").append(item.getCantidad()).append(", total $").append(item.getTotalItem()).append("\n");
        }

        return prompt.toString();
    }


}