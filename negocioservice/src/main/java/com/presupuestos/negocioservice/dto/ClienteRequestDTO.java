// src/main/java/com/presupuestos/negocioservice/dto/ClienteRequestDTO.java
package com.presupuestos.negocioservice.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public class ClienteRequestDTO {

    @NotBlank(message = "El nombre es obligatorio.")
    private String nombre;

    // Solo dígitos, entre 8 y 12 (sin puntos ni guiones)
    @NotBlank(message = "El RUT es obligatorio.")
    @Pattern(regexp = "^\\d{8,12}$", message = "El RUT debe tener de 8 a 12 dígitos (sin puntos ni guiones).")
    private String rut;

    // Email “estándar” (más estricto que solo incluir @)
    @NotBlank(message = "El email es obligatorio.")
    @Email(message = "El email no tiene un formato válido.")
    private String email;

    // Opcional: vacío o con formato telefónico (+, (), espacios y -) con 7-20 caracteres
    @Pattern(regexp = "^$|^[+\\d()\\s-]{7,20}$", message = "El teléfono solo admite dígitos, espacios, +, () y - (7 a 20 caracteres).")
    private String telefono;

    // getters / setters…
    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }
    public String getRut() { return rut; }
    public void setRut(String rut) { this.rut = rut; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getTelefono() { return telefono; }
    public void setTelefono(String telefono) { this.telefono = telefono; }
}
