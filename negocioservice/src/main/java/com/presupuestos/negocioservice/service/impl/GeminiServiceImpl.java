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

        prompt.append("Eres un asistente experto en presupuestos de catering.\n")
                .append("⚠️ DEVUELVE SIEMPRE SOLO UN JSON válido, sin explicaciones fuera del JSON.\n")
                .append("El JSON debe tener exactamente estas claves:\n\n")
                .append("{\n")
                .append("  \"operacion\": \"CREAR | AGREGAR | MODIFICAR | ELIMINAR | REEMPLAZAR | CONSULTAR\",\n")
                .append("  \"presupuesto\": {\n")
                .append("    \"items\": [\n")
                .append("      { \"producto\": \"NOMBRE\", \"cantidad\": X, \"precio_unitario\": Y, \"total\": Z }\n")
                .append("    ],\n")
                .append("    \"total\": NUM\n")
                .append("  },\n")
                .append("  \"mensaje\": \"Texto breve para el usuario\"\n")
                .append("}\n\n")
                .append("⚠️ REGLAS OBLIGATORIAS:\n")
                .append("- Necesitas prestar atencion a los productos. Hay productos que no tienen sentido en desayuno o almuerzo. Por favor presta suma atencion y se variado, no elijas siempre las mismas cosas.\n")
                .append("- Ten en cuenta el historial quee te pasare de presupuestos, para no estar repitiendo productos, asi logramos variaciones buenas.\n")
                .append("- Usa solo las claves 'operacion', 'presupuesto', 'items', 'total', 'mensaje'.\n")
                .append("- Nunca inventes otras claves como 'Evento', 'Comentarios', 'productos', 'total_presupuesto'.\n")
                .append("- 'items' nunca puede estar vacío. Si es una consulta, copia los items actuales.\n")
                .append("- Si devuelves 'CONSULTAR', igual debes incluir los items actuales (aunque sean los mismos), pero NO inventes nuevos.\n")
                .append("- Si el mensaje del usuario pide explícitamente 'crear', 'generar', 'armar' o similar, NUNCA devuelvas 'CONSULTAR'. Debes devolver 'CREAR'.\n")
                .append("- Si devuelves items diferentes de los actuales, la operación NO puede ser 'CONSULTAR'. Usa 'CREAR', 'AGREGAR', 'MODIFICAR' o 'REEMPLAZAR'.\n")
                .append("- Usa los nombres EXACTOS de los productos listados abajo.\n\n")

                .append("=== PALABRAS CLAVE ===\n")
                .append("* agregar, sumar, añadir → operacion=AGREGAR\n")
                .append("* modificar, cambiar, ajustar → operacion=MODIFICAR\n")
                .append("* eliminar, quitar, sacar → operacion=ELIMINAR\n")
                .append("* crear, armar, hacer un presupuesto → operacion=CREAR\n")
                .append("* reemplazar, nuevo presupuesto → operacion=REEMPLAZAR\n")
                .append("* consultar, cuánto, mostrar → operacion=CONSULTAR (pero items debe incluirse)\n\n")

                .append("=== EJEMPLO CORRECTO ===\n")
                .append("{\n")
                .append("  \"operacion\": \"AGREGAR\",\n")
                .append("  \"presupuesto\": {\n")
                .append("    \"items\": [\n")
                .append("      { \"producto\": \"Croissant de manteca\", \"cantidad\": 10, \"precio_unitario\": 75, \"total\": 750 },\n")
                .append("      { \"producto\": \"Chipa de queso\", \"cantidad\": 5, \"precio_unitario\": 60, \"total\": 300 }\n")
                .append("    ],\n")
                .append("    \"total\": 1050\n")
                .append("  },\n")
                .append("  \"mensaje\": \"Agregué croissants y chipas a tu presupuesto.\"\n")
                .append("}\n\n")

                .append("=== DATOS DEL USUARIO ===\n")
                .append("Mensaje: ").append(mensajeUsuario).append("\n")
                .append("Comentarios: ").append(comentarios).append("\n\n")

                .append("=== PRODUCTOS DISPONIBLES ===\n");
        for (ProductoResponseDTO prod : productos) {
            prompt.append("- ").append(prod.getNombre())
                    .append(": ").append(prod.getDescripcion())
                    .append(" | $").append(prod.getPrecioUnitario()).append("\n");
        }

        prompt.append("\n=== HISTORIAL DE PRESUPUESTOS ===\n");
        if (historico.isEmpty()) {
            prompt.append("No hay presupuestos anteriores.\n");
        } else {
            for (PresupuestoResponseDTO pre : historico) {
                prompt.append("- Evento: ").append(pre.getTipoEvento())
                        .append(" | Comentarios: ").append(pre.getComentarios())
                        .append(" | Ganancia: $").append(pre.getGananciaEstimada()).append("\n");

                for (PresupuestoItemDTO item : pre.getItems()) {
                    prompt.append("  · Producto ID ").append(item.getProductoId())
                            .append(", cantidad ").append(item.getCantidad())
                            .append(", total $").append(item.getTotalItem()).append("\n");
                }
            }
        }

        prompt.append("\n=== PRESUPUESTO ACTUAL ===\n");
        if (actual.getItems().isEmpty()) {
            prompt.append("Sin productos cargados.\n");
        } else {
            for (PresupuestoItemDTO item : actual.getItems()) {
                prompt.append("· Producto ID ").append(item.getProductoId())
                        .append(", cantidad ").append(item.getCantidad())
                        .append(", total $").append(item.getTotalItem()).append("\n");
            }
        }

        return prompt.toString();
    }

}