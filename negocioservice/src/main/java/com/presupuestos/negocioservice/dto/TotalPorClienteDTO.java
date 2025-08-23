package com.presupuestos.negocioservice.dto;

import java.math.BigDecimal;

public class TotalPorClienteDTO {
    private Long clienteId;
    private String nombreCliente;
    private BigDecimal total;

    public TotalPorClienteDTO(Long clienteId, String nombreCliente, BigDecimal total) {
        this.clienteId = clienteId;
        this.nombreCliente = nombreCliente;
        this.total = total;
    }

    public Long getClienteId() {
        return clienteId;
    }

    public void setClienteId(Long clienteId) {
        this.clienteId = clienteId;
    }

    public String getNombreCliente() {
        return nombreCliente;
    }

    public void setNombreCliente(String nombreCliente) {
        this.nombreCliente = nombreCliente;
    }

    public BigDecimal getTotal() {
        return total;
    }

    public void setTotal(BigDecimal total) {
        this.total = total;
    }

}
