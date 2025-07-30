package com.presupuestos.negocioservice.service;

import com.presupuestos.negocioservice.dto.PresupuestoRequestDTO;
import com.presupuestos.negocioservice.dto.PresupuestoResponseDTO;
import com.presupuestos.negocioservice.model.Presupuesto;

import java.util.List;

public interface PresupuestoService {
    List<PresupuestoResponseDTO> obtenerTodos();
    PresupuestoResponseDTO crearPresupuesto(PresupuestoRequestDTO dto);
    PresupuestoResponseDTO actualizarPresupuesto(Long id, PresupuestoRequestDTO dto);
    void eliminarPresupuesto(Long id);
    List<PresupuestoResponseDTO> obtenerPorClienteId(Long clienteId);
    List<PresupuestoResponseDTO> findTop10ByClienteIdOrderByFechaCreacionDesc(Long clienteId);

}
