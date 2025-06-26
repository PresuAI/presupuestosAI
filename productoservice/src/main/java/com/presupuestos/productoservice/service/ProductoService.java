package com.presupuestos.productoservice.service;

import com.presupuestos.productoservice.dto.ProductoRequestDTO;
import com.presupuestos.productoservice.dto.ProductoResponseDTO;

import java.util.List;

public interface ProductoService {
    List<ProductoResponseDTO> obtenerTodos();
    ProductoResponseDTO crearProducto(ProductoRequestDTO requestDTO);
    ProductoResponseDTO actualizarProducto(Long id, ProductoRequestDTO requestDTO);
    void eliminarProducto(Long id);
    void publicarEventoCreacion(ProductoResponseDTO producto);
    void publicarEventoActualizacion(ProductoResponseDTO producto);
    void publicarEventoEliminacion(Long productoId);
}
