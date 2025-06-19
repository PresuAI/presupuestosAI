package com.presupuestos.negocioservice.mapper;

import com.presupuestos.negocioservice.dto.PresupuestoItemDTO;
import com.presupuestos.negocioservice.dto.PresupuestoRequestDTO;
import com.presupuestos.negocioservice.dto.PresupuestoResponseDTO;
import com.presupuestos.negocioservice.model.Presupuesto;
import com.presupuestos.negocioservice.model.PresupuestoItem;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
public class PresupuestoMapper {

    public static Presupuesto toEntity(PresupuestoRequestDTO dto) {
        Presupuesto presupuesto = new Presupuesto();
        presupuesto.setClienteId(dto.getClienteId());
        presupuesto.setEstado(dto.getEstado());
        presupuesto.setTipoEvento(dto.getTipoEvento());
        presupuesto.setComentarios(dto.getComentarios());
        presupuesto.setGananciaEstimada(dto.getGananciaEstimada());

        if (dto.getItems() != null) {
            List<PresupuestoItem> items = dto.getItems().stream().map(itemDto -> {
                PresupuestoItem item = new PresupuestoItem();
                item.setProductoId(itemDto.getProductoId());
                item.setCantidad(itemDto.getCantidad());
                item.setPrecioUnitario(itemDto.getPrecioUnitario());
                item.setTotalItem(itemDto.getTotalItem());
                item.setPresupuesto(presupuesto);
                return item;
            }).collect(Collectors.toList());
            presupuesto.setItems(items);
        }

        return presupuesto;
    }

    public PresupuestoResponseDTO toDTO(Presupuesto presupuesto) {
        PresupuestoResponseDTO dto = new PresupuestoResponseDTO();
        dto.setId(presupuesto.getId());
        dto.setClienteId(presupuesto.getClienteId());
        dto.setFechaCreacion(presupuesto.getFechaCreacion().atStartOfDay());
        dto.setEstado(presupuesto.getEstado());
        dto.setTipoEvento(presupuesto.getTipoEvento());
        dto.setComentarios(presupuesto.getComentarios());
        dto.setGananciaEstimada(presupuesto.getGananciaEstimada());

        if (presupuesto.getItems() != null) {
            List<PresupuestoItemDTO> items = presupuesto.getItems().stream().map(item -> {
                PresupuestoItemDTO itemDto = new PresupuestoItemDTO();
                itemDto.setProductoId(item.getProductoId());
                itemDto.setCantidad(item.getCantidad());
                itemDto.setPrecioUnitario(item.getPrecioUnitario());
                itemDto.setTotalItem(item.getTotalItem());
                return itemDto;
            }).collect(Collectors.toList());
            dto.setItems(items);
        }

        return dto;
    }
}
