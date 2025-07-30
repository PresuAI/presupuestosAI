package com.presupuestos.negocioservice.dto;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
public class PresupuestoItemDTO {

    private Long productoId;
    private Integer cantidad;
    private BigDecimal precioUnitario;
    private BigDecimal totalItem;

    public PresupuestoItemDTO(Long productoId, Integer cantidad, BigDecimal precioUnitario, BigDecimal totalItem) {
        this.productoId = productoId;
        this.cantidad = cantidad;
        this.precioUnitario = precioUnitario;
        this.totalItem = totalItem;
    }

    public Long getProductoId() {
        return productoId;
    }

    public void setProductoId(Long productoId) {
        this.productoId = productoId;
    }

    public Integer getCantidad() {
        return cantidad;
    }

    public void setCantidad(Integer cantidad) {
        this.cantidad = cantidad;
    }

    public BigDecimal getPrecioUnitario() {
        return precioUnitario;
    }

    public void setPrecioUnitario(BigDecimal precioUnitario) {
        this.precioUnitario = precioUnitario;
    }

    public BigDecimal getTotalItem() {
        return totalItem;
    }

    public void setTotalItem(BigDecimal totalItem) {
        this.totalItem = totalItem;
    }
}
