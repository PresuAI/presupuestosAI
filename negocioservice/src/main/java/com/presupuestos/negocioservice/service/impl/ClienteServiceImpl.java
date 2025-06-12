package com.presupuestos.negocioservice.service.impl;

import com.presupuestos.negocioservice.dto.ClienteRequestDTO;
import com.presupuestos.negocioservice.dto.ClienteResponseDTO;
import com.presupuestos.negocioservice.mapper.ClienteMapper;
import com.presupuestos.negocioservice.model.Cliente;
import com.presupuestos.negocioservice.repository.ClienteRepository;
import com.presupuestos.negocioservice.service.ClienteService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ClienteServiceImpl implements ClienteService {

    private final ClienteRepository clienteRepository;

    public ClienteServiceImpl(ClienteRepository clienteRepository) {
        this.clienteRepository = clienteRepository;
    }

    @Override
    @Transactional
    public ClienteResponseDTO registrarCliente(ClienteRequestDTO dto) {
        Cliente cliente = ClienteMapper.toEntity(dto);
        cliente = clienteRepository.save(cliente);
        return ClienteMapper.toDTO(cliente);
    }
}