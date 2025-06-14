package com.presupuestos.negocioservice.service;

import com.presupuestos.negocioservice.dto.ClienteRequestDTO;
import com.presupuestos.negocioservice.dto.ClienteResponseDTO;

import java.util.List;

public interface ClienteService {
    ClienteResponseDTO registrarCliente(ClienteRequestDTO dto);
    List<ClienteResponseDTO> obtenerTodos();
}