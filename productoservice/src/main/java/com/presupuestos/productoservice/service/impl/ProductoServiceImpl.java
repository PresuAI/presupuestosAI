package com.presupuestos.productoservice.service.impl;

import com.presupuestos.productoservice.dto.ProductoRequestDTO;
import com.presupuestos.productoservice.dto.ProductoResponseDTO;
import com.presupuestos.productoservice.exception.ResourceNotFoundException;
import com.presupuestos.productoservice.mapper.ProductoMapper;
import com.presupuestos.productoservice.model.Producto;
import com.presupuestos.productoservice.repository.ProductoRepository;
import com.presupuestos.productoservice.service.ProductoService;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class ProductoServiceImpl implements ProductoService {

    private final ProductoRepository productoRepository;

    public ProductoServiceImpl(ProductoRepository productoRepository) {
        this.productoRepository = productoRepository;
    }

    @Override
    public List<ProductoResponseDTO> obtenerTodos() {
        return productoRepository.findAll().stream()
                .map(ProductoMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public ProductoResponseDTO crearProducto(ProductoRequestDTO requestDTO) {
        Producto producto = ProductoMapper.toEntity(requestDTO);
        return ProductoMapper.toResponse(productoRepository.save(producto));
    }

    @Override
    public ProductoResponseDTO actualizarProducto(Long id, ProductoRequestDTO requestDTO) {
        Producto producto = productoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Producto con id " + id + " no encontrado"));

        producto.setNombre(requestDTO.getNombre());
        producto.setDescripcion(requestDTO.getDescripcion());
        producto.setIngredientes(requestDTO.getIngredientes());
        producto.setEsVegano(requestDTO.isEsVegano());
        producto.setEsVegetariano(requestDTO.isEsVegetariano());
        producto.setPrecioUnitario(requestDTO.getPrecioUnitario());
        producto.setCostoUnitario(requestDTO.getCostoUnitario());

        return ProductoMapper.toResponse(productoRepository.save(producto));
    }

    @Override
    public void eliminarProducto(Long id) {
        if (!productoRepository.existsById(id)) {
            throw new ResourceNotFoundException("Producto con id " + id + " no encontrado");
        }
        productoRepository.deleteById(id);
    }
}
