package com.presupuestos.negocioservice.controller;

import com.presupuestos.negocioservice.dto.ClienteRequestDTO;
import com.presupuestos.negocioservice.dto.ClienteResponseDTO;
import com.presupuestos.negocioservice.service.ClienteService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/clientes")
public class ClienteController {

    private final ClienteService clienteService;

    public ClienteController(ClienteService clienteService) {
        this.clienteService = clienteService;
    }

    @PostMapping
    public ResponseEntity<ClienteResponseDTO> registrarCliente(@RequestBody @Valid ClienteRequestDTO dto) {
        ClienteResponseDTO response = clienteService.registrarCliente(dto);
        return ResponseEntity.status(201).body(response);
    }

    @GetMapping
    public List<ClienteResponseDTO> obtenerClientes() {
        return clienteService.obtenerTodos();
    }
}