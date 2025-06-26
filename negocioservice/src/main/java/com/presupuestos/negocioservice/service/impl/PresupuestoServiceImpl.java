package com.presupuestos.negocioservice.service.impl;

import com.presupuestos.negocioservice.dto.PresupuestoRequestDTO;
import com.presupuestos.negocioservice.dto.PresupuestoResponseDTO;
import com.presupuestos.negocioservice.mapper.PresupuestoMapper;
import com.presupuestos.negocioservice.model.Presupuesto;
import com.presupuestos.negocioservice.model.PresupuestoItem;
import com.presupuestos.negocioservice.repository.PresupuestoItemRepository;
import com.presupuestos.negocioservice.repository.PresupuestoRepository;
import com.presupuestos.negocioservice.service.PresupuestoService;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class PresupuestoServiceImpl implements PresupuestoService {

    private final PresupuestoRepository presupuestoRepository;
    private final PresupuestoItemRepository presupuestoItemRepository;

    public PresupuestoServiceImpl(PresupuestoRepository presupuestoRepository, PresupuestoItemRepository presupuestoItemRepository) {
        this.presupuestoRepository = presupuestoRepository;
        this.presupuestoItemRepository = presupuestoItemRepository;
    }

    @Override
    public List<PresupuestoResponseDTO> obtenerTodos() {
        return presupuestoRepository.findAll()
                .stream()
                .map(PresupuestoMapper::toDTO)
                .toList();
    }

    @Override
    public PresupuestoResponseDTO crearPresupuesto(PresupuestoRequestDTO dto) {
        Presupuesto presupuesto = PresupuestoMapper.toEntity(dto);
        presupuesto.setFechaCreacion();
        presupuesto = presupuestoRepository.save(presupuesto);

        for (PresupuestoItem item : presupuesto.getItems()) {
            item.setPresupuesto(presupuesto);
        }
        presupuestoItemRepository.saveAll(presupuesto.getItems());

        return PresupuestoMapper.toDTO(presupuesto);
    }

    @Override
    public PresupuestoResponseDTO actualizarPresupuesto(Long id, PresupuestoRequestDTO dto) {
        Presupuesto existente = presupuestoRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Presupuesto no encontrado"));

        existente.setClienteId(dto.getClienteId());
        existente.setEstado(dto.getEstado());
        existente.setTipoEvento(dto.getTipoEvento());
        existente.setComentarios(dto.getComentarios());
        existente.setGananciaEstimada(dto.getGananciaEstimada());

        existente.getItems().clear();

        List<PresupuestoItem> nuevosItems = dto.getItems().stream()
                .map(PresupuestoMapper::toItemEntity)
                .toList();

        nuevosItems.forEach(item -> {
            item.setPresupuesto(existente);
            existente.getItems().add(item);
        });

        Presupuesto actualizado = presupuestoRepository.save(existente);

        return PresupuestoMapper.toDTO(actualizado);
    }

    @Override
    public void eliminarPresupuesto(Long id) {
        if (!presupuestoRepository.existsById(id)) {
            throw new EntityNotFoundException("Presupuesto no encontrado");
        }
        presupuestoRepository.deleteById(id);
    }

    @Override
    public List<PresupuestoResponseDTO> obtenerPorClienteId(Long clienteId) {
        List<Presupuesto> presupuestos = presupuestoRepository.findByClienteId(clienteId);
        return presupuestos.stream()
                .map(PresupuestoMapper::toDTO)
                .toList();
    }
}
