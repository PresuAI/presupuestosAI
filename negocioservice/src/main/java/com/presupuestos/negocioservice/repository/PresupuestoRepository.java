package com.presupuestos.negocioservice.repository;

import com.presupuestos.negocioservice.model.Presupuesto;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface PresupuestoRepository extends JpaRepository<Presupuesto, Long> {
    List<Presupuesto> findByClienteId(Long clienteId);

    List<Presupuesto> findTop10ByClienteIdOrderByFechaCreacionDesc(Long clienteId);

    List<Presupuesto> findByEstadoAndFechaCreacionAfter(String estado, LocalDateTime fecha);

}
