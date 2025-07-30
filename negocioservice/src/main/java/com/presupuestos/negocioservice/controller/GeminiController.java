package com.presupuestos.negocioservice.controller;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.presupuestos.negocioservice.dto.GeminiPresupuestoRequestDTO;
import com.presupuestos.negocioservice.service.GeminiService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/gemini")
public class GeminiController {

    private final GeminiService geminiService;

    public GeminiController(GeminiService geminiService) {
        this.geminiService = geminiService;
    }

    @PostMapping("/mensaje")
    public String enviarMensaje(@RequestBody String mensaje) {
        return geminiService.obtenerRespuesta(mensaje);
    }

    @PostMapping("/presupuesto")
    public ResponseEntity<String> generarPresupuestoConAI(@RequestBody GeminiPresupuestoRequestDTO dto) throws JsonProcessingException {
        System.out.println("LLEGO AL CONTROLLER:");
        System.out.println(new ObjectMapper().writeValueAsString(dto));
        String respuesta = geminiService.generarPresupuestoConAI(dto);
        return ResponseEntity.ok(respuesta);
    }
}