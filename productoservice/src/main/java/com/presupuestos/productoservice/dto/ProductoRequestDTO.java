package com.presupuestos.productoservice.dto;
import jakarta.validation.constraints.*;

public class ProductoRequestDTO {

    @NotBlank(message = "El nombre no puede estar vacío")
    private String nombre;
    private String descripcion;
    @NotBlank(message = "Los ingredientes no pueden estar vacíos")
    private String ingredientes;
    private boolean esVegano;
    private boolean esVegetariano;
    @NotNull(message = "El precio unitario es obligatorio")
    @DecimalMin(value = "0.01", message = "El precio debe ser mayor a 0")
    private Double precioUnitario;
    private Double costoUnitario;

    public ProductoRequestDTO() {}

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public String getDescripcion() {
        return descripcion;
    }

    public void setDescripcion(String descripcion) {
        this.descripcion = descripcion;
    }

    public String getIngredientes() {
        return ingredientes;
    }

    public void setIngredientes(String ingredientes) {
        this.ingredientes = ingredientes;
    }

    public boolean isEsVegano() {
        return esVegano;
    }

    public void setEsVegano(boolean esVegano) {
        this.esVegano = esVegano;
    }

    public boolean isEsVegetariano() {
        return esVegetariano;
    }

    public void setEsVegetariano(boolean esVegetariano) {
        this.esVegetariano = esVegetariano;
    }

    public Double getPrecioUnitario() {
        return precioUnitario;
    }

    public void setPrecioUnitario(Double precioUnitario) {
        this.precioUnitario = precioUnitario;
    }

    public Double getCostoUnitario() {
        return costoUnitario;
    }

    public void setCostoUnitario(Double costoUnitario) {
        this.costoUnitario = costoUnitario;
    }
}
