package com.presupuestos.negocioservice.mapper;

import com.presupuestos.negocioservice.dto.ClienteRequestDTO;
import com.presupuestos.negocioservice.dto.ClienteResponseDTO;
import com.presupuestos.negocioservice.model.Cliente;
import org.springframework.stereotype.Component;

@Component
public class ClienteMapper {

    public static Cliente toEntity(ClienteRequestDTO dto) {
        return new Cliente(dto.getNombre(), dto.getRut(), dto.getEmail(), dto.getTelefono(), true);
    }

    public ClienteResponseDTO toDTO(Cliente cliente) {
        ClienteResponseDTO dto = new ClienteResponseDTO();
        dto.setId(cliente.getId());
        dto.setNombre(cliente.getNombre());
        dto.setRut(cliente.getRut());
        dto.setEmail(cliente.getEmail());
        dto.setTelefono(cliente.getTelefono());
        dto.setActivo(cliente.isActivo());
        return dto;
    }
}