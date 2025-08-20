package com.presupuestos.negocioservice.dto;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@NoArgsConstructor
public class PresupuestoRequestDTO {

    private Long clienteId;
    private String estado;
    private String tipoEvento;
    private String comentarios;
    private BigDecimal gananciaEstimada;

    private List<PresupuestoItemDTO> items;

    public Long getClienteId() {
        return clienteId;
    }

    public void setClienteId(Long clienteId) {
        this.clienteId = clienteId;
    }

    public String getEstado() {
        return estado;
    }

    public void setEstado(String estado) {
        this.estado = estado;
    }

    public String getTipoEvento() {
        return tipoEvento;
    }

    public void setTipoEvento(String tipoEvento) {
        this.tipoEvento = tipoEvento;
    }

    public String getComentarios() {
        return comentarios;
    }

    public void setComentarios(String comentarios) {
        this.comentarios = comentarios;
    }

    public BigDecimal getGananciaEstimada() {
        return gananciaEstimada;
    }

    public void setGananciaEstimada(BigDecimal gananciaEstimada) {
        this.gananciaEstimada = gananciaEstimada;
    }

    public List<PresupuestoItemDTO> getItems() {
        return items;
    }

    public void setItems(List<PresupuestoItemDTO> items) {
        this.items = items;
    }
}
