package com.presupuestos.productoservice.service.impl;

import com.presupuestos.productoservice.dto.ProductoRequestDTO;
import com.presupuestos.productoservice.dto.ProductoResponseDTO;
import com.presupuestos.productoservice.exception.ResourceNotFoundException;
import com.presupuestos.productoservice.mapper.ProductoMapper;
import com.presupuestos.productoservice.model.Producto;
import com.presupuestos.productoservice.repository.ProductoRepository;
import com.presupuestos.productoservice.service.ProductoService;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class ProductoServiceImpl implements ProductoService {

    private final ProductoRepository productoRepository;
    private final RabbitTemplate rabbitTemplate;
    @Value("${productos.exchange}")
    private String exchange;

    @Value("${productos.routing.creado}")
    private String routingKeyCreado;

    @Value("${productos.routing.actualizado}")
    private String routingKeyActualizado;

    @Value("${productos.routing.eliminado}")
    private String routingKeyEliminado;

    public ProductoServiceImpl(ProductoRepository productoRepository,
                               RabbitTemplate rabbitTemplate) {
        this.productoRepository = productoRepository;
        this.rabbitTemplate = rabbitTemplate;
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

        Producto saved = productoRepository.save(producto);

        ProductoResponseDTO response = ProductoMapper.toResponse(saved);

        publicarEventoCreacion(response);

        return response;
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

        Producto updated = productoRepository.save(producto);
        ProductoResponseDTO response = ProductoMapper.toResponse(updated);

        publicarEventoActualizacion(response);

        return response;
    }

    @Override
    public void eliminarProducto(Long id) {
        if (!productoRepository.existsById(id)) {
            throw new ResourceNotFoundException("Producto con id " + id + " no encontrado");
        }
        productoRepository.deleteById(id);
        publicarEventoEliminacion(id);
    }

    @Override
    public void publicarEventoCreacion(ProductoResponseDTO producto) {
        rabbitTemplate.convertAndSend(exchange, routingKeyCreado, producto);
        System.out.printf("▶ Enviado evento CREACION a %s/%s: %s%n",
                exchange, routingKeyCreado, producto);
    }

    @Override
    public void publicarEventoActualizacion(ProductoResponseDTO producto) {
        rabbitTemplate.convertAndSend(exchange, routingKeyActualizado, producto);
        System.out.printf("▶ Enviado evento ACTUALIZACION a %s/%s: %s%n",
                exchange, routingKeyActualizado, producto);
    }

    @Override
    public void publicarEventoEliminacion(Long productoId) {
        rabbitTemplate.convertAndSend(
                exchange,
                routingKeyEliminado,
                Collections.singletonMap("id", productoId)
        );
        System.out.printf("▶ Enviado evento ELIMINACION a %s/%s: %s%n",
                exchange, routingKeyEliminado, productoId);
    }

}
