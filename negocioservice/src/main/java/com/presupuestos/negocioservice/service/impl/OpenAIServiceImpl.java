// OpenAIServiceImpl.java
package com.presupuestos.negocioservice.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.presupuestos.negocioservice.dto.GeminiPresupuestoRequestDTO;
import com.presupuestos.negocioservice.dto.PresupuestoItemDTO;
import com.presupuestos.negocioservice.dto.ProductoResponseDTO; // <- Asegurate de tener este DTO
import com.presupuestos.negocioservice.service.OpenAIService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Service
public class OpenAIServiceImpl implements OpenAIService {

    @Value("${openai.api.key}")
    private String apiKey;

    @Value("${openai.assistant.id}")
    private String assistantId;

    private String productoServiceBaseUrl = "http://productoservice:8082/";

    private final String BASE_URL = "https://api.openai.com/v1";

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    // ================= /mensaje =================
    @Override
    public String enviarPrompt(String prompt, String maybeThreadId) {
        try {
            String threadId = ensureThread(maybeThreadId);

            String formatoChat = "Por favor, respondé exclusivamente en formato JSON, con una única clave llamada 'mensaje'.";
            agregarMensaje(threadId, prompt + "\n" + formatoChat);

            String runId = ejecutarRun(threadId);
            esperarFinalizacionRun(threadId, runId);

            String data = obtenerRespuesta(threadId); // JSON del assistant

            // devolvemos SIEMPRE el threadId usado para que el front lo persista
            return "{\"threadId\":\"" + threadId + "\",\"data\":" + safeJson(data) + "}";
        } catch (Exception e) {
            return "{\"error\":\"" + escape(e.getMessage()) + "\"}";
        }
    }

    // ================= /presupuesto =================
    @Override
    public String generarPresupuestoConAI(GeminiPresupuestoRequestDTO dto) {
        try {
            String threadId = ensureThread(dto.getThreadId());

            List<ProductoResponseDTO> productos = obtenerProductosDeServicio();
            String prompt = construirPromptDesdeDTO(dto, productos);

            String instruccionFormato = "La respuesta debe estar en formato JSON con dos campos: 'presupuesto' y 'mensaje'.";
            agregarMensaje(threadId, prompt + "\n" + instruccionFormato);

            String runId = ejecutarRun(threadId);
            esperarFinalizacionRun(threadId, runId);

            String data = obtenerRespuesta(threadId);

            return "{\"threadId\":\"" + threadId + "\",\"data\":" + safeJson(data) + "}";
        } catch (Exception e) {
            return "{\"error\":\"" + escape(e.getMessage()) + "\"}";
        }
    }

    // ================= Helpers =================
    private String ensureThread(String maybeThreadId) {
        if (maybeThreadId != null && !maybeThreadId.isBlank()) return maybeThreadId;
        return crearThread();
    }

    private static String safeJson(String s) {
        // si el modelo devolvió JSON, lo dejamos tal cual; si devolvió texto no-JSON, lo envolvemos como string
        // chequeo simple:
        String t = s.trim();
        if ((t.startsWith("{") && t.endsWith("}")) || (t.startsWith("[") && t.endsWith("]"))) return t;
        return "\"" + escape(s) + "\"";
    }

    private static String escape(String s) {
        return s.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", "\\n");
    }

    // ========= OpenAI Assistants (threads/runs) =========
    private String crearThread() {
        HttpHeaders headers = buildHeaders();
        HttpEntity<String> request = new HttpEntity<>("{}", headers);
        ResponseEntity<Map> response = restTemplate.postForEntity(BASE_URL + "/threads", request, Map.class);
        return response.getBody().get("id").toString();
    }

    private void agregarMensaje(String threadId, String prompt) throws Exception {
        HttpHeaders headers = buildHeaders();

        Map<String, Object> body = Map.of(
                "role", "user",
                "content", prompt
        );
        String json = objectMapper.writeValueAsString(body);

        HttpEntity<String> request = new HttpEntity<>(json, headers);
        restTemplate.postForEntity(BASE_URL + "/threads/" + threadId + "/messages", request, Map.class);
    }

    private String ejecutarRun(String threadId) throws Exception {
        HttpHeaders headers = buildHeaders();
        Map<String, Object> body = Map.of(
                "assistant_id", assistantId
        );
        String json = objectMapper.writeValueAsString(body);

        HttpEntity<String> request = new HttpEntity<>(json, headers);
        ResponseEntity<Map> response = restTemplate.postForEntity(BASE_URL + "/threads/" + threadId + "/runs", request, Map.class);
        return response.getBody().get("id").toString();
    }

    private void esperarFinalizacionRun(String threadId, String runId) throws InterruptedException {
        HttpHeaders headers = buildHeaders();

        while (true) {
            HttpEntity<Void> request = new HttpEntity<>(headers);
            ResponseEntity<Map> response = restTemplate.exchange(
                    BASE_URL + "/threads/" + threadId + "/runs/" + runId,
                    HttpMethod.GET,
                    request,
                    Map.class
            );
            String status = response.getBody().get("status").toString();

            if (status.equals("completed")) {
                break;
            } else if (status.equals("failed") || status.equals("cancelled") || status.equals("expired")) {
                throw new RuntimeException("Run falló con estado: " + status);
            }

            Thread.sleep(800); // un poco más rápido que 1000ms; seguro para rate limit
        }
    }

