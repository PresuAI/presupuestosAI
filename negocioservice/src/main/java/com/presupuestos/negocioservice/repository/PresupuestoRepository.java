package com.presupuestos.negocioservice.repository;

import com.presupuestos.negocioservice.model.Presupuesto;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PresupuestoRepository extends JpaRepository<Presupuesto, Long> {
}
