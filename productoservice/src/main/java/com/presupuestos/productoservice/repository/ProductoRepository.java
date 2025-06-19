package com.presupuestos.productoservice.repository;

import com.presupuestos.productoservice.model.Producto;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductoRepository extends JpaRepository<Producto, Long> {
}
