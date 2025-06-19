package com.presupuestos.negocioservice.repository;

import com.presupuestos.negocioservice.model.PresupuestoItem;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PresupuestoItemRepository extends JpaRepository<PresupuestoItem, Long> {
}
