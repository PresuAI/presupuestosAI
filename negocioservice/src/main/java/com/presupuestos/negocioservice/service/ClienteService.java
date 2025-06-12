package com.presupuestos.negocioservice.service;

import com.presupuestos.negocioservice.dto.ClienteRequestDTO;
import com.presupuestos.negocioservice.dto.ClienteResponseDTO;

public interface ClienteService {
    ClienteResponseDTO registrarCliente(ClienteRequestDTO dto);
}