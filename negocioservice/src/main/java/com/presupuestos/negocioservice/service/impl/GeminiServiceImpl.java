package com.presupuestos.negocioservice.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.presupuestos.negocioservice.dto.GeminiPresupuestoRequestDTO;
import com.presupuestos.negocioservice.dto.PresupuestoItemDTO;
import com.presupuestos.negocioservice.dto.PresupuestoRequestDTO;
import com.presupuestos.negocioservice.dto.PresupuestoResponseDTO;
import com.presupuestos.negocioservice.dto.ProductoResponseDTO;
import com.presupuestos.negocioservice.service.GeminiService;
import com.presupuestos.negocioservice.service.PresupuestoService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class GeminiServiceImpl implements GeminiService {

    private final PresupuestoService presupuestoService;

    @Value("${gemini.api.key}")
    private String apiKey;

    private static final String GEMINI_URL =
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

    public GeminiServiceImpl(PresupuestoService presupuestoService) {
        this.presupuestoService = presupuestoService;
    }

    /* =======================
       Helpers comunes
       ======================= */

    private static BigDecimal toBD(Object v) {
        if (v == null) return BigDecimal.ZERO;
        if (v instanceof BigDecimal bd) return bd;
        if (v instanceof Number n) return BigDecimal.valueOf(n.doubleValue());
        try {
            return new BigDecimal(v.toString());
        } catch (Exception e) {
            return BigDecimal.ZERO;
        }
    }

    private static String inferAction(String msg) {
        if (msg == null) return "CONSULTAR";
        String m = msg.toLowerCase();
        if (m.matches(".*(agrega|agreg|sum|añad).*")) return "AGREGAR";
        if (m.matches(".*(elimin|quit|sac).*")) return "ELIMINAR";
        if (m.matches(".*(modific|cambi|ajust|actualiz).*")) return "MODIFICAR";
        if (m.matches(".*(reemplaz|nuevo presupuesto).*")) return "REEMPLAZAR";
        if (m.matches(".*(crea|gener|arm|hacer).*")) return "CREAR";
        return "CONSULTAR";
    }

    private static ProductoResponseDTO findByName(List<ProductoResponseDTO> catalog, String name) {
        if (name == null) return null;
        for (var p : catalog) if (name.equals(p.getNombre())) return p;
        for (var p : catalog) if (name.equalsIgnoreCase(p.getNombre())) return p;
        return null;
    }

    /* =======================
       Llamado a Gemini con schema JSON
       ======================= */

    @Override
    public String obtenerRespuesta(String prompt) {
        RestTemplate restTemplate = new RestTemplate();

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("X-goog-api-key", apiKey);

        // JSON Schema para asegurar estructura
        Map<String, Object> schema = Map.of(
                "type", "object",
                "properties", Map.of(
                        "mensaje", Map.of("type", "string"),
                        "presupuesto", Map.of(
                                "type", "object",
                                "properties", Map.of(
                                        "items", Map.of(
                                                "type", "array",
                                                "minItems", 1,
                                                "items", Map.of(
                                                        "type", "object",
                                                        "properties", Map.of(
                                                                "producto", Map.of("type", "string"),
                                                                "cantidad", Map.of("type", "integer", "minimum", 1),
                                                                "precio_unitario", Map.of("type", "number", "minimum", 0),
                                                                "total", Map.of("type", "number", "minimum", 0)
                                                        ),
                                                        "required", List.of("producto", "cantidad", "precio_unitario", "total")
                                                )
                                        ),
                                        "total", Map.of("type", "number", "minimum", 0)
                                ),
                                "required", List.of("items", "total")
                        )
                ),
                "required", List.of("presupuesto")
        );

        Map<String, Object> payload = Map.of(
                "contents", List.of(
                        Map.of(
                                "role", "user",
                                "parts", List.of(Map.of("text", prompt))
                        )
                ),
                "generationConfig", Map.of(
                        "response_mime_type", "application/json",
                        "response_schema", schema
                )
        );

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(payload, headers);
        ResponseEntity<Map> response = restTemplate.postForEntity(GEMINI_URL, request, Map.class);

        if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
            try {
                Map<?, ?> candidates = ((List<Map<?, ?>>) response.getBody().get("candidates")).get(0);
                Map<?, ?> content = (Map<?, ?>) candidates.get("content");
                List<?> parts = (List<?>) content.get("parts");
                Map<?, ?> textPart = (Map<?, ?>) parts.get(0);
                return String.valueOf(textPart.get("text")); // JSON validado por schema
            } catch (Exception e) {
                return """
                        {"mensaje":"No pude leer la respuesta",
                         "presupuesto":{"items":[{"producto":"_","cantidad":1,"precio_unitario":0,"total":0}],
                         "total":0}}""";
            }
        }

        return """
                {"mensaje":"Sin respuesta de Gemini",
                 "presupuesto":{"items":[{"producto":"_","cantidad":1,"precio_unitario":0,"total":0}],
                 "total":0}}""";
    }

    /* =======================
       Orquestación pública
       ======================= */

    @Override
    public String generarPresupuestoConAI(GeminiPresupuestoRequestDTO dto) {
        Long clienteId = dto.getClienteId();
        PresupuestoRequestDTO presupuestoActual = dto.getPresupuestoActual();
        String comentarios = dto.getComentarios();
        String mensaje = dto.getMensaje();

        // (Opcional) historial, hoy no lo usamos en el prompt reforzado
        List<PresupuestoResponseDTO> historico =
                presupuestoService.findTop10ByClienteIdOrderByFechaCreacionDesc(clienteId);

        List<ProductoResponseDTO> productos = obtenerProductosDeServicio();

        String actionHint = inferAction(mensaje);
        String rawPrompt = construirPrompt(productos, presupuestoActual, comentarios, mensaje, actionHint);

        String aiJson = obtenerRespuesta(rawPrompt);

        // Guard-rails: fusionar duplicados, y si es AGREGAR unir BASE + NUEVOS
        return normalizeAndGuardrails(aiJson, productos, presupuestoActual, actionHint);
    }

    /* =======================
       Integración catálogo productos
       ======================= */

    private List<ProductoResponseDTO> obtenerProductosDeServicio() {
        try {
            ResponseEntity<ProductoResponseDTO[]> response = new RestTemplate()
                    .getForEntity("http://productoservice:8082/api/productos", ProductoResponseDTO[].class);
            ProductoResponseDTO[] body = response.getBody();
            return body == null ? Collections.emptyList() : Arrays.asList(body);
        } catch (Exception e) {
            return Collections.emptyList();
        }
    }

    /* =======================
       Prompt reforzado (con BASE JSON + ACTION_HINT)
       ======================= */

    private String construirPrompt(
            List<ProductoResponseDTO> productos,
            PresupuestoRequestDTO actual,
            String comentarios,
            String mensajeUsuario,
            String actionHint
    ) {
        // Construimos BASE como JSON por nombre (usando catálogo cuando hay)
        StringBuilder baseJson = new StringBuilder();
        Map<Long, ProductoResponseDTO> idToProdMap = productos.stream()
                .collect(Collectors.toMap(ProductoResponseDTO::getId, p -> p, (a, b) -> a));

        BigDecimal totalBase = BigDecimal.ZERO;
        baseJson.append("{\"items\":[");

        for (int i = 0; i < actual.getItems().size(); i++) {
            PresupuestoItemDTO it = actual.getItems().get(i);

            int cant = (it.getCantidad() == null ? 0 : it.getCantidad());
            BigDecimal cantBD = BigDecimal.valueOf(cant);

            ProductoResponseDTO prod = idToProdMap.get(it.getProductoId());
            String nombre = ((prod != null ? prod.getNombre() : ("#" + it.getProductoId())))
                    .replace("\"", "\\\"");

            BigDecimal puBD;
            if (prod != null && prod.getPrecioUnitario() != null) {
                puBD = toBD(prod.getPrecioUnitario());
            } else {
                BigDecimal totalItemFromDto = toBD(it.getTotalItem());
                puBD = (cant > 0)
                        ? totalItemFromDto.divide(cantBD, 2, RoundingMode.HALF_UP)
                        : BigDecimal.ZERO;
            }

            BigDecimal totalItemBD = puBD.multiply(cantBD);
            totalBase = totalBase.add(totalItemBD);

            baseJson.append("{")
                    .append("\"producto\":\"").append(nombre).append("\",")
                    .append("\"cantidad\":").append(cant).append(",")
                    .append("\"precio_unitario\":").append(puBD.stripTrailingZeros().toPlainString()).append(",")
                    .append("\"total\":").append(totalItemBD.stripTrailingZeros().toPlainString())
                    .append("}");

            if (i < actual.getItems().size() - 1) baseJson.append(",");
        }

        baseJson.append("],\"total\":")
                .append(totalBase.stripTrailingZeros().toPlainString())
                .append("}");

        // Prompt reforzado
        StringBuilder p = new StringBuilder();
        p.append("Eres un asistente experto en presupuestos de catering.\n")
                .append("Debes APLICAR la instrucción del usuario sobre el PRESUPUESTO BASE y devolver el PRESUPUESTO RESULTANTE COMPLETO en JSON.\n\n")
                .append("ACTION_HINT: ").append(actionHint).append("\n")
                .append("REGLAS:\n")
                .append("- Si ACTION_HINT=AGREGAR: el resultado = BASE + NUEVOS (no borres lo anterior).\n")
                .append("- Si ACTION_HINT=ELIMINAR: remueve de BASE lo pedido.\n")
                .append("- Si ACTION_HINT=MODIFICAR: parte de BASE y ajusta cantidades/precios.\n")
                .append("- NUNCA devuelvas solo los cambios; siempre la lista final completa.\n")
                .append("- Fusiona nombres idénticos sumando cantidades y recalcula cada 'total' (cantidad*precio_unitario) y 'total' global.\n")
                .append("- Usa únicamente los nombres EXACTOS del catálogo.\n")
                .append("- Salida: SOLO JSON con {\"presupuesto\":{\"items\":[...],\"total\":NUM},\"mensaje\":\"...\"}\n\n");

        p.append("=== CATÁLOGO ===\n");
        for (var prod : productos) {
            p.append("- ").append(prod.getNombre())
                    .append(" | $").append(prod.getPrecioUnitario())
                    .append(" | ").append(prod.getDescripcion() == null ? "" : prod.getDescripcion())
                    .append("\n");
        }

        p.append("\n=== PRESUPUESTO BASE (JSON) ===\n").append(baseJson).append("\n");
        p.append("\n=== INSTRUCCIÓN DEL USUARIO ===\n").append(mensajeUsuario).append("\n");
        p.append("Comentarios: ").append(comentarios == null ? "" : comentarios).append("\n");

        return p.toString();
    }

    /* =======================
       Guard-rails: merge + BASE+NUEVOS si AGREGAR
       ======================= */

    private String normalizeAndGuardrails(
            String aiJson,
            List<ProductoResponseDTO> catalog,
            PresupuestoRequestDTO base,
            String actionHint
    ) {
        try {
            ObjectMapper om = new ObjectMapper();
            ObjectNode root = (ObjectNode) om.readTree(aiJson);
            ObjectNode presupuesto = (ObjectNode) root.with("presupuesto");
            ArrayNode itemsNode = (ArrayNode) presupuesto.withArray("items");

            // 1) Acumular por nombre lo que vino de la IA
            Map<String, ObjectNode> acc = new LinkedHashMap<>();
            for (JsonNode n : itemsNode) {
                String nombre = n.path("producto").asText(null);
                if (nombre == null || nombre.isBlank()) continue;

                int cant = Math.max(0, n.path("cantidad").asInt(0));
                BigDecimal pu = toBD(n.get("precio_unitario"));
                if (pu.compareTo(BigDecimal.ZERO) <= 0) {
                    var cat = findByName(catalog, nombre);
                    if (cat != null && cat.getPrecioUnitario() != null) {
                        pu = toBD(cat.getPrecioUnitario());
                    }
                }
                if (cant == 0) continue;

                ObjectNode row = acc.get(nombre);
                if (row == null) {
                    row = om.createObjectNode();
                    row.put("producto", nombre);
                    row.put("cantidad", cant);
                    row.put("precio_unitario", pu.stripTrailingZeros().toPlainString());
                    acc.put(nombre, row);
                } else {
                    int prev = row.path("cantidad").asInt(0);
                    row.put("cantidad", prev + cant);
                    // mantenemos PU (catálogo o el primero válido que tengamos)
                }
            }

            // 2) Si es AGREGAR: unir BASE con lo devuelto por la IA (por nombre)
            if ("AGREGAR".equalsIgnoreCase(actionHint)) {
                Map<Long, ProductoResponseDTO> idToProd = catalog.stream()
                        .collect(Collectors.toMap(ProductoResponseDTO::getId, p -> p, (a, b) -> a));

                for (var it : base.getItems()) {
                    ProductoResponseDTO cat = idToProd.get(it.getProductoId());
                    String nombre = (cat != null ? cat.getNombre() : ("#" + it.getProductoId()));
                    int cant = it.getCantidad() == null ? 0 : it.getCantidad();
                    if (cant <= 0) continue;

                    BigDecimal pu = (cat != null && cat.getPrecioUnitario() != null)
                            ? toBD(cat.getPrecioUnitario())
                            : (it.getCantidad() != null && it.getCantidad() > 0
                            ? toBD(it.getTotalItem()).divide(BigDecimal.valueOf(it.getCantidad()), 2, RoundingMode.HALF_UP)
                            : BigDecimal.ZERO);

                    ObjectNode row = acc.get(nombre);
                    if (row == null) {
                        row = om.createObjectNode();
                        row.put("producto", nombre);
                        row.put("cantidad", cant);
                        row.put("precio_unitario", pu.stripTrailingZeros().toPlainString());
                        acc.put(nombre, row);
                    } else {
                        int prev = row.path("cantidad").asInt(0);
                        row.put("cantidad", prev + cant);
                    }
                }
            }

            // 3) Recalcular totales y total global
            ArrayNode rebuilt = om.createArrayNode();
            BigDecimal totalGlobal = BigDecimal.ZERO;

            for (var row : acc.values()) {
                String nombre = row.path("producto").asText();
                int cant = row.path("cantidad").asInt(0);
                BigDecimal pu = toBD(row.get("precio_unitario"));
                BigDecimal total = pu.multiply(BigDecimal.valueOf(cant));

                ObjectNode out = om.createObjectNode();
                out.put("producto", nombre);
                out.put("cantidad", cant);
                out.put("precio_unitario", pu.stripTrailingZeros().toPlainString());
                out.put("total", total.stripTrailingZeros().toPlainString());
                rebuilt.add(out);

                totalGlobal = totalGlobal.add(total);
            }

            presupuesto.set("items", rebuilt);
            presupuesto.put("total", totalGlobal.stripTrailingZeros().toPlainString());
            return om.writeValueAsString(root);

        } catch (Exception e) {
            // Si algo falla, devolvemos el JSON tal como vino
            return aiJson;
        }
    }
}