    private String obtenerRespuesta(String threadId) {
        HttpHeaders headers = buildHeaders();
        HttpEntity<Void> request = new HttpEntity<>(headers);

        ResponseEntity<Map> response = restTemplate.exchange(
                BASE_URL + "/threads/" + threadId + "/messages",
                HttpMethod.GET,
                request,
                Map.class
        );
        List<Map<String, Object>> messages = (List<Map<String, Object>>) response.getBody().get("data");

        for (Map<String, Object> message : messages) {
            if ("assistant".equals(message.get("role"))) {
                // El formato de content suele ser una lista de bloques (text, para JSON viene en text.value)
                List<Map<String, Object>> content = (List<Map<String, Object>>) message.get("content");

                // Ejemplo de extracción robusta para Assistants v2:
                // - content.get(0) -> {"type":"output_text","text":{"value":"{...json...}","annotations":[]}}
                Map<String, Object> block0 = content.get(0);
                Object textObj = block0.get("text");
                if (textObj instanceof Map<?, ?> mapText && mapText.get("value") != null) {
                    return mapText.get("value").toString(); // debe ser el JSON que pediste
                }

                // Fallback (por si alguna variante devuelve .get("text").toString())
                return content.get(0).toString();
            }
        }

        return "No se encontró respuesta del assistant.";
    }

    private HttpHeaders buildHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(apiKey);
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.add("OpenAI-Beta", "assistants=v2"); // requerido
        return headers;
    }

    // ========= Llamada al microservicio de productos =========
    private List<ProductoResponseDTO> obtenerProductosDeServicio() {
        try {
            String url = productoServiceBaseUrl.endsWith("/")
                    ? productoServiceBaseUrl + "api/productos"
                    : productoServiceBaseUrl + "/api/productos";

            ResponseEntity<ProductoResponseDTO[]> response =
                    restTemplate.getForEntity(url, ProductoResponseDTO[].class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return Arrays.asList(response.getBody());
            }
            return Collections.emptyList();
        } catch (Exception e) {
            // Podés loguear el error
            return Collections.emptyList();
        }
    }

    // ========= Prompt con Productos disponibles =========
    private String construirPromptDesdeDTO(GeminiPresupuestoRequestDTO dto, List<ProductoResponseDTO> productos) {
        StringBuilder prompt = new StringBuilder();

        // Info del evento / usuario
        prompt.append("Eres un asistente experto en presupuestos de catering para confitería.\n")
                .append("⚠️ DEVUELVE SIEMPRE SOLO UN JSON válido.\n")
                .append("El JSON debe tener exactamente dos claves de nivel raíz: 'presupuesto' y 'mensaje'.\n\n")

                .append("=== INSTRUCCIONES DE NEGOCIO ===\n")
                .append("- Usa los nombres EXACTOS de los productos listados abajo.\n")
                .append("- Variá opciones según tipo de evento. No repitas siempre los mismos.\n")
                .append("- 'presupuesto.items' nunca puede estar vacío.\n")
                .append("- Total = suma de (cantidad * precio_unitario) de todos los ítems.\n\n")

                .append("=== DATOS DEL PEDIDO ===\n")
                .append("Tipo de evento: ").append(dto.getPresupuestoActual().getTipoEvento()).append("\n")
                .append("Comentarios del cliente: ").append(dto.getComentarios()).append("\n")
                .append("Mensaje del usuario: ").append(dto.getMensaje()).append("\n\n");

        // Productos disponibles del microservicio
        prompt.append("=== PRODUCTOS DISPONIBLES (nombre | descripcion | precio_unitario) ===\n");
        if (productos.isEmpty()) {
            prompt.append("No hay productos disponibles. Si no hay productos, responde con un presupuesto vacío pero con items=[] y total=0, y un mensaje explicando que no hay catálogo disponible.\n");
        } else {
            for (ProductoResponseDTO p : productos) {
                prompt.append("- ").append(p.getNombre())
                        .append(" | ").append(nullToEmpty(p.getDescripcion()))
                        .append(" | ").append(p.getPrecioUnitario()).append("\n");
            }
        }

        // Presupuesto actual (si viene con items, que los respete o los mejore)
        prompt.append("\n=== PRESUPUESTO ACTUAL ===\n");
        List<PresupuestoItemDTO> items = dto.getPresupuestoActual().getItems();
        if (items == null || items.isEmpty()) {
            prompt.append("Sin productos cargados.\n");
        } else {
            for (PresupuestoItemDTO item : items) {
                prompt.append("· Producto ID ").append(item.getProductoId())
                        .append(", cantidad ").append(item.getCantidad())
                        .append(", precio_unitario ").append(item.getPrecioUnitario())
                        .append(", total ").append(item.getTotalItem()).append("\n");
            }
        }

        prompt.append("\n=== FORMATO DE SALIDA REQUERIDO ===\n")
                .append("{\n")
                .append("  \"presupuesto\": {\n")
                .append("    \"items\": [\n")
                .append("      { \"producto\": \"NOMBRE\", \"cantidad\": X, \"precio_unitario\": Y, \"total\": Z }\n")
                .append("    ],\n")
                .append("    \"total\": NUM\n")
                .append("  },\n")
                .append("  \"mensaje\": \"Texto breve para el usuario\"\n")
                .append("}\n");

        return prompt.toString();
    }

    private static String nullToEmpty(String s) {
        return (s == null) ? "" : s;
    }
}
