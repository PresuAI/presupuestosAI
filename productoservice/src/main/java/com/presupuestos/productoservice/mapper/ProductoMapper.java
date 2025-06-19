package com.presupuestos.productoservice.mapper;

import com.presupuestos.productoservice.dto.ProductoRequestDTO;
import com.presupuestos.productoservice.dto.ProductoResponseDTO;
import com.presupuestos.productoservice.model.Producto;

public class ProductoMapper {

    public static Producto toEntity(ProductoRequestDTO dto) {
        return new Producto(
                dto.getNombre(),
                dto.getDescripcion(),
                dto.getIngredientes(),
                dto.isEsVegano(),
                dto.isEsVegetariano(),
                dto.getPrecioUnitario(),
                dto.getCostoUnitario()
        );
    }

    public static ProductoResponseDTO toResponse(Producto producto) {
        ProductoResponseDTO dto = new ProductoResponseDTO();
        dto.setId(producto.getId());
        dto.setNombre(producto.getNombre());
        dto.setDescripcion(producto.getDescripcion());
        dto.setIngredientes(producto.getIngredientes());
        dto.setEsVegano(producto.isEsVegano());
        dto.setEsVegetariano(producto.isEsVegetariano());
        dto.setPrecioUnitario(producto.getPrecioUnitario());
        return dto;
    }
}
