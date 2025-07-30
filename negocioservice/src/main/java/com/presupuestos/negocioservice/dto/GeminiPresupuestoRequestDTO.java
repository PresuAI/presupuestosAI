package com.presupuestos.negocioservice.dto;

public class GeminiPresupuestoRequestDTO {
    private Long clienteId;
    private PresupuestoRequestDTO presupuestoActual;
    private String comentarios;
    private String mensaje;

    public Long getClienteId() {
        return clienteId;
    }

    public void setClienteId(Long clienteId) {
        this.clienteId = clienteId;
    }

    public PresupuestoRequestDTO getPresupuestoActual() {
        return presupuestoActual;
    }

    public void setPresupuestoActual(PresupuestoRequestDTO presupuestoActual) {
        this.presupuestoActual = presupuestoActual;
    }

    public String getComentarios() {
        return comentarios;
    }

    public void setComentarios(String comentarios) {
        this.comentarios = comentarios;
    }

    public String getMensaje() {
        return mensaje;
    }

    public void setMensaje(String mensaje) {
        this.mensaje = mensaje;
    }
}