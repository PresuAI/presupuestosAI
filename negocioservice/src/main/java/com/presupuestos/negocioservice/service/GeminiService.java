package com.presupuestos.negocioservice.service;

import com.presupuestos.negocioservice.dto.GeminiPresupuestoRequestDTO;

public interface GeminiService {
    String obtenerRespuesta(String mensaje);

    String generarPresupuestoConAI(GeminiPresupuestoRequestDTO dto);
}
