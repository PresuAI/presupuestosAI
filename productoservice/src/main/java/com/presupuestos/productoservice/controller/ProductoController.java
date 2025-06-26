package com.presupuestos.productoservice.controller;

import com.presupuestos.productoservice.dto.ProductoRequestDTO;
import com.presupuestos.productoservice.dto.ProductoResponseDTO;
import com.presupuestos.productoservice.service.ProductoService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/productos")
public class ProductoController {

    private final ProductoService productoService;

    public ProductoController(ProductoService productoService) {
        this.productoService = productoService;
    }

    @GetMapping
    public ResponseEntity<List<ProductoResponseDTO>> obtenerTodos() {
        return ResponseEntity.ok(productoService.obtenerTodos());
    }

    @PostMapping
    public ResponseEntity<ProductoResponseDTO> crearProducto(@RequestBody @Valid ProductoRequestDTO requestDTO) {
        return ResponseEntity.ok(productoService.crearProducto(requestDTO));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProductoResponseDTO> actualizarProducto(@PathVariable Long id, @RequestBody @Valid ProductoRequestDTO requestDTO) {
        return ResponseEntity.ok(productoService.actualizarProducto(id, requestDTO));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminarProducto(@PathVariable Long id) {
        productoService.eliminarProducto(id);
        return ResponseEntity.noContent().build();
    }

}
