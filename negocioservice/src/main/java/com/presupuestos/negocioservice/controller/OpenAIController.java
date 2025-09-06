package com.presupuestos.negocioservice.controller;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.presupuestos.negocioservice.dto.GeminiPresupuestoRequestDTO;
import com.presupuestos.negocioservice.dto.MensajeDTO;
import com.presupuestos.negocioservice.service.OpenAIService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/openAI")
public class OpenAIController {

    private final OpenAIService openAIService;

    public OpenAIController(OpenAIService openAIService) {
        this.openAIService = openAIService;
    }

    @PostMapping("/mensaje")
    public ResponseEntity<String> enviarMensaje(@RequestBody MensajeDTO body) {
        String json = openAIService.enviarPrompt(body.getMensaje(), body.getThreadId());
        return ResponseEntity.ok(json);
    }

    @PostMapping("/presupuesto")
    public ResponseEntity<String> generarPresupuestoConAI(@RequestBody GeminiPresupuestoRequestDTO dto) throws JsonProcessingException {
        String json = openAIService.generarPresupuestoConAI(dto);
        return ResponseEntity.ok(json);
    }
}