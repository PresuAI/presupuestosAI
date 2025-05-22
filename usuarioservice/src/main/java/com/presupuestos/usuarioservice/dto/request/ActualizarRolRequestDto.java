package com.presupuestos.usuarioservice.dto.request;

import jakarta.validation.constraints.NotBlank;

public class ActualizarRolRequestDto {

    @NotBlank(message = "El rol no puede estar vacío")
    private String nuevoRol;

    public String getNuevoRol() {
        return nuevoRol;
    }

    public void setNuevoRol(String nuevoRol) {
        this.nuevoRol = nuevoRol;
    }
}