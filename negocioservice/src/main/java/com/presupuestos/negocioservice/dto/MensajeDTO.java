package com.presupuestos.negocioservice.dto;

public class MensajeDTO {
    private String mensaje;
    private String threadId;

    public MensajeDTO() {}

    public MensajeDTO(String mensaje, String threadId) {
        this.mensaje = mensaje;
        this.threadId = threadId;
    }

    public String getMensaje() {
        return mensaje;
    }

    public void setMensaje(String mensaje) {
        this.mensaje = mensaje;
    }

    public String getThreadId() {
        return threadId;
    }

    public void setThreadId(String threadId) {
        this.threadId = threadId;
    }
}