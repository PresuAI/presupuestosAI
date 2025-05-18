package com.presupuestos.usuarioservice.dto.request;

import com.presupuestos.usuarioservice.validation.ValidEnum;
import com.presupuestos.usuarioservice.model.Rol;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public class UsuarioRequestDto {
    @NotBlank
    private String nombre;

    @Email
    @NotBlank
    private String email;

    @ValidEnum(enumClass = Rol.class, message = "Rol debe ser ADMIN o USUARIO")
    private String rol;

    private boolean activo;

    // Getters y Setters

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getRol() {
        return rol;
    }

    public void setRol(String rol) {
        this.rol = rol;
    }

    public boolean isActivo() {
        return activo;
    }

    public void setActivo(boolean activo) {
        this.activo = activo;
    }
}