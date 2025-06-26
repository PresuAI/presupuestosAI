package com.presupuestos.negocioservice.repository;

import com.presupuestos.negocioservice.model.Cliente;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ClienteRepository extends JpaRepository<Cliente, Long> {
    boolean existsByEmail(String email);
    boolean existsByRut(String rut);
}