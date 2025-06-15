package com.presupuestos.negocioservice.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "presupuestos")
public class Presupuesto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long clienteId;

    @OneToMany(mappedBy = "presupuesto", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PresupuestoItem> items = new ArrayList<>();

    private LocalDate fechaCreacion;

    private String estado;

    private String tipoEvento;

    private String comentarios;

    private BigDecimal gananciaEstimada;

    public Presupuesto() {}

    public Presupuesto(Long clienteId, LocalDate fechaCreacion, String estado,
                       String tipoEvento, String comentarios, BigDecimal gananciaEstimada) {
        this.clienteId = clienteId;
        this.fechaCreacion = fechaCreacion;
        this.estado = estado;
        this.tipoEvento = tipoEvento;
        this.comentarios = comentarios;
        this.gananciaEstimada = gananciaEstimada;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getClienteId() {
        return clienteId;
    }

    public void setClienteId(Long clienteId) {
        this.clienteId = clienteId;
    }

    public List<PresupuestoItem> getItems() {
        return items;
    }

    public void setItems(List<PresupuestoItem> items) {
        this.items = items;
    }

    public LocalDate getFechaCreacion() {
        return fechaCreacion;
    }

    public void setFechaCreacion(LocalDate fechaCreacion) {
        this.fechaCreacion = fechaCreacion;
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
}
