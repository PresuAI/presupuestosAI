package com.presupuestos.negocioservice.service.impl;

import com.presupuestos.negocioservice.dto.ClienteRequestDTO;
import com.presupuestos.negocioservice.dto.ClienteResponseDTO;
import com.presupuestos.negocioservice.mapper.ClienteMapper;
import com.presupuestos.negocioservice.model.Cliente;
import com.presupuestos.negocioservice.repository.ClienteRepository;
import com.presupuestos.negocioservice.service.ClienteService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ClienteServiceImpl implements ClienteService {

    private final ClienteRepository clienteRepository;
    private final ClienteMapper clienteMapper;

    public ClienteServiceImpl(ClienteRepository clienteRepository, ClienteMapper clienteMapper) {
        this.clienteRepository = clienteRepository;
        this.clienteMapper = clienteMapper;
    }

    @Override
    @Transactional
    public ClienteResponseDTO registrarCliente(ClienteRequestDTO dto) {
        if (clienteRepository.existsByRut(dto.getRut())) {
            throw new IllegalArgumentException("Ya existe un cliente con ese RUT.");
        }

        Cliente cliente = ClienteMapper.toEntity(dto);
        cliente = clienteRepository.save(cliente);
        return clienteMapper.toDTO(cliente);
    }

    @Override
    public List<ClienteResponseDTO> obtenerTodos() {
        return clienteRepository.findAll()
                .stream()
                .map(clienteMapper::toDTO)
                .collect(Collectors.toList());
    }
}