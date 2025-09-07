package com.presupuestos.negocioservice.service;

import com.presupuestos.negocioservice.dto.GeminiPresupuestoRequestDTO;

public interface OpenAIService {
    String enviarPrompt(String mensaje, String threadId);

    String generarPresupuestoConAI(GeminiPresupuestoRequestDTO dto);
}
