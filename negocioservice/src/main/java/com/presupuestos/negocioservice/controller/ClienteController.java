package com.presupuestos.negocioservice.controller;

import com.presupuestos.negocioservice.dto.ClienteRequestDTO;
import com.presupuestos.negocioservice.dto.ClienteResponseDTO;
import com.presupuestos.negocioservice.service.ClienteService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.NoSuchElementException;

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

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminarCliente(@PathVariable Long id) {
        try {
            clienteService.eliminarCliente(id);
            return ResponseEntity.noContent().build(); // 204
        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build(); // 404
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> actualizarCliente(@PathVariable Long id, @RequestBody @Valid ClienteRequestDTO dto) {
        try {
            ClienteResponseDTO actualizado = clienteService.actualizarCliente(id, dto);
            return ResponseEntity.ok(actualizado); // 200
        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build(); // 404
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage()); // 400
        }
    }
}