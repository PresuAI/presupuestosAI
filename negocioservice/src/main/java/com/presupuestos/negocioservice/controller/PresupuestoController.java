package com.presupuestos.negocioservice.controller;

import com.presupuestos.negocioservice.dto.PresupuestoRequestDTO;
import com.presupuestos.negocioservice.dto.PresupuestoResponseDTO;
import com.presupuestos.negocioservice.service.PresupuestoService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/presupuestos")
public class PresupuestoController {

    private final PresupuestoService presupuestoService;

    public PresupuestoController(PresupuestoService presupuestoService) {
        this.presupuestoService = presupuestoService;
    }

    @GetMapping
    public ResponseEntity<List<PresupuestoResponseDTO>> obtenerTodos() {
        return ResponseEntity.ok(presupuestoService.obtenerTodos());
    }

    @PostMapping
    public ResponseEntity<PresupuestoResponseDTO> crear(@RequestBody PresupuestoRequestDTO dto) {
        return ResponseEntity.ok(presupuestoService.crearPresupuesto(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<PresupuestoResponseDTO> actualizar(@PathVariable Long id, @RequestBody PresupuestoRequestDTO dto) {
        return ResponseEntity.ok(presupuestoService.actualizarPresupuesto(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        presupuestoService.eliminarPresupuesto(id);
        return ResponseEntity.noContent().build();
    }
}
