package com.presupuestos.negocioservice.controller;

import com.presupuestos.negocioservice.service.GeminiService;
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
}