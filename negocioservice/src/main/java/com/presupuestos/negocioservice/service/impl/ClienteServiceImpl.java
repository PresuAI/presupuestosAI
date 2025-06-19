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
import java.util.NoSuchElementException;
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

    @Override
    @Transactional
    public void eliminarCliente(Long id) {
        if (!clienteRepository.existsById(id)) {
            throw new NoSuchElementException("Cliente no encontrado con ID: " + id);
        }

        clienteRepository.deleteById(id);
    }

    @Override
    @Transactional
    public ClienteResponseDTO actualizarCliente(Long id, ClienteRequestDTO dto) {
        Cliente cliente = clienteRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Cliente no encontrado con ID: " + id));

        if (clienteRepository.existsByEmail(dto.getEmail()) && !cliente.getEmail().equals(dto.getEmail())) {
            throw new IllegalArgumentException("Ya existe un cliente con ese email.");
        }

        if (clienteRepository.existsByRut(dto.getRut()) && !cliente.getRut().equals(dto.getRut())) {
            throw new IllegalArgumentException("Ya existe un cliente con ese RUT.");
        }

        cliente.setNombre(dto.getNombre());
        cliente.setEmail(dto.getEmail());
        cliente.setTelefono(dto.getTelefono());
        cliente.setRut(dto.getRut());

        cliente = clienteRepository.save(cliente);

        return clienteMapper.toDTO(cliente);
    }
}